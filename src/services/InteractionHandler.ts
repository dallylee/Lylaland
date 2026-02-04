/**
 * Interaction Handler
 * Validates advanced interactions: tap, multiTap, longPress, holdThenStir
 */

import { Interaction, HotspotStep } from '../types/discovery';

export interface InteractionState {
    tapCount: number;
    lastTapMs: number;
    holdStartMs: number | null;
    stirStarted: boolean;
    stirAngleAccumulated: number;
    stirLastPoint: { x: number; y: number } | null;
    isHolding: boolean;
}

const defaultState: InteractionState = {
    tapCount: 0,
    lastTapMs: 0,
    holdStartMs: null,
    stirStarted: false,
    stirAngleAccumulated: 0,
    stirLastPoint: null,
    isHolding: false,
};

/**
 * InteractionHandler class - tracks and validates interaction sequences
 */
export class InteractionHandler {
    private state: InteractionState = { ...defaultState };
    private activeInteraction: Interaction | null = null;
    private onComplete: (() => void) | null = null;
    private holdTimer: number | null = null;

    /**
     * Reset handler state
     */
    reset(): void {
        this.state = { ...defaultState };
        this.activeInteraction = null;
        this.onComplete = null;
        if (this.holdTimer !== null) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
    }

    /**
     * Start tracking an interaction for a hotspot step
     */
    startTracking(step: HotspotStep, onComplete: () => void): void {
        this.reset();
        this.activeInteraction = step.interaction;
        this.onComplete = onComplete;
    }

    /**
     * Handle pointer down event
     */
    handlePointerDown(x: number, y: number): void {
        if (!this.activeInteraction) return;

        const now = Date.now();

        switch (this.activeInteraction.kind) {
            case 'tap':
                // Tap completes immediately on up
                break;

            case 'multiTap':
                // Check if within interval
                if (now - this.state.lastTapMs > this.activeInteraction.maxIntervalMs) {
                    // Reset tap count
                    this.state.tapCount = 0;
                }
                break;

            case 'longPress':
                this.state.holdStartMs = now;
                this.state.isHolding = true;
                // Set timer to check hold duration
                this.holdTimer = window.setTimeout(() => {
                    if (this.state.isHolding && this.activeInteraction?.kind === 'longPress') {
                        this.completeInteraction();
                    }
                }, this.activeInteraction.holdMs);
                break;

            case 'holdThenStir':
                this.state.holdStartMs = now;
                this.state.isHolding = true;
                this.state.stirLastPoint = { x, y };
                // Start hold timer
                this.holdTimer = window.setTimeout(() => {
                    if (this.state.isHolding && this.activeInteraction?.kind === 'holdThenStir') {
                        this.state.stirStarted = true;
                    }
                }, this.activeInteraction.holdMs);
                break;
        }
    }

    /**
     * Handle pointer move event
     */
    handlePointerMove(x: number, y: number): void {
        if (!this.activeInteraction || this.activeInteraction.kind !== 'holdThenStir') return;
        if (!this.state.isHolding || !this.state.stirStarted) return;

        const interaction = this.activeInteraction;
        const lastPoint = this.state.stirLastPoint;

        if (!lastPoint) {
            this.state.stirLastPoint = { x, y };
            return;
        }

        // Calculate angle change
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // MVP: Accept any movement >= 20px as a "stir"
        if (distance >= 20) {
            // Accumulate as partial turn
            this.state.stirAngleAccumulated += distance / (2 * Math.PI * interaction.stirRadiusPx);
            this.state.stirLastPoint = { x, y };

            // Check if we have enough turns
            if (this.state.stirAngleAccumulated >= interaction.stirTurns) {
                this.completeInteraction();
            }
        }
    }

    /**
     * Handle pointer up event
     */
    handlePointerUp(): void {
        if (!this.activeInteraction) return;

        const now = Date.now();

        switch (this.activeInteraction.kind) {
            case 'tap':
                this.completeInteraction();
                break;

            case 'multiTap':
                this.state.tapCount++;
                this.state.lastTapMs = now;
                if (this.state.tapCount >= this.activeInteraction.taps) {
                    this.completeInteraction();
                }
                break;

            case 'longPress':
                // If released before hold time, cancel
                if (this.holdTimer !== null) {
                    clearTimeout(this.holdTimer);
                    this.holdTimer = null;
                }
                this.state.isHolding = false;
                break;

            case 'holdThenStir':
                // If released before completing stir, reset
                if (this.holdTimer !== null) {
                    clearTimeout(this.holdTimer);
                    this.holdTimer = null;
                }
                this.state.isHolding = false;
                this.state.stirStarted = false;
                break;
        }
    }

    /**
     * Handle pointer cancel event
     */
    handlePointerCancel(): void {
        if (this.holdTimer !== null) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
        this.state.isHolding = false;
        this.state.stirStarted = false;
    }

    /**
     * Complete the interaction and notify
     */
    private completeInteraction(): void {
        if (this.holdTimer !== null) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
        this.onComplete?.();
        this.reset();
    }

    /**
     * Check if currently tracking an interaction
     */
    isTracking(): boolean {
        return this.activeInteraction !== null;
    }

    /**
     * Get current interaction kind being tracked
     */
    getActiveKind(): string | null {
        return this.activeInteraction?.kind || null;
    }
}

// Export singleton for shared use
export const interactionHandler = new InteractionHandler();
