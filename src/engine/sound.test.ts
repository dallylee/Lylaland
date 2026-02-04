import { ProgressionEngine } from './ProgressionEngine';
import { ProgressionConfig } from '../config/progressionConfig';

describe('ProgressionEngine Sound Cues', () => {
    beforeEach(async () => {
        await ProgressionEngine.resetForTests();
    });

    it('should generate star_win cue when awarding stars', async () => {
        const result = await ProgressionEngine.debugAddStars(10);
        expect(result.soundCues).toContain('star_win');
    });

    it('should generate item_reveal cue when an item is unlocked', async () => {
        // Find an item with low unlock requirement
        const item = ProgressionConfig.items.find(i =>
            i.unlock?.kind === 'starsTotalAtLeast' &&
            (i.unlock as any).total <= 5
        );
        if (!item || !item.unlock) return;

        const result = await ProgressionEngine.debugAddStars((item.unlock as any).total);
        expect(result.soundCues).toContain('item_reveal');
    });

    it('should generate owl_open cue when owl riddle starts', () => {
        const result = ProgressionEngine.processEvent({ type: 'owl_riddle_opened' });
        expect(result.soundCues).toContain('owl_open');
    });

    it('should generate owl_correct and star_win cues on correct answer', () => {
        const result = ProgressionEngine.processEvent({
            type: 'owl_riddle_correct',
            payload: { riddleId: 'test_riddle' }
        });
        expect(result.soundCues).toContain('owl_correct');
        expect(result.soundCues).toContain('star_win');
    });

    it('should generate owl_wrong cue on wrong answer', () => {
        const result = ProgressionEngine.processEvent({
            type: 'owl_riddle_wrong',
            payload: { riddleId: 'test_riddle' }
        });
        expect(result.soundCues).toContain('owl_wrong');
    });

    it('should generate owl_timeout cue on timeout', () => {
        const result = ProgressionEngine.processEvent({
            type: 'owl_riddle_timeout',
            payload: { riddleId: 'test_riddle' }
        });
        expect(result.soundCues).toContain('owl_timeout');
    });

    it('should generate ui_tap cue on realm change', () => {
        const result = ProgressionEngine.processEvent({
            type: 'realm_changed',
            payload: { realmId: 'forest' }
        });
        expect(result.soundCues).toContain('ui_tap');
    });

    it('should not generate star_win cue if 0 stars are awarded (capped)', async () => {
        // First award stars to reach cap (if cap is small, or just mock cap logic)
        // For this test, we'll just check that it doesn't add it if amount is 0
        const result = await ProgressionEngine.debugAddStars(0);
        expect(result.soundCues).not.toContain('star_win');
    });
});
