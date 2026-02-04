import { ProgressionEngine } from './ProgressionEngine';
import { ProgressionConfig } from '../config/progressionConfig';

describe('Media Progression', () => {
    beforeEach(async () => {
        await ProgressionEngine.init();
        // Reset state for test
        const state = ProgressionEngine.getState();
        state.totals.goldStars = 0;
        state.totals.lifetimeGoldStars = 0;
        state.dailyCounts.dailyCappedStars = 0;
    });

    test('should award 1 gold star for media interaction', () => {
        const result = ProgressionEngine.processEvent({
            type: 'media_done',
            payload: { clueId: 'test_media' }
        });

        expect(result.starsAwarded).toBe(1);
        expect(result.newState.totals.goldStars).toBe(1);
        expect(result.soundCues).toContain('star_win');
    });

    test('should respect daily cap for media stars', () => {
        const cap = ProgressionConfig.dailyCaps.dailyGoldCap;

        // Award stars up to cap
        for (let i = 0; i < cap; i++) {
            ProgressionEngine.processEvent({ type: 'media_done' });
        }

        const stateAfterCap = ProgressionEngine.getState();
        expect(stateAfterCap.totals.goldStars).toBe(cap);

        // One more interaction - should be capped
        const result = ProgressionEngine.processEvent({ type: 'media_done' });
        expect(result.starsAwarded).toBe(0);
        expect(ProgressionEngine.getState().totals.goldStars).toBe(cap);
    });
});
