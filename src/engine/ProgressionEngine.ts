/**
 * Progression Engine
 * Single entrypoint for all progression events in Sparkle World
 * Supports multi-step discoveries with advanced interactions
 */

import { ProgressionConfig, UnlockRule } from '../config/progressionConfig';
import { persistence } from '../services/Persistence';
import { ProgressionState, DEFAULT_STATE } from '../types/progression';
import {
    Clue,
    DiscoveryStep,
    ActiveDiscoverySequence,
    canAttemptTimeWindow,
    getTimeWindowExpirationMs,
} from '../types/discovery';
import { SoundKey } from '../services/SoundManager';

// Import clues data
import cluesData from '../content/clues.json';

// Event types that can trigger progression
export type ProgressionEventType =
    | 'owl_riddle_correct'
    | 'owl_riddle_wrong'
    | 'owl_riddle_timeout'
    | 'game_played'
    | 'craft_completed'
    | 'diary_saved'
    | 'media_done'
    | 'hotspot_triggered'
    | 'clue_acknowledged'
    | 'app_opened'
    | 'realm_changed'
    | 'prophecy_tapped'
    | 'prophecy_expired'
    | 'hatch_cinematic_seen'
    | 'owl_riddle_opened';

export interface ProgressionEvent {
    type: ProgressionEventType;
    payload?: {
        riddleId?: string;
        hotspotId?: string;
        discoveryId?: string;
        clueId?: string;
        realmId?: string;
        interactionValid?: boolean; // Pre-validated interaction result
    };
}

export interface ProgressionResult {
    starsAwarded: number;
    blueTokenAwarded: boolean;
    redTokenAwarded: boolean;
    itemsUnlocked: string[];
    discoveryTriggered: string | null;
    discoveryStepAdvanced: boolean;
    discoveryCompleted: string | null;
    eggHatchTriggered: boolean;
    soundCues: SoundKey[];
    newState: ProgressionState;
}

/**
 * Get clue by ID from clues.json
 */
function getClueById(clueId: string): Clue | null {
    const clues = cluesData as Clue[];
    return clues.find(c => c.id === clueId) || null;
}

/**
 * Normalise state to ensure it matches the ProgressionState interface
 * and provide defaults for any missing fields.
 */
function normaliseState(input: any): ProgressionState {
    const base = { ...DEFAULT_STATE };
    if (!input || typeof input !== 'object') return base;

    return {
        totals: { ...base.totals, ...(input.totals || {}) },
        inventory: Array.isArray(input.inventory) ? [...input.inventory] : base.inventory,
        riddles: { ...base.riddles, ...(input.riddles || {}) },
        clues: { ...base.clues, ...(input.clues || {}) },
        owl: { ...base.owl, ...(input.owl || {}) },
        discovery: { ...base.discovery, ...(input.discovery || {}) },
        diaryStreak: { ...base.diaryStreak, ...(input.diaryStreak || {}) },
        dailyCounts: {
            date: input.dailyCounts?.date || base.dailyCounts.date,
            dailyCappedStars: input.dailyCounts?.dailyCappedStars ?? input.dailyCounts?.oneStarSourceCount ?? base.dailyCounts.dailyCappedStars
        },
    };
}

/**
 * ProgressionEngine class - handles all game loop logic
 */
class ProgressionEngineClass {
    private state: ProgressionState;
    private listeners: Array<(result: ProgressionResult) => void> = [];
    private initialized = false;

    constructor() {
        console.log('[ProgressionEngine] Constructor starting');
        // Always initialize to a valid state immediately
        this.state = normaliseState(DEFAULT_STATE);
        console.log('[ProgressionEngine] State initialized with DEFAULT_STATE');
    }

    /**
     * Initialize engine with persisted state
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const persisted = await persistence.getState();
            this.state = normaliseState(persisted);
            console.log('[ProgressionEngine] Hydrated from persistence');
        } catch (e) {
            console.warn('[ProgressionEngine] Failed to hydrate from persistence, using default state', e);
            this.state = normaliseState(DEFAULT_STATE);
        }

        this.initialized = true;
    }

    /**
     * Reload state from persistence
     */
    async reload(): Promise<void> {
        try {
            const persisted = await persistence.getState();
            this.state = normaliseState(persisted);
        } catch (e) {
            console.warn('[ProgressionEngine] Failed to reload from persistence', e);
        }
    }

    /**
     * Get current state
     */
    getState(): ProgressionState {
        if (!this.state) {
            // This should technically never happen now with the new constructor
            console.error('[ProgressionEngine] getState called but state is missing! Emergency recovery.');
            this.state = normaliseState(DEFAULT_STATE);
        }
        return this.state;
    }

    /**
     * Subscribe to progression changes
     */
    subscribe(listener: (result: ProgressionResult) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Process a progression event
     */
    processEvent(event: ProgressionEvent): ProgressionResult {
        const result: ProgressionResult = {
            starsAwarded: 0,
            blueTokenAwarded: false,
            redTokenAwarded: false,
            itemsUnlocked: [],
            discoveryTriggered: null,
            discoveryStepAdvanced: false,
            discoveryCompleted: null,
            eggHatchTriggered: false,
            soundCues: [],
            newState: this.state,
        };

        switch (event.type) {
            case 'owl_riddle_correct':
                this.handleOwlRiddleCorrect(event, result);
                break;
            case 'owl_riddle_wrong':
            case 'owl_riddle_timeout':
                this.handleOwlRiddleFail(event, result);
                break;
            case 'game_played':
                this.handleCappedSource(ProgressionConfig.rewards.gameSessionComplete.goldStars, result);
                break;
            case 'craft_completed':
                this.handleCappedSource(ProgressionConfig.rewards.craftComplete.goldStars, result);
                break;
            case 'diary_saved':
                this.handleDiarySaved(result);
                break;
            case 'media_done':
                this.handleCappedSource(ProgressionConfig.rewards.mediaInteraction.goldStars, result);
                break;
            case 'hotspot_triggered':
                this.handleHotspotTriggered(event, result);
                break;
            case 'clue_acknowledged':
                this.handleClueAcknowledged(event, result);
                break;
            case 'app_opened':
                this.handleAppOpened(result);
                break;
            case 'realm_changed':
                this.handleRealmChanged(event, result);
                break;
            case 'prophecy_tapped':
                this.handleProphecyTapped(result);
                break;
            case 'prophecy_expired':
                this.handleProphecyExpired(result);
                break;
            case 'hatch_cinematic_seen':
                this.handleHatchSeen(result);
                break;
            case 'owl_riddle_opened':
                result.soundCues.push('owl_open');
                break;
        }

        // Check for newly unlocked items
        this.checkUnlocks(result);

        // Check for egg hatch
        this.checkEggHatch(result);

        // Save state (Async, but we don't necessarily need to wait for it to return the result, 
        // though it's better to ensure it's saved before next event)
        persistence.saveState(this.state);
        result.newState = this.state;

        // Notify listeners
        this.listeners.forEach(l => l(result));

        return result;
    }

    /**
     * Handle correct owl riddle answer
     */
    private handleOwlRiddleCorrect(event: ProgressionEvent, result: ProgressionResult): void {
        const reward = ProgressionConfig.rewards.owlRiddleCorrect;
        const starsToAward = reward.goldStars;

        result.soundCues.push('owl_correct');
        this.awardStars(starsToAward, result);

        // Mark riddle as solved
        if (event.payload?.riddleId) {
            const riddles = this.state.riddles;
            if (!riddles.askedIds.includes(event.payload.riddleId)) {
                riddles.askedIds.push(event.payload.riddleId);
            }
            riddles.timestamps[event.payload.riddleId] = Date.now();
            riddles.solvedCount++;
            this.state.riddles = riddles;
        }

        // Set owl to sleeping
        this.state.owl = {
            lastAttemptTimestamp: Date.now(),
            state: 'sleeping',
        };
    }

    /**
     * Handle wrong/timeout owl riddle
     */
    private handleOwlRiddleFail(event: ProgressionEvent, result: ProgressionResult): void {
        // Mark riddle as asked but not solved
        if (event.payload?.riddleId) {
            const riddles = this.state.riddles;
            if (!riddles.askedIds.includes(event.payload.riddleId)) {
                riddles.askedIds.push(event.payload.riddleId);
            }
            riddles.timestamps[event.payload.riddleId] = Date.now();
            this.state.riddles = riddles;
        }

        // Set owl to sleeping
        this.state.owl = {
            lastAttemptTimestamp: Date.now(),
            state: 'sleeping',
        };

        if (event.type === 'owl_riddle_timeout') {
            result.soundCues.push('owl_timeout');
        } else {
            result.soundCues.push('owl_wrong');
        }
    }

    /**
     * Handle capped star source (easy repeatable actions)
     */
    private handleCappedSource(amount: number, result: ProgressionResult): void {
        const dailyCounts = this.state.dailyCounts;
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

        // Reset if new day
        if (dailyCounts.date !== today) {
            dailyCounts.date = today;
            dailyCounts.dailyCappedStars = 0;
        }

        const cap = ProgressionConfig.dailyCaps.dailyGoldCap;
        const remaining = Math.max(0, cap - dailyCounts.dailyCappedStars);

        if (remaining <= 0) {
            return; // Fully capped
        }

        const toAward = Math.min(amount, remaining);
        dailyCounts.dailyCappedStars += toAward;
        this.state.dailyCounts = dailyCounts;

        if (toAward > 0) {
            this.awardStars(toAward, result);
        }
    }



    /**
     * Handle diary entry with streak tracking
     */
    private handleDiarySaved(result: ProgressionResult): void {
        this.handleCappedSource(ProgressionConfig.rewards.diaryEntry.goldStars, result);

        // Update streak
        const streak = this.state.diaryStreak;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (streak.lastEntryDate === yesterday) {
            streak.currentStreak++;
        } else if (streak.lastEntryDate !== today) {
            streak.currentStreak = 1;
        }

        streak.lastEntryDate = today;
        if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
        }

        // Award streak bonus
        if (streak.currentStreak === 7) {
            this.awardStars(ProgressionConfig.rewards.diaryStreak7Days.goldStars, result);
        }

        this.state.diaryStreak = streak;
    }

    /**
     * Handle hotspot triggered - now supports multi-step sequences
     */
    private handleHotspotTriggered(event: ProgressionEvent, result: ProgressionResult): void {
        const hotspotId = event.payload?.hotspotId;
        if (!hotspotId) return;

        const discovery = this.state.discovery;
        const sequence = discovery.activeSequence;

        // Check if we have an active sequence expecting this hotspot
        if (sequence) {
            const clue = getClueById(sequence.clueId);
            if (!clue || !clue.steps || sequence.stepIndex >= clue.steps.length) {
                // Invalid sequence state, clear it
                discovery.activeSequence = null;
                this.state.discovery = discovery;
                return;
            }

            const currentStep = clue.steps[sequence.stepIndex];

            // Check if this step is a hotspot step expecting this hotspot and realm
            if (
                currentStep.type === 'hotspot' &&
                currentStep.hotspotId === hotspotId &&
                currentStep.realm === discovery.activeRealmId
            ) {
                // Interaction validation is done by the UI component before calling
                // If interactionValid is explicitly false, reject
                if (event.payload?.interactionValid === false) {
                    return;
                }

                // Step passed! Advance to next step
                this.advanceDiscoveryStep(clue, result);
            }
            return;
        }

        // Legacy fallback: check if hotspot is armed (backwards compatibility)
        if (!discovery.armedHotspots.includes(hotspotId)) {
            return; // Not armed, ignore
        }

        // Find which discovery this hotspot unlocks (legacy config mode)
        const rule = ProgressionConfig.discovery.rules.find(
            (r: { armsHotspot: string; discoveryId: string; unlocksItemId?: string }) => r.armsHotspot === hotspotId
        );

        if (rule && !discovery.triggeredDiscoveries.includes(rule.discoveryId)) {
            discovery.triggeredDiscoveries.push(rule.discoveryId);
            discovery.armedHotspots = discovery.armedHotspots.filter((h: string) => h !== hotspotId);
            result.discoveryTriggered = rule.discoveryId;

            // Unlock the item associated with this discovery
            if (rule.unlocksItemId && !this.state.inventory.includes(rule.unlocksItemId)) {
                this.state.inventory.push(rule.unlocksItemId);
                result.itemsUnlocked.push(rule.unlocksItemId);
            }
        }

        this.state.discovery = discovery;
    }

    /**
     * Handle realm change - for realmOpened steps
     */
    private handleRealmChanged(event: ProgressionEvent, result: ProgressionResult): void {
        const realmId = event.payload?.realmId;
        if (!realmId) return;

        const discovery = this.state.discovery;
        discovery.activeRealmId = realmId;
        result.soundCues.push('ui_tap');

        const sequence = discovery.activeSequence;
        if (!sequence) {
            this.state.discovery = discovery;
            return;
        }

        const clue = getClueById(sequence.clueId);
        if (!clue || !clue.steps || sequence.stepIndex >= clue.steps.length) {
            // Invalid sequence state
            discovery.activeSequence = null;
            this.state.discovery = discovery;
            return;
        }

        const currentStep = clue.steps[sequence.stepIndex];

        // Check if this step is a realmOpened step waiting for this realm
        if (currentStep.type === 'realmOpened' && currentStep.realm === realmId) {
            // Step passed! Advance to next step
            this.state.discovery = discovery; // Save realm change first
            this.advanceDiscoveryStep(clue, result);
            return;
        }

        this.state.discovery = discovery;
    }

    /**
     * Advance to next step in discovery sequence
     */
    private advanceDiscoveryStep(clue: Clue, result: ProgressionResult): void {
        const discovery = this.state.discovery;
        const sequence = discovery.activeSequence;
        if (!sequence) return;

        result.discoveryStepAdvanced = true;
        result.soundCues.push('ui_tap');
        sequence.stepIndex++;

        // Reset interaction tracking for next step
        sequence.tapCount = undefined;
        sequence.lastTapMs = undefined;
        sequence.holdStartMs = undefined;
        sequence.stirStarted = undefined;
        sequence.stirAngleAccumulated = undefined;
        sequence.stirLastPoint = undefined;

        // Check if sequence is complete
        if (sequence.stepIndex >= clue.steps.length) {
            // Discovery complete!
            console.log(`[ProgressionEngine] Discovery sequence complete for: ${clue.id}`);
            this.completeDiscovery(clue, result);
            return;
        }

        console.log(`[ProgressionEngine] Discovery step advanced: ${clue.id}, next step: ${sequence.stepIndex}`);

        // Arm next step
        const nextStep = clue.steps[sequence.stepIndex];
        if (nextStep.type === 'hotspot') {
            if (!discovery.armedHotspots.includes(nextStep.hotspotId)) {
                discovery.armedHotspots.push(nextStep.hotspotId);
            }
        }
        // realmOpened steps just wait for realm_changed event

        discovery.activeSequence = { ...sequence }; // Ensure fresh object for state change detection if needed
        this.state.discovery = discovery;
    }

    /**
     * Complete a discovery sequence
     */
    private completeDiscovery(clue: Clue, result: ProgressionResult): void {
        const discovery = this.state.discovery;

        // Mark discovery as triggered
        if (!discovery.triggeredDiscoveries.includes(clue.id)) {
            discovery.triggeredDiscoveries.push(clue.id);
        }

        // Clear armed hotspots that were for this clue
        for (const step of clue.steps) {
            if (step.type === 'hotspot') {
                discovery.armedHotspots = discovery.armedHotspots.filter(
                    h => h !== step.hotspotId
                );
            }
        }

        // Clear active sequence
        discovery.activeSequence = null;

        result.discoveryCompleted = clue.id;
        result.discoveryTriggered = clue.id;

        // Find and unlock item from progressionConfig if mapped
        const rule = ProgressionConfig.discovery.rules.find(
            (r: { discoveryId: string; unlocksItemId?: string }) => r.discoveryId === clue.id
        );
        if (rule?.unlocksItemId && !this.state.inventory.includes(rule.unlocksItemId)) {
            this.state.inventory.push(rule.unlocksItemId);
            result.itemsUnlocked.push(rule.unlocksItemId);
        }

        this.state.discovery = discovery;
    }

    /**
     * Handle clue acknowledgement - now initializes multi-step sequence
     */
    private handleClueAcknowledged(event: ProgressionEvent, result: ProgressionResult): void {
        const clueId = event.payload?.clueId;
        if (!clueId) return;

        const clue = getClueById(clueId);
        const discovery = this.state.discovery;

        // Mark clue as used
        if (!this.state.clues.usedIds.includes(clueId)) {
            this.state.clues.usedIds.push(clueId);
            this.state.clues.timestamps[clueId] = Date.now();
        }

        // Clear pending clue
        discovery.pendingClueId = null;

        // If clue has steps, initialize active sequence
        if (clue && clue.steps && clue.steps.length > 0) {
            // Check time window before starting
            if (!canAttemptTimeWindow(clue.timeWindow)) {
                // Time window not valid, don't start sequence
                this.state.discovery = discovery;
                return;
            }

            const sequence: ActiveDiscoverySequence = {
                clueId: clue.id,
                stepIndex: 0,
                startedAtMs: Date.now(),
                expiresAtMs: getTimeWindowExpirationMs(clue.timeWindow),
            };

            // Arm first step if it's a hotspot
            const firstStep = clue.steps[0];
            if (firstStep.type === 'hotspot') {
                if (!discovery.armedHotspots.includes(firstStep.hotspotId)) {
                    discovery.armedHotspots.push(firstStep.hotspotId);
                }
            }
            // realmOpened steps just wait for realm_changed event

            discovery.activeSequence = sequence;
        } else {
            // Legacy fallback: use progressionConfig rules
            const rule = ProgressionConfig.discovery.rules.find(
                (r: { armsHotspot: string; discoveryId: string }) => r.discoveryId === clueId
            );

            if (rule && !discovery.armedHotspots.includes(rule.armsHotspot)) {
                discovery.armedHotspots.push(rule.armsHotspot);
            }
        }

        this.state.discovery = discovery;

        // If this was a prophecy clue, update state to active and set start time
        if (discovery.prophecyState === 'showing' && discovery.prophecyClueId === clueId) {
            discovery.prophecyState = 'active';
            discovery.prophecyStartTime = Date.now();
            this.state.discovery = discovery;
        }
    }

    /**
     * Handle app opened (check for new clues to show)
     */
    private handleAppOpened(result: ProgressionResult): void {
        const discovery = this.state.discovery;
        const today = new Date().toISOString().split('T')[0];

        // Increment open count if new day
        if (discovery.lastOpenDate !== today) {
            discovery.appOpenCount++;
            discovery.lastOpenDate = today;
        }

        // Prophecy expiration check
        let justExpired = false;
        if (discovery.prophecyState === 'active' || discovery.prophecyState === 'showing') {
            const twentyFourHoursMs = 24 * 60 * 60 * 1000;
            if (Date.now() - discovery.prophecyStartTime > twentyFourHoursMs) {
                this.handleProphecyExpired(result);
                justExpired = true;
            }
        }

        // Try to schedule a prophecy if none is active or available
        if (!justExpired && discovery.prophecyState === 'hidden' && this.state.inventory.includes('item_03_clueRelic')) {
            const nextClue = this.selectNextProphecy();
            if (nextClue) {
                discovery.prophecyClueId = nextClue.id;
                discovery.prophecyState = 'available';
            }
        }

        // Check if active sequence has expired
        if (discovery.activeSequence) {
            const seq = discovery.activeSequence;
            if (seq.expiresAtMs && Date.now() > seq.expiresAtMs) {
                // Expired, clear it
                discovery.activeSequence = null;
                // Clear armed hotspots for this clue
                const clue = getClueById(seq.clueId);
                if (clue) {
                    for (const step of clue.steps) {
                        if (step.type === 'hotspot') {
                            discovery.armedHotspots = discovery.armedHotspots.filter(
                                h => h !== step.hotspotId
                            );
                        }
                    }
                }
            }
        }

        // If no pending clue and no active sequence, check for new clues
        if (!discovery.pendingClueId && !discovery.activeSequence) {
            // Check discovery rules from progressionConfig
            for (const rule of ProgressionConfig.discovery.rules as Array<{ trigger: { kind: string; itemsOwned: string[]; opensAfter: number }; discoveryId: string }>) {
                if (discovery.triggeredDiscoveries.includes(rule.discoveryId)) continue;
                if (this.state.clues.usedIds.includes(rule.discoveryId)) continue;

                // Check trigger condition
                if (rule.trigger.kind === 'onAppOpenAfterItemsOwned') {
                    const hasAllItems = rule.trigger.itemsOwned.every(
                        (itemId: string) => this.state.inventory.includes(itemId)
                    );
                    if (hasAllItems && discovery.appOpenCount >= rule.trigger.opensAfter) {
                        discovery.pendingClueId = rule.discoveryId;
                        result.discoveryTriggered = rule.discoveryId;
                        break;
                    }
                }
            }
        }

        this.state.discovery = discovery;
    }

    /**
     * Award stars and roll for tokens
     */
    private awardStars(amount: number, result: ProgressionResult): void {
        const totals = this.state.totals;
        totals.goldStars += amount;
        totals.lifetimeGoldStars += amount;
        result.starsAwarded += amount;

        if (amount > 0 && !result.soundCues.includes('star_win')) {
            result.soundCues.push('star_win');
        }

        // Roll for tokens - cast to mutable types
        const blueChanceBase: number = ProgressionConfig.tokenDrops.blueTokenChancePerGoldStar;
        const redChanceBase: number = ProgressionConfig.tokenDrops.redTokenChancePerGoldStar;
        const pityEnabled = ProgressionConfig.tokenDrops.pity.enable;
        const bluePityThreshold = ProgressionConfig.tokenDrops.pity.blueGuaranteeAfterGoldStarsWithoutBlue;
        const redPityThreshold = ProgressionConfig.tokenDrops.pity.redGuaranteeAfterGoldStarsWithoutRed;

        for (let i = 0; i < amount; i++) {
            totals.goldStarsSinceLastBlue++;
            totals.goldStarsSinceLastRed++;

            // Blue token roll
            let blueChance = blueChanceBase;
            if (pityEnabled && totals.goldStarsSinceLastBlue >= bluePityThreshold) {
                blueChance = 1; // Guaranteed
            }

            if (Math.random() < blueChance) {
                totals.blueTokens++;
                totals.goldStarsSinceLastBlue = 0;
                result.blueTokenAwarded = true;
                if (!result.soundCues.includes('blue_token')) {
                    result.soundCues.push('blue_token');
                }
            }

            // Red token roll
            let redChance = redChanceBase;
            if (pityEnabled && totals.goldStarsSinceLastRed >= redPityThreshold) {
                redChance = 1; // Guaranteed
            }

            if (Math.random() < redChance) {
                totals.redTokens++;
                totals.goldStarsSinceLastRed = 0;
                result.redTokenAwarded = true;
                if (!result.soundCues.includes('red_token')) {
                    result.soundCues.push('red_token');
                }
            }
        }

        this.state.totals = totals;
    }

    /**
     * Check for newly unlocked items based on current state
     */
    private checkUnlocks(result: ProgressionResult): void {
        if (!this.state || !this.state.inventory) {
            console.error('[ProgressionEngine] checkUnlocks called with invalid state:', this.state);
            return;
        }

        for (const item of ProgressionConfig.items) {
            if (item.reserved) continue;
            if (this.state.inventory.includes(item.id)) continue;
            if (!item.unlock) continue;

            try {
                if (this.checkUnlockRule(item.unlock)) {
                    this.state.inventory.push(item.id);
                    result.itemsUnlocked.push(item.id);
                    if (!result.soundCues.includes('item_reveal')) {
                        result.soundCues.push('item_reveal');
                    }
                }
            } catch (e) {
                console.error(`[ProgressionEngine] Error checking unlock for item ${item.id}:`, e, item.unlock);
                throw e; // re-throw to fail test
            }
        }
    }

    /**
     * Check if an unlock rule is satisfied
     */
    private checkUnlockRule(rule: UnlockRule): boolean {
        switch (rule.kind) {
            case 'starsTotalAtLeast':
                return this.state.totals.lifetimeGoldStars >= rule.total;
            case 'tokensAtLeast':
                if (rule.token === 'blueTokens') {
                    return this.state.totals.blueTokens >= rule.total;
                } else {
                    return this.state.totals.redTokens >= rule.total;
                }
            case 'riddlesSolvedAtLeast':
                return this.state.riddles.solvedCount >= rule.total;
            case 'craftsCompletedAtLeast':
                // TODO: track crafts completed
                return false;
            case 'daysOpenedAtLeast':
                return this.state.discovery.appOpenCount >= rule.total;
            case 'discovery':
                return this.state.discovery.triggeredDiscoveries.includes(rule.discoveryId);
            default:
                return false;
        }
    }

    /**
     * Check if egg hatch should trigger
     */
    private checkEggHatch(result: ProgressionResult): void {
        const discovery = this.state.discovery;
        if (discovery.hatchSeen) return;

        const collectibleCount = this.state.inventory.filter(
            (id: string) => id !== 'owl' && id !== 'dragon_egg'
        ).length;

        if (collectibleCount >= ProgressionConfig.hatch.whenCollectedCountAtLeast) {
            result.eggHatchTriggered = true;
        }
    }

    /**
     * Handle hatch cinematic seen
     */
    private handleHatchSeen(result: ProgressionResult): void {
        const discovery = this.state.discovery;
        discovery.hatchSeen = true;
        this.state.discovery = discovery;
        result.newState = this.state;
    }

    /**
     * Check if owl is available for riddle
     */
    isOwlArmed(): boolean {
        const owl = this.state.owl;
        const hoursSinceLastAttempt = (Date.now() - owl.lastAttemptTimestamp) / (1000 * 60 * 60);
        return hoursSinceLastAttempt >= ProgressionConfig.owl.cadenceHours || owl.state === 'armed';
    }

    /**
     * Get an unasked riddle (or null if all used)
     */
    getNextRiddle(): any {
        // This would load from riddles.json
        // For now, return null - will be implemented with content loading
        return null;
    }

    /**
     * Get pending clue to show (or null)
     */
    getPendingClue(): string | null {
        return this.state.discovery.pendingClueId;
    }

    /**
     * Get active discovery sequence
     */
    getActiveSequence(): ActiveDiscoverySequence | null {
        return this.state.discovery.activeSequence;
    }

    /**
     * Get current step of active sequence
     */
    getCurrentStep(): DiscoveryStep | null {
        const seq = this.state.discovery.activeSequence;
        if (!seq) return null;

        const clue = getClueById(seq.clueId);
        if (!clue || !clue.steps || seq.stepIndex >= clue.steps.length) return null;

        return clue.steps[seq.stepIndex];
    }

    /**
     * Check if a hotspot is armed
     */
    isHotspotArmed(hotspotId: string): boolean {
        return this.state.discovery.armedHotspots.includes(hotspotId);
    }

    /**
     * Get current active realm
     */
    getActiveRealm(): string {
        return this.state.discovery.activeRealmId;
    }

    /**
     * Handle prophecy mirror tapped
     */
    private handleProphecyTapped(result: ProgressionResult): void {
        const discovery = this.state.discovery;
        if (discovery.prophecyState === 'available' && discovery.prophecyClueId) {
            discovery.prophecyState = 'showing';
            discovery.pendingClueId = discovery.prophecyClueId; // Show it on the next poll/render
            this.state.discovery = discovery;
        }
    }

    /**
     * Handle prophecy expiration
     */
    private handleProphecyExpired(result: ProgressionResult): void {
        const discovery = this.state.discovery;
        console.log(`[ProgressionEngine] Prophecy expired: ${discovery.prophecyClueId}`);

        // If it was active, clear the sequence and armed hotspots
        if (discovery.prophecyState === 'active' || discovery.prophecyState === 'showing') {
            const clue = getClueById(discovery.prophecyClueId || '');
            if (clue) {
                // Clear armed hotspots for this clue
                for (const step of clue.steps) {
                    if (step.type === 'hotspot') {
                        discovery.armedHotspots = discovery.armedHotspots.filter(
                            h => h !== step.hotspotId
                        );
                    }
                }
            }
            discovery.activeSequence = null;
        }

        discovery.prophecyState = 'hidden';
        discovery.prophecyClueId = null;
        discovery.prophecyStartTime = 0;
        this.state.discovery = discovery;
    }

    /**
     * Select next eligible prophecy from clues.json
     */
    private selectNextProphecy(): Clue | null {
        const clues = cluesData as Clue[];
        const discovery = this.state.discovery;
        const usedIds = [...this.state.clues.usedIds, ...discovery.triggeredDiscoveries];

        // Find clues that aren't used and aren't scheduled for other things in config
        // NOTE: We only want clues that haven't been completed.
        return clues.find(c => !usedIds.includes(c.id)) || null;
    }

    /**
     * UI Helper: Is mirror glowing?
     */
    isMirrorProphecyAvailable(): boolean {
        return this.state.discovery.prophecyState === 'available';
    }

    /**
     * Manually unlock an item (for testing/debugging)
     */
    async debugUnlockItem(itemId: string): Promise<void> {
        if (!this.state.inventory.includes(itemId)) {
            this.state.inventory.push(itemId);
            await persistence.saveState(this.state);
        }
    }

    /**
     * Manually add stars (for testing/debugging)
     */
    async debugAddStars(amount: number): Promise<ProgressionResult> {
        const result: ProgressionResult = {
            starsAwarded: 0,
            blueTokenAwarded: false,
            redTokenAwarded: false,
            itemsUnlocked: [],
            discoveryTriggered: null,
            discoveryStepAdvanced: false,
            discoveryCompleted: null,
            eggHatchTriggered: false,
            soundCues: [],
            newState: this.state,
        };

        this.awardStars(amount, result);
        this.checkUnlocks(result);
        this.checkEggHatch(result);
        await persistence.saveState(this.state);
        result.newState = this.state;

        this.listeners.forEach(l => l(result));
        return result;
    }

    /**
     * Reset all progression (for testing)
     */
    async debugReset(): Promise<void> {
        await persistence.clear();
        this.state = normaliseState(DEFAULT_STATE);

        // Notify listeners that state has been reset
        const result: ProgressionResult = {
            starsAwarded: 0,
            blueTokenAwarded: false,
            redTokenAwarded: false,
            itemsUnlocked: [],
            discoveryTriggered: null,
            discoveryStepAdvanced: false,
            discoveryCompleted: null,
            eggHatchTriggered: false,
            soundCues: [],
            newState: this.state,
        };
        this.listeners.forEach((l: (result: ProgressionResult) => void) => l(result));
    }

    /**
     * Set state directly (for testing)
     */
    async resetForTests(): Promise<void> {
        this.state = normaliseState(DEFAULT_STATE);
        this.initialized = true;
        await persistence.saveState(this.state);
    }
}

// Export singleton instance
export const ProgressionEngine = new ProgressionEngineClass();
