/**
 * Item Placement Map
 * Maps itemId to slotId for trophy room display
 */

export interface ItemPlacement {
    itemId: string;
    slotId: string;
}

/**
 * Default item placements
 * Maps inventory itemIds to their display slots
 */
export const ITEM_PLACEMENTS: ItemPlacement[] = [
    // Starter items
    { itemId: 'owl', slotId: 'ts_p2' },
    { itemId: 'egg', slotId: 'bs_p2' },

    // Collectibles - top shelf
    { itemId: 'crystal', slotId: 'ts_p1' },
    { itemId: 'wand', slotId: 'ts_p3' },

    // Collectibles - shelves
    { itemId: 'book1', slotId: 's1_p1' },
    { itemId: 'potion1', slotId: 's1_p2' },
    { itemId: 'gem1', slotId: 's1_p3' },
    { itemId: 'hat', slotId: 's1_p4' },

    { itemId: 'book2', slotId: 's2_p1' },
    { itemId: 'potion2', slotId: 's2_p2' },
    { itemId: 'gem2', slotId: 's2_p3' },
    { itemId: 'scroll', slotId: 's2_p4' },

    { itemId: 'trophy1', slotId: 'bs_p1' },
    { itemId: 'trophy2', slotId: 'bs_p3' },

    // Tower items
    { itemId: 'stone1', slotId: 'lt_stone_p1' },
    { itemId: 'lantern1', slotId: 'lt_tower_p1' },
    { itemId: 'stone2', slotId: 'rt_stone_p1' },
    { itemId: 'lantern2', slotId: 'rt_tower_p1' },
];

/**
 * Get the slotId for a given itemId
 */
export function getSlotForItem(itemId: string): string | undefined {
    const placement = ITEM_PLACEMENTS.find(p => p.itemId === itemId);
    return placement?.slotId;
}

/**
 * Build a map of slotId -> itemId from inventory
 */
export function buildSlotItemMap(inventory: string[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const itemId of inventory) {
        const slotId = getSlotForItem(itemId);
        if (slotId) {
            map.set(slotId, itemId);
        }
    }
    return map;
}
