import React, { useState, useEffect } from 'react';
import './RealmStyles.css';
import MediaCard from '../components/MediaCard';
import { searchArchive, ArchiveItem } from '../services/archiveSearch';
import { db } from '../services/db';

// Import seed data
import bookSeeds from '../content/media_books_seed.json';
import videoSeeds from '../content/media_youtube_seed.json';

type Tab = 'featured' | 'books' | 'videos' | 'search' | 'completed';

function MediaRealm() {
    const [activeTab, setActiveTab] = useState<Tab>('featured');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ArchiveItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [completedItems, setCompletedItems] = useState<string[]>([]);

    // Load completed items on mount
    useEffect(() => {
        const loadCompleted = async () => {
            const completed = await db.mediaCompletions.toArray();
            setCompletedItems(completed.map(c => c.mediaId));
        };
        loadCompleted();

        // Subscribe to DB changes to keep "Completed" tab in sync
        const interval = setInterval(loadCompleted, 5000); // Simple polling for now
        return () => clearInterval(interval);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        setActiveTab('search');

        try {
            // Check cache first
            const cached = await db.mediaSearchCache.get(searchQuery);
            if (cached && (Date.now() - cached.timestamp < 3600000)) { // 1 hour cache
                setSearchResults(cached.results);
                setIsSearching(false);
                return;
            }

            const result = await searchArchive(searchQuery);
            setSearchResults(result.items);

            // Update cache
            await db.mediaSearchCache.put({
                query: searchQuery,
                results: result.items,
                timestamp: Date.now()
            });
        } catch (err: any) {
            setSearchError(err.message || 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const renderGrid = (items: any[]) => (
        <div className="media-grid">
            {items.map((item) => (
                <MediaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    type={item.type || (item.id.startsWith('ia:') ? 'book' : 'video')}
                    coverImage={item.coverImage}
                    category={item.category}
                    about={item.about || item.description}
                    identifier={item.identifier}
                    videoId={item.videoId}
                    isCompletedInitial={completedItems.includes(item.id)}
                />
            ))}
            {items.length === 0 && <p className="no-items">No items found in this section.</p>}
        </div>
    );

    const getCompletedContent = () => {
        const allSeeds = [...bookSeeds, ...videoSeeds];
        const completedSeeds = allSeeds.filter(s => completedItems.includes(s.id));
        const completedArchive = searchResults.filter(r => completedItems.includes(r.id));

        // Combine and deduplicate
        const uniqueItems = [...completedSeeds];
        completedArchive.forEach(item => {
            if (!uniqueItems.some(u => u.id === item.id)) {
                uniqueItems.push(item as any);
            }
        });

        return renderGrid(uniqueItems);
    };

    return (
        <div className="realm media-realm">
            <div className="realm-header">
                <h1 className="realm-title gradient-text">📚 Media Center</h1>
                <p className="realm-subtitle">Stories, Lessons & Magic</p>

                <form className="search-bar glass" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search for a book or story..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" disabled={isSearching}>
                        {isSearching ? '...' : '🔍'}
                    </button>
                </form>
            </div>

            <nav className="realm-tabs">
                <button className={activeTab === 'featured' ? 'active' : ''} onClick={() => setActiveTab('featured')}>Featured</button>
                <button className={activeTab === 'books' ? 'active' : ''} onClick={() => setActiveTab('books')}>Books</button>
                <button className={activeTab === 'videos' ? 'active' : ''} onClick={() => setActiveTab('videos')}>Videos</button>
                <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => setActiveTab('completed')}>⭐ Done ({completedItems.length})</button>
                {searchResults.length > 0 && (
                    <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>Results</button>
                )}
            </nav>

            <div className="realm-scroll-section">
                {activeTab === 'featured' && (
                    <div className="featured-section">
                        <h2 className="section-title">✨ Recommended for You</h2>
                        {renderGrid([...bookSeeds.slice(0, 3), ...videoSeeds.slice(0, 3)])}
                    </div>
                )}

                {activeTab === 'books' && (
                    <div className="books-section">
                        <h2 className="section-title">📖 Magical Library</h2>
                        {renderGrid(bookSeeds as any)}
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="videos-section">
                        <h2 className="section-title">🎬 Enchanting Videos</h2>
                        {renderGrid(videoSeeds as any)}
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="search-section">
                        <h2 className="section-title">🔍 Search Results for "{searchQuery}"</h2>
                        {isSearching ? (
                            <div className="loading-spinner">✨ Casting search spell... ✨</div>
                        ) : searchError ? (
                            <div className="error-message">{searchError}</div>
                        ) : (
                            renderGrid(searchResults)
                        )}
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="completed-section">
                        <h2 className="section-title">⭐ Your Collection</h2>
                        {getCompletedContent()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MediaRealm;
