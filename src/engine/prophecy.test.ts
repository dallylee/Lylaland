import { ProgressionEngine } from './ProgressionEngine';
import { DEFAULT_STATE } from '../types/progression';

describe('Prophecy Engine Logic', () => {
    beforeEach(async () => {
        await ProgressionEngine.resetForTests();
    });

    it('should not offer a prophecy if mirror is not owned', () => {
        // Initially, mirror is not owned
        ProgressionEngine.processEvent({ type: 'app_opened' });
        expect(ProgressionEngine.isMirrorProphecyAvailable()).toBe(false);
    });

    it('should offer a prophecy when mirror is owned', async () => {
        // Unlock mirror
        await ProgressionEngine.debugUnlockItem('item_03_clueRelic');

        // Trigger app_opened to schedule prophecy
        ProgressionEngine.processEvent({ type: 'app_opened' });

        expect(ProgressionEngine.isMirrorProphecyAvailable()).toBe(true);
        expect(ProgressionEngine.getState().discovery.prophecyState).toBe('available');
        expect(ProgressionEngine.getState().discovery.prophecyClueId).toBeDefined();
    });

    it('should transition to showing when mirror is tapped', async () => {
        await ProgressionEngine.debugUnlockItem('item_03_clueRelic');
        ProgressionEngine.processEvent({ type: 'app_opened' });

        ProgressionEngine.processEvent({ type: 'prophecy_tapped' });

        const state = ProgressionEngine.getState();
        expect(state.discovery.prophecyState).toBe('showing');
        expect(state.discovery.pendingClueId).toBe(state.discovery.prophecyClueId);
    });

    it('should transition to active and set timer when clue is acknowledged', async () => {
        await ProgressionEngine.debugUnlockItem('item_03_clueRelic');
        ProgressionEngine.processEvent({ type: 'app_opened' });
        const clueId = ProgressionEngine.getState().discovery.prophecyClueId!;

        ProgressionEngine.processEvent({ type: 'prophecy_tapped' });
        ProgressionEngine.processEvent({
            type: 'clue_acknowledged',
            payload: { clueId }
        });

        const state = ProgressionEngine.getState();
        expect(state.discovery.prophecyState).toBe('active');
        expect(state.discovery.prophecyStartTime).toBeGreaterThan(0);
        expect(state.discovery.activeSequence).not.toBeNull();
        expect(state.discovery.activeSequence?.clueId).toBe(clueId);
    });

    it('should expire and clear sequence after 24 hours', async () => {
        await ProgressionEngine.debugUnlockItem('item_03_clueRelic');
        ProgressionEngine.processEvent({ type: 'app_opened' });
        const clueId = ProgressionEngine.getState().discovery.prophecyClueId!;

        ProgressionEngine.processEvent({ type: 'prophecy_tapped' });
        ProgressionEngine.processEvent({
            type: 'clue_acknowledged',
            payload: { clueId }
        });

        // Manipulate time (prophecyStartTime) to be 25 hours ago
        const state = ProgressionEngine.getState();
        state.discovery.prophecyStartTime = Date.now() - (25 * 60 * 60 * 1000);

        // Trigger check via app_opened or prophecy_expired
        ProgressionEngine.processEvent({ type: 'app_opened' });

        const newState = ProgressionEngine.getState();
        expect(newState.discovery.prophecyState).toBe('hidden');
        expect(newState.discovery.prophecyClueId).toBeNull();
        expect(newState.discovery.activeSequence).toBeNull();
    });

    it('should re-offer a different prophecy after one is resolved', async () => {
        await ProgressionEngine.debugUnlockItem('item_03_clueRelic');
        ProgressionEngine.processEvent({ type: 'app_opened' });
        const clueId = ProgressionEngine.getState().discovery.prophecyClueId!;

        // Manually mark as triggered/solved
        const state = ProgressionEngine.getState();
        state.discovery.triggeredDiscoveries.push(clueId);
        state.discovery.prophecyState = 'hidden';
        state.discovery.prophecyClueId = null;

        // Next app open should pick a new one
        ProgressionEngine.processEvent({ type: 'app_opened' });

        const newState = ProgressionEngine.getState();
        expect(newState.discovery.prophecyState).toBe('available');
        expect(newState.discovery.prophecyClueId).not.toBe(clueId);
        expect(newState.discovery.prophecyClueId).not.toBeNull();
    });
});
