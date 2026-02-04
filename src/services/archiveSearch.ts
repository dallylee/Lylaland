/**
 * Archive.org Search Service
 * Provides client-side searching for public domain books and audiobooks.
 */

export interface ArchiveItem {
    id: string; // ia:<identifier>
    title: string;
    identifier: string;
    description?: string;
    creator?: string;
    year?: string;
    mediatype?: string;
    coverImage?: string;
}

export interface SearchResult {
    items: ArchiveItem[];
    total: number;
}

export type SearchErrorCode = 'OFFLINE' | 'FETCH_ERROR' | 'PARSE_ERROR';

export class SearchError extends Error {
    constructor(public message: string, public code: SearchErrorCode) {
        super(message);
        this.name = 'SearchError';
    }
}

const BASE_URL = 'https://archive.org/advancedsearch.php';

/**
 * Construct the Archive.org advancedsearch URL
 */
function buildSearchUrl(query: string, limit: number = 20): string {
    const filters = '(mediatype:texts OR mediatype:audio)';
    const fullQuery = `${query} AND ${filters}`;

    const params = new URLSearchParams({
        q: fullQuery,
        'fl[]': 'identifier,title,creator,year,mediatype,description',
        sort: 'downloads desc',
        rows: limit.toString(),
        output: 'json'
    });

    return `${BASE_URL}?${params.toString()}`;
}

/**
 * Parse Archive.org response into typed items
 */
function parseResponse(data: any): ArchiveItem[] {
    if (!data?.response?.docs) return [];

    return data.response.docs.map((doc: any) => ({
        id: `ia:${doc.identifier}`,
        identifier: doc.identifier,
        title: doc.title || 'Untitled',
        description: doc.description || '',
        creator: doc.creator || 'Unknown',
        year: doc.year || '',
        mediatype: doc.mediatype || 'texts',
        coverImage: `https://archive.org/services/img/${doc.identifier}`
    }));
}

/**
 * Execute search on Archive.org
 */
export async function searchArchive(query: string): Promise<SearchResult> {
    if (!navigator.onLine) {
        throw new SearchError('You are offline. Please check your connection.', 'OFFLINE');
    }

    try {
        const url = buildSearchUrl(query);
        const response = await fetch(url);

        if (!response.ok) {
            throw new SearchError(`Archive.org returned error: ${response.status}`, 'FETCH_ERROR');
        }

        const data = await response.json();
        const items = parseResponse(data);

        return {
            items,
            total: data.response?.numFound || 0
        };
    } catch (error) {
        if (error instanceof SearchError) throw error;

        console.error('[ArchiveSearch] Fetch failed:', error);
        throw new SearchError('Failed to fetch from Archive.org', 'FETCH_ERROR');
    }
}

/**
 * Helper to build embed URL for Archive.org items
 */
export function getArchiveEmbedUrl(identifier: string): string {
    return `https://archive.org/embed/${identifier}`;
}
