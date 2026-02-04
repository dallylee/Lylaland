/**
 * Hotspot Component
 * Invisible overlay that responds to various interactions
 * Used for discovery system hotspots
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { ProgressionEngine } from '../../engine/ProgressionEngine';
import { Interaction } from '../../types/discovery';
import './Hotspot.css';

interface HotspotProps {
    id: string;
    realm: string;
    x: number;
    y: number;
    width: number;
    height: number;
    onActivated?: () => void;
}

interface InteractionState {
    tapCount: number;
    lastTapMs: number;
    holdStartMs: number | null;
    stirStarted: boolean;
    stirAngleAccumulated: number;
    stirLastPoint: { x: number; y: number } | null;
    isHolding: boolean;
}

const defaultInteractionState: InteractionState = {
    tapCount: 0,
    lastTapMs: 0,
    holdStartMs: null,
    stirStarted: false,
    stirAngleAccumulated: 0,
    stirLastPoint: null,
    isHolding: false,
};

export function Hotspot({ id, realm, x, y, width, height, onActivated }: HotspotProps) {
    const [isArmed, setIsArmed] = useState(false);
    const [interactionState, setInteractionState] = useState<InteractionState>(defaultInteractionState);
    const [currentInteraction, setCurrentInteraction] = useState<Interaction | null>(null);
    const holdTimerRef = useRef<number | null>(null);
    const stirTimeoutRef = useRef<number | null>(null);

    // Check if this hotspot is armed
    useEffect(() => {
        const checkArmed = () => {
            const armed = ProgressionEngine.isHotspotArmed(id);
            setIsArmed(armed);

            // Get current step if we're armed
            if (armed) {
                const step = ProgressionEngine.getCurrentStep();
                if (step?.type === 'hotspot' && step.hotspotId === id) {
                    setCurrentInteraction(step.interaction);
                }
            } else {
                setCurrentInteraction(null);
            }
        };

        checkArmed();

        // Subscribe to state changes
        const unsubscribe = ProgressionEngine.subscribe(() => {
            checkArmed();
        });

        return () => {
            unsubscribe();
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            if (stirTimeoutRef.current) clearTimeout(stirTimeoutRef.current);
        };
    }, [id]);

    // Complete the interaction
    const completeInteraction = useCallback(() => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (stirTimeoutRef.current) {
            clearTimeout(stirTimeoutRef.current);
            stirTimeoutRef.current = null;
        }

        // Trigger the hotspot
        ProgressionEngine.processEvent({
            type: 'hotspot_triggered',
            payload: {
                hotspotId: id,
                interactionValid: true,
            },
        });

        setInteractionState(defaultInteractionState);
        setCurrentInteraction(null);
        onActivated?.();
    }, [id, onActivated]);

    // Handle pointer down
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (!isArmed || !currentInteraction) return;

        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        const now = Date.now();
        const x = e.clientX;
        const y = e.clientY;

        switch (currentInteraction.kind) {
            case 'tap':
                // Tap completes on up
                break;

            case 'multiTap':
                setInteractionState(prev => {
                    // Check if within interval
                    if (now - prev.lastTapMs > currentInteraction.maxIntervalMs) {
                        return { ...defaultInteractionState };
                    }
                    return prev;
                });
                break;

            case 'longPress':
                setInteractionState(prev => ({
                    ...prev,
                    holdStartMs: now,
                    isHolding: true,
                }));
                holdTimerRef.current = window.setTimeout(() => {
                    completeInteraction();
                }, currentInteraction.holdMs);
                break;

            case 'holdThenStir':
                setInteractionState(prev => ({
                    ...prev,
                    holdStartMs: now,
                    isHolding: true,
                    stirLastPoint: { x, y },
                    stirStarted: false,
                    stirAngleAccumulated: 0,
                }));
                holdTimerRef.current = window.setTimeout(() => {
                    setInteractionState(prev => ({
                        ...prev,
                        stirStarted: true,
                    }));
                    // Set stir timeout
                    stirTimeoutRef.current = window.setTimeout(() => {
                        // Stir timed out, reset
                        setInteractionState(defaultInteractionState);
                    }, currentInteraction.stirMaxDurationMs);
                }, currentInteraction.holdMs);
                break;
        }
    }, [isArmed, currentInteraction, completeInteraction]);

    // Handle pointer move
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isArmed || !currentInteraction || currentInteraction.kind !== 'holdThenStir') return;

        setInteractionState(prev => {
            if (!prev.isHolding || !prev.stirStarted || !prev.stirLastPoint) return prev;

            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const x = e.clientX;
            const y = e.clientY;

            // Calculate angle from center
            const currentAngle = Math.atan2(y - centerY, x - centerX);
            const prevAngle = Math.atan2(prev.stirLastPoint.y - centerY, prev.stirLastPoint.x - centerX);

            let deltaAngle = currentAngle - prevAngle;

            // Handle wrap around
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

            // Accumulate absolute angle (direction doesn't matter for "stirring")
            const newAccum = prev.stirAngleAccumulated + Math.abs(deltaAngle);
            const targetAccum = currentInteraction.stirTurns * 2 * Math.PI;

            if (newAccum >= targetAccum) {
                // Complete on next tick to avoid state update issues
                setTimeout(() => completeInteraction(), 0);
                return defaultInteractionState;
            }

            return {
                ...prev,
                stirAngleAccumulated: newAccum,
                stirLastPoint: { x, y },
            };
        });
    }, [isArmed, currentInteraction, completeInteraction]);

    // Handle pointer up
    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isArmed || !currentInteraction) return;

        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        const now = Date.now();

        switch (currentInteraction.kind) {
            case 'tap':
                completeInteraction();
                break;

            case 'multiTap':
                setInteractionState(prev => {
                    const newCount = prev.tapCount + 1;
                    if (newCount >= currentInteraction.taps) {
                        setTimeout(() => completeInteraction(), 0);
                        return defaultInteractionState;
                    }
                    return {
                        ...prev,
                        tapCount: newCount,
                        lastTapMs: now,
                    };
                });
                break;

            case 'longPress':
                // Released too early
                if (holdTimerRef.current) {
                    clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                }
                setInteractionState(prev => ({
                    ...prev,
                    isHolding: false,
                }));
                break;

            case 'holdThenStir':
                // Released before completing stir
                if (holdTimerRef.current) {
                    clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                }
                if (stirTimeoutRef.current) {
                    clearTimeout(stirTimeoutRef.current);
                    stirTimeoutRef.current = null;
                }
                setInteractionState(defaultInteractionState);
                break;
        }
    }, [isArmed, currentInteraction, completeInteraction]);

    // Handle pointer cancel
    const handlePointerCancel = useCallback(() => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (stirTimeoutRef.current) {
            clearTimeout(stirTimeoutRef.current);
            stirTimeoutRef.current = null;
        }
        setInteractionState(defaultInteractionState);
    }, []);

    // Only render if armed
    if (!isArmed) return null;

    return (
        <div
            className={`hotspot ${isArmed ? 'armed' : ''} ${interactionState.isHolding ? 'holding' : ''} ${interactionState.stirStarted ? 'stirring' : ''}`}
            style={{
                left: x,
                top: y,
                width,
                height,
            }}
            data-hotspot-id={id}
            data-realm={realm}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
        >
            {/* Visual feedback for debugging */}
            {process.env.NODE_ENV === 'development' && (
                <div className="hotspot-debug">
                    {currentInteraction?.kind}
                    {currentInteraction?.kind === 'multiTap' && ` (${interactionState.tapCount}/${currentInteraction.taps})`}
                    {interactionState.stirStarted && ' stirring...'}
                </div>
            )}
        </div>
    );
}

export default Hotspot;
