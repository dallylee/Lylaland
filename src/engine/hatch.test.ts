import { ProgressionEngine } from './ProgressionEngine';

describe('Egg Hatch Logic', () => {
    beforeEach(async () => {
        // Reset state before each test
        await ProgressionEngine.resetForTests();
    });

    it('should trigger hatch when 20 magic items are collected', () => {
        const state = ProgressionEngine.getState();
        // Add 20 items (excluding owl/dragon_egg)
        for (let i = 1; i <= 20; i++) {
            const itemId = `item_${i.toString().padStart(2, '0')}`;
            state.inventory.push(itemId);
        }

        // We need to trigger an event to run checkEggHatch
        const result = ProgressionEngine.processEvent({ type: 'game_played' });

        expect(result.eggHatchTriggered).toBe(true);
    });

    it('should not trigger hatch if less than 20 items', () => {
        const state = ProgressionEngine.getState();
        // Add 19 items
        for (let i = 1; i <= 19; i++) {
            const itemId = `item_${i.toString().padStart(2, '0')}`;
            state.inventory.push(itemId);
        }

        const result = ProgressionEngine.processEvent({ type: 'game_played' });

        expect(result.eggHatchTriggered).toBe(false);
    });

    it('should not trigger hatch again once seen', () => {
        const state = ProgressionEngine.getState();
        // Add 20 items
        for (let i = 1; i <= 20; i++) {
            const itemId = `item_${i.toString().padStart(2, '0')}`;
            state.inventory.push(itemId);
        }

        // Mark as seen
        ProgressionEngine.processEvent({ type: 'hatch_cinematic_seen' });

        // Trigger check
        const result = ProgressionEngine.processEvent({ type: 'game_played' });

        expect(result.eggHatchTriggered).toBe(false);
        expect(ProgressionEngine.getState().discovery.hatchSeen).toBe(true);
    });

    it('should persist hatchSeen state across reloads', async () => {
        // Mark as seen
        ProgressionEngine.processEvent({ type: 'hatch_cinematic_seen' });

        // Reload engine
        await ProgressionEngine.init();

        expect(ProgressionEngine.getState().discovery.hatchSeen).toBe(true);
    });
});
