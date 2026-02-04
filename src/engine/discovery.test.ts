/**
 * Discovery System Tests
 * Tests for multi-step discoveries, time windows, and interactions
 */

import {
    isWithinTimeWindow,
    isWithinFallbackWindow,
    canAttemptTimeWindow,
    getTimeWindowExpirationMs,
} from '../types/discovery';

// Mock clues data
jest.mock('../content/clues.json', () => [
    {
        id: 'test_single_step',
        text: 'Test single step clue',
        realm: 'home',
        difficulty: 1,
        cooldownDays: 0,
        timeWindow: null,
        targetHotspotId: 'home_arch_window',
        steps: [
            {
                type: 'hotspot',
                realm: 'home',
                hotspotId: 'home_arch_window',
                interaction: { kind: 'tap' },
            },
        ],
    },
    {
        id: 'test_multi_step',
        text: 'Test multi-step clue',
        realm: 'home',
        difficulty: 2,
        cooldownDays: 0,
        timeWindow: null,
        targetHotspotId: 'home_arch_window',
        steps: [
            {
                type: 'hotspot',
                realm: 'media',
                hotspotId: 'media_red_book',
                interaction: { kind: 'tap' },
            },
            {
                type: 'realmOpened',
                realm: 'home',
            },
            {
                type: 'hotspot',
                realm: 'home',
                hotspotId: 'home_arch_window',
                interaction: { kind: 'tap' },
            },
        ],
    },
    {
        id: 'test_noon_window',
        text: 'Test noon time window',
        realm: 'home',
        difficulty: 3,
        cooldownDays: 0,
        timeWindow: { type: 'noon', fallbackHours: 24 },
        targetHotspotId: 'home_right_tower_ledge',
        steps: [
            {
                type: 'hotspot',
                realm: 'home',
                hotspotId: 'home_right_tower_ledge',
                interaction: { kind: 'tap' },
            },
        ],
    },
]);

describe('Time Window Utils', () => {
    describe('isWithinTimeWindow', () => {
        it('returns true when no window specified', () => {
            expect(isWithinTimeWindow(null)).toBe(true);
        });

        it('returns true during noon window (11:30-12:30)', () => {
            // Create a date at 12:00 noon
            const noonDate = new Date();
            noonDate.setHours(12, 0, 0, 0);
            expect(isWithinTimeWindow({ type: 'noon', fallbackHours: 24 }, noonDate.getTime())).toBe(true);
        });

        it('returns false outside noon window', () => {
            // Create a date at 10:00 AM
            const morningDate = new Date();
            morningDate.setHours(10, 0, 0, 0);
            expect(isWithinTimeWindow({ type: 'noon', fallbackHours: 24 }, morningDate.getTime())).toBe(false);
        });

        it('returns true during evening window (18:00-21:00)', () => {
            // Create a date at 19:00
            const eveningDate = new Date();
            eveningDate.setHours(19, 0, 0, 0);
            expect(isWithinTimeWindow({ type: 'evening', fallbackHours: 24 }, eveningDate.getTime())).toBe(true);
        });

        it('returns false outside evening window', () => {
            // Create a date at 22:00
            const lateDate = new Date();
            lateDate.setHours(22, 0, 0, 0);
            expect(isWithinTimeWindow({ type: 'evening', fallbackHours: 24 }, lateDate.getTime())).toBe(false);
        });
    });

    describe('isWithinFallbackWindow', () => {
        it('returns true after noon window ends within fallback', () => {
            // Create a date at 13:00 (after noon, within 24h fallback)
            const afterNoonDate = new Date();
            afterNoonDate.setHours(13, 0, 0, 0);
            expect(isWithinFallbackWindow({ type: 'noon', fallbackHours: 24 }, afterNoonDate.getTime())).toBe(true);
        });

        it('returns true after evening window ends within fallback', () => {
            // Create a date at 22:00 (after evening, within 24h fallback)
            const afterEveningDate = new Date();
            afterEveningDate.setHours(22, 0, 0, 0);
            expect(isWithinFallbackWindow({ type: 'evening', fallbackHours: 24 }, afterEveningDate.getTime())).toBe(true);
        });
    });

    describe('canAttemptTimeWindow', () => {
        it('returns true when no window', () => {
            expect(canAttemptTimeWindow(null)).toBe(true);
        });

        it('returns true during main window', () => {
            const noonDate = new Date();
            noonDate.setHours(12, 0, 0, 0);
            expect(canAttemptTimeWindow({ type: 'noon', fallbackHours: 24 }, noonDate.getTime())).toBe(true);
        });

        it('returns true during fallback window', () => {
            const afterNoonDate = new Date();
            afterNoonDate.setHours(14, 0, 0, 0);
            expect(canAttemptTimeWindow({ type: 'noon', fallbackHours: 24 }, afterNoonDate.getTime())).toBe(true);
        });
    });

    describe('getTimeWindowExpirationMs', () => {
        it('returns null when no window', () => {
            expect(getTimeWindowExpirationMs(null)).toBeNull();
        });

        it('returns expiration time for noon window', () => {
            const noonDate = new Date();
            noonDate.setHours(12, 0, 0, 0);
            const expiration = getTimeWindowExpirationMs({ type: 'noon', fallbackHours: 24 }, noonDate.getTime());
            expect(expiration).not.toBeNull();
            // Should be approximately 24-25 hours from noon (12:30 + 24h)
            if (expiration) {
                const expirationDate = new Date(expiration);
                expect(expirationDate.getHours()).toBe(12); // 12:30 + 24h = 12:30 next day
            }
        });
    });
});

describe('Clues Data', () => {
    it('should have valid clue structure', () => {
        const clues = require('../content/clues.json');
        expect(Array.isArray(clues)).toBe(true);
        expect(clues.length).toBeGreaterThan(0);

        for (const clue of clues) {
            expect(clue.id).toBeDefined();
            expect(clue.text).toBeDefined();
            expect(clue.realm).toBeDefined();
            expect(clue.steps).toBeDefined();
            expect(Array.isArray(clue.steps)).toBe(true);
            expect(clue.steps.length).toBeGreaterThan(0);
        }
    });

    it('should have valid step types', () => {
        const clues = require('../content/clues.json');
        const validStepTypes = ['hotspot', 'realmOpened'];
        const validInteractionKinds = ['tap', 'multiTap', 'longPress', 'holdThenStir'];

        for (const clue of clues) {
            for (const step of clue.steps) {
                expect(validStepTypes).toContain(step.type);

                if (step.type === 'hotspot') {
                    expect(step.hotspotId).toBeDefined();
                    expect(step.realm).toBeDefined();
                    expect(step.interaction).toBeDefined();
                    expect(validInteractionKinds).toContain(step.interaction.kind);
                }

                if (step.type === 'realmOpened') {
                    expect(step.realm).toBeDefined();
                }
            }
        }
    });

    it('should have valid time window format', () => {
        const clues = require('../content/clues.json');
        const validTimeWindowTypes = ['noon', 'evening'];

        for (const clue of clues) {
            if (clue.timeWindow !== null) {
                expect(validTimeWindowTypes).toContain(clue.timeWindow.type);
                expect(typeof clue.timeWindow.fallbackHours).toBe('number');
            }
        }
    });
});
