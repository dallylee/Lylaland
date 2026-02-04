/**
 * Discovery System Types
 * Supports multi-step discoveries, advanced interactions, and time windows
 */

// ============================================================================
// Interaction Types
// ============================================================================

export interface TapInteraction {
    kind: 'tap';
}

export interface MultiTapInteraction {
    kind: 'multiTap';
    taps: number;
    maxIntervalMs: number;
}

export interface LongPressInteraction {
    kind: 'longPress';
    holdMs: number;
}

export interface HoldThenStirInteraction {
    kind: 'holdThenStir';
    holdMs: number;
    stirTurns: number;
    stirRadiusPx: number;
    stirMaxDurationMs: number;
}

export type Interaction =
    | TapInteraction
    | MultiTapInteraction
    | LongPressInteraction
    | HoldThenStirInteraction;

// ============================================================================
// Step Types
// ============================================================================

export interface HotspotStep {
    type: 'hotspot';
    realm: string;
    hotspotId: string;
    interaction: Interaction;
}

export interface RealmOpenedStep {
    type: 'realmOpened';
    realm: string;
}

export type DiscoveryStep = HotspotStep | RealmOpenedStep;

// ============================================================================
// Time Window Types
// ============================================================================

export interface TimeWindow {
    type: 'noon' | 'evening';
    fallbackHours: number;
}

// ============================================================================
// Clue Type
// ============================================================================

export interface Clue {
    id: string;
    text: string;
    realm: string;
    difficulty: number;
    cooldownDays: number;
    timeWindow: TimeWindow | null;
    targetHotspotId: string; // Legacy compatibility
    steps: DiscoveryStep[];
}

// ============================================================================
// Active Discovery Sequence State
// ============================================================================

export interface ActiveDiscoverySequence {
    clueId: string;
    stepIndex: number;
    startedAtMs: number;
    expiresAtMs: number | null;
    // For multi-tap tracking
    tapCount?: number;
    lastTapMs?: number;
    // For long-press / holdThenStir tracking
    holdStartMs?: number;
    stirStarted?: boolean;
    stirAngleAccumulated?: number;
    stirLastPoint?: { x: number; y: number };
}

// ============================================================================
// Time Window Utilities
// ============================================================================

/**
 * Check if current local time is within a time window
 * Uses device's local timezone
 */
export function isWithinTimeWindow(window: TimeWindow | null, nowMs: number = Date.now()): boolean {
    if (!window) return true; // No window restriction

    const date = new Date(nowMs);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    switch (window.type) {
        case 'noon':
            // 11:30 to 12:30 local time (690 to 750 minutes)
            return totalMinutes >= 690 && totalMinutes <= 750;
        case 'evening':
            // 18:00 to 21:00 local time (1080 to 1260 minutes)
            return totalMinutes >= 1080 && totalMinutes <= 1260;
        default:
            return true;
    }
}

/**
 * Check if we're in fallback window (after main window, within fallbackHours)
 */
export function isWithinFallbackWindow(window: TimeWindow | null, nowMs: number = Date.now()): boolean {
    if (!window) return true;

    const date = new Date(nowMs);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    let windowEndMinutes: number;
    switch (window.type) {
        case 'noon':
            windowEndMinutes = 750; // 12:30
            break;
        case 'evening':
            windowEndMinutes = 1260; // 21:00
            break;
        default:
            return true;
    }

    // Calculate fallback end time
    const fallbackEndMinutes = windowEndMinutes + (window.fallbackHours * 60);

    // Handle day wrap-around
    if (fallbackEndMinutes > 1440) {
        // Extends past midnight
        const wrappedEnd = fallbackEndMinutes - 1440;
        return totalMinutes >= windowEndMinutes || totalMinutes <= wrappedEnd;
    }

    return totalMinutes > windowEndMinutes && totalMinutes <= fallbackEndMinutes;
}

/**
 * Check if time window is currently valid (in main window OR fallback)
 */
export function canAttemptTimeWindow(window: TimeWindow | null, nowMs: number = Date.now()): boolean {
    return isWithinTimeWindow(window, nowMs) || isWithinFallbackWindow(window, nowMs);
}

/**
 * Get expiration timestamp for a time window (end of fallback period)
 */
export function getTimeWindowExpirationMs(window: TimeWindow | null, startMs: number = Date.now()): number | null {
    if (!window) return null;

    const date = new Date(startMs);
    let windowEndMinutes: number;

    switch (window.type) {
        case 'noon':
            windowEndMinutes = 750; // 12:30
            break;
        case 'evening':
            windowEndMinutes = 1260; // 21:00
            break;
        default:
            return null;
    }

    // Set to window end time today
    const expirationDate = new Date(date);
    expirationDate.setHours(Math.floor(windowEndMinutes / 60), windowEndMinutes % 60, 0, 0);

    // Add fallback hours
    expirationDate.setTime(expirationDate.getTime() + window.fallbackHours * 60 * 60 * 1000);

    // If expiration is in the past, move to tomorrow
    if (expirationDate.getTime() < startMs) {
        expirationDate.setDate(expirationDate.getDate() + 1);
    }

    return expirationDate.getTime();
}
