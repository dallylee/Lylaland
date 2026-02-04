/**
 * Trophy Slots Configuration
 * Anchor-based slot positions for the trophy room
 */

export interface SlotAnchor {
    id: string;
    anchorX: number;
    anchorY: number;
    hitW: number;
    hitH: number;
}

export interface SlotRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// Base dimensions for the layout
export const BASE_W = 390;
export const BASE_H = 844;

// Offset for "sitting" items on shelf lips
export const SIT_OFFSET = 8;

// SHELF_LIPS Constants
export const SHELF_LIPS = {
    TOP: 380,
    SHELF3: 470,
    SHELF2: 564,
    SHELF1: 653,
    BOTTOM: 735,
} as const;

// TROPHY_SLOTS Array
export const TROPHY_SLOTS: SlotAnchor[] = [
    {
        "id": "ts_p1",
        "anchorX": 117,
        "anchorY": 372,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "ts_p2",
        "anchorX": 190,
        "anchorY": 372,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "ts_p3",
        "anchorX": 268,
        "anchorY": 370,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "ts_owl",
        "anchorX": 25,
        "anchorY": 723,
        "hitW": 50,
        "hitH": 70
    },
    {
        "id": "lt_stone_p1",
        "anchorX": 30,
        "anchorY": 342,
        "hitW": 25,
        "hitH": 40
    },
    {
        "id": "lt_tower_p1",
        "anchorX": 27,
        "anchorY": 463,
        "hitW": 25,
        "hitH": 40
    },
    {
        "id": "rt_stone_p1",
        "anchorX": 359,
        "anchorY": 340,
        "hitW": 25,
        "hitH": 40
    },
    {
        "id": "rt_tower_p1",
        "anchorX": 365,
        "anchorY": 463,
        "hitW": 25,
        "hitH": 40
    },
    {
        "id": "s3_p1",
        "anchorX": 109,
        "anchorY": 466,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s3_p2",
        "anchorX": 164,
        "anchorY": 466,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s3_p3",
        "anchorX": 220,
        "anchorY": 466,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s3_p4",
        "anchorX": 276,
        "anchorY": 466,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s2_p1",
        "anchorX": 109,
        "anchorY": 556,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s2_p2",
        "anchorX": 164,
        "anchorY": 556,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s2_p3",
        "anchorX": 220,
        "anchorY": 555,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s2_p4",
        "anchorX": 276,
        "anchorY": 554,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s1_p1",
        "anchorX": 106,
        "anchorY": 646,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s1_p2",
        "anchorX": 163,
        "anchorY": 646,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s1_p3",
        "anchorX": 223,
        "anchorY": 646,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "s1_p4",
        "anchorX": 280,
        "anchorY": 646,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "bs_p1",
        "anchorX": 121,
        "anchorY": 724,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "bs_p2",
        "anchorX": 195,
        "anchorY": 724,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "bs_p3",
        "anchorX": 272,
        "anchorY": 724,
        "hitW": 50,
        "hitH": 60
    },
    {
        "id": "bs_egg",
        "anchorX": 359,
        "anchorY": 721,
        "hitW": 50,
        "hitH": 70
    }
];

/**
 * Get slot by ID
 */
export function getSlotById(id: string): SlotAnchor | undefined {
    return TROPHY_SLOTS.find(slot => slot.id === id);
}

/**
 * Get all slot IDs
 */
export function getAllSlotIds(): string[] {
    return TROPHY_SLOTS.map(slot => slot.id);
}

/**
 * Convert a slot anchor to a positioned rectangle
 */
export function getAnchorPosition(slot: SlotAnchor): SlotRect {
    return {
        x: slot.anchorX - slot.hitW / 2,
        y: slot.anchorY - slot.hitH,
        w: slot.hitW,
        h: slot.hitH,
    };
}

/**
 * Convert pixel to percent string for styling
 */
export function toPercent(px: number, base: number): string {
    return `${(px / base) * 100}%`;
}

/**
 * Get CSS style object for a slot
 */
export function getSlotStyle(slot: SlotAnchor, scale: number = 1): React.CSSProperties {
    const rect = getAnchorPosition(slot);
    return {
        position: 'absolute',
        left: toPercent(rect.x, BASE_W),
        top: toPercent(rect.y, BASE_H),
        width: toPercent(rect.w, BASE_W),
        height: toPercent(rect.h, BASE_H),
    };
}
