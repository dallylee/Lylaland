/**
 * Hotspot Registry
 * Defines all hotspot locations for each realm
 */

export interface HotspotDefinition {
    id: string;
    realm: string;
    x: number;
    y: number;
    width: number;
    height: number;
    description?: string;
}

/**
 * All hotspot definitions keyed by realm
 */
export const hotspotRegistry: Record<string, HotspotDefinition[]> = {
    home: [
        {
            id: 'home_arch_window',
            realm: 'home',
            x: 180,
            y: 200,
            width: 80,
            height: 100,
            description: 'The arch window in the castle',
        },
        {
            id: 'home_moon',
            realm: 'home',
            x: 280,
            y: 50,
            width: 60,
            height: 60,
            description: 'The moon in the sky',
        },
        {
            id: 'home_left_tower_ledge',
            realm: 'home',
            x: 50,
            y: 300,
            width: 80,
            height: 40,
            description: 'The ledge on the left tower',
        },
        {
            id: 'home_right_tower_ledge',
            realm: 'home',
            x: 310,
            y: 300,
            width: 80,
            height: 40,
            description: 'The ledge on the right tower',
        },
    ],
    media: [
        {
            id: 'media_red_book',
            realm: 'media',
            x: 150,
            y: 350,
            width: 70,
            height: 90,
            description: 'The red book on the shelf',
        },
    ],
    diary: [
        {
            id: 'diary_corner_seal',
            realm: 'diary',
            x: 330,
            y: 650,
            width: 50,
            height: 50,
            description: 'The wax seal in the corner',
        },
    ],
    games: [
        {
            id: 'games_archery_target',
            realm: 'games',
            x: 170,
            y: 280,
            width: 100,
            height: 100,
            description: 'The archery target bullseye',
        },
    ],
    crafts: [
        {
            id: 'crafts_cauldron',
            realm: 'crafts',
            x: 150,
            y: 400,
            width: 120,
            height: 100,
            description: 'The magical cauldron',
        },
    ],
};

/**
 * Get all hotspots for a realm
 */
export function getHotspotsForRealm(realm: string): HotspotDefinition[] {
    return hotspotRegistry[realm] || [];
}

/**
 * Get a specific hotspot by ID
 */
export function getHotspotById(hotspotId: string): HotspotDefinition | null {
    for (const realm of Object.keys(hotspotRegistry)) {
        const hotspot = hotspotRegistry[realm].find(h => h.id === hotspotId);
        if (hotspot) return hotspot;
    }
    return null;
}

/**
 * Get all hotspot IDs
 */
export function getAllHotspotIds(): string[] {
    const ids: string[] = [];
    for (const realm of Object.keys(hotspotRegistry)) {
        for (const hotspot of hotspotRegistry[realm]) {
            ids.push(hotspot.id);
        }
    }
    return ids;
}
