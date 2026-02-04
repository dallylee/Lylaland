/**
 * ClueScroll Component
 * Displays mystical clue popups for discovery system
 * Persistent until user acknowledges with "Ok, got it!"
 */

import React, { useState, useEffect } from 'react';
import { ProgressionEngine } from '../../engine/ProgressionEngine';
import { ProgressionConfig } from '../../config/progressionConfig';
import { soundManager } from '../../services/SoundManager';
import './ClueScroll.css';

// Import clues dynamically
import cluesData from '../../content/clues.json';

interface Clue {
    id: string;
    text: string;
    targetHotspotId: string;
    realm: string;
    difficulty?: number;
}

interface ClueScrollProps {
    clueId: string;
    onAcknowledge?: () => void;
}

export function ClueScroll({ clueId, onAcknowledge }: ClueScrollProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    // Find the clue data
    const clue = (cluesData as Clue[]).find(c => c.id === clueId);

    // Handle acknowledgement
    const handleAcknowledge = () => {
        soundManager.play('ui_tap');
        setIsClosing(true);

        // Process the acknowledgement in ProgressionEngine
        ProgressionEngine.processEvent({
            type: 'clue_acknowledged',
            payload: { clueId },
        });

        // Animate out then notify parent
        setTimeout(() => {
            setIsVisible(false);
            onAcknowledge?.();
        }, 400);
    };

    if (!isVisible || !clue) return null;

    return (
        <div className={`clue-scroll-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`clue-scroll ${isClosing ? 'closing' : ''}`}>
                {/* Decorative top */}
                <div className="scroll-decoration top">
                    <span className="scroll-ornament">✦</span>
                    <span className="scroll-line"></span>
                    <span className="scroll-ornament">✦</span>
                </div>

                {/* Scroll content */}
                <div className="scroll-content">
                    <div className="scroll-header">
                        <span className="scroll-icon">🔮</span>
                        <span className="scroll-title">A Mystical Clue</span>
                    </div>

                    <div className="scroll-message">
                        <p className="clue-text">{clue.text}</p>
                    </div>

                    <div className="scroll-hint">
                        <span className="hint-icon">✨</span>
                        <span className="hint-text">Look carefully...</span>
                    </div>
                </div>

                {/* Acknowledge button */}
                <button
                    className="scroll-button"
                    onClick={handleAcknowledge}
                >
                    {ProgressionConfig.discovery.ui.cluePopup.ackButtonText}
                </button>

                {/* Decorative bottom */}
                <div className="scroll-decoration bottom">
                    <span className="scroll-ornament">✦</span>
                    <span className="scroll-line"></span>
                    <span className="scroll-ornament">✦</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to check for pending clues
 */
export function usePendingClue(): string | null {
    const [pendingClue, setPendingClue] = useState<string | null>(null);

    useEffect(() => {
        // Check for pending clue on mount
        const clueId = ProgressionEngine.getPendingClue();
        setPendingClue(clueId);

        // Subscribe to changes
        const unsubscribe = ProgressionEngine.subscribe((result) => {
            if (result.discoveryTriggered) {
                const newPending = ProgressionEngine.getPendingClue();
                setPendingClue(newPending);
            }
        });

        return unsubscribe;
    }, []);

    return pendingClue;
}

export default ClueScroll;
