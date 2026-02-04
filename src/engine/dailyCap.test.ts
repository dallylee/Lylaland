import { ProgressionEngine } from './ProgressionEngine';
import { ProgressionConfig } from '../config/progressionConfig';

describe('Daily Cap Logic', () => {
    beforeEach(async () => {
        await ProgressionEngine.resetForTests();
    });

    it('should award stars for games and media up to the cap', () => {
        // Default cap is 10. gameSessionComplete gives 1 star.
        for (let i = 0; i < 10; i++) {
            const result = ProgressionEngine.processEvent({ type: 'game_played' });
            expect(result.starsAwarded).toBe(1);
        }

        // 11th game should give 0 stars
        const result11 = ProgressionEngine.processEvent({ type: 'game_played' });
        expect(result11.starsAwarded).toBe(0);
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(10);
    });

    it('should include crafts in the daily cap', () => {
        // 3 games (3 stars)
        ProgressionEngine.processEvent({ type: 'game_played' });
        ProgressionEngine.processEvent({ type: 'game_played' });
        ProgressionEngine.processEvent({ type: 'game_played' });
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(3);

        // 2 crafts (3 stars each = 6 stars)
        ProgressionEngine.processEvent({ type: 'craft_completed' });
        ProgressionEngine.processEvent({ type: 'craft_completed' });
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(9);

        // 3rd craft should only give 1 star to reach the 10 star cap
        const result = ProgressionEngine.processEvent({ type: 'craft_completed' });
        expect(result.starsAwarded).toBe(1);
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(10);

        // 4th craft should give 0
        const result2 = ProgressionEngine.processEvent({ type: 'craft_completed' });
        expect(result2.starsAwarded).toBe(0);
    });

    it('should allow owl rewards to bypass the cap', () => {
        // Reach cap
        for (let i = 0; i < 10; i++) {
            ProgressionEngine.processEvent({ type: 'game_played' });
        }
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(10);

        // Owl reward (8 stars)
        const result = ProgressionEngine.processEvent({
            type: 'owl_riddle_correct',
            payload: { riddleId: 'test_riddle' }
        });
        expect(result.starsAwarded).toBe(8);
        // dailyCappedStars should still be 10 (not increased by owl)
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(10);
        expect(ProgressionEngine.getState().totals.goldStars).toBe(18);
    });

    it('should reset the cap on a new local day', () => {
        // Reach cap
        for (let i = 0; i < 10; i++) {
            ProgressionEngine.processEvent({ type: 'game_played' });
        }
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(10);

        // Mock a different day
        const state = ProgressionEngine.getState();
        state.dailyCounts.date = '2000-01-01'; // Ancient history

        // This is tricky because processEvent uses new Date() internally.
        // But handleCappedSource checks if current date !== today.
        // Today is generated inside the function.

        const result = ProgressionEngine.processEvent({ type: 'game_played' });
        expect(result.starsAwarded).toBe(1);
        expect(ProgressionEngine.getState().dailyCounts.dailyCappedStars).toBe(1);
        expect(ProgressionEngine.getState().dailyCounts.date).not.toBe('2000-01-01');
    });
});
