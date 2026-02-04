/**
 * Owl Component
 * Displays the owl in ts_owl slot with riddle functionality
 * States: armed → inChallenge → sleeping
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProgressionEngine } from '../../engine/ProgressionEngine';
import { ProgressionConfig } from '../../config/progressionConfig';
import './Owl.css';

// Import riddles dynamically
import riddlesData from '../../content/riddles.json';

interface Riddle {
    id: string;
    prompt: string;
    answers: string[];
    correctIndex: number;
    difficulty: number;
    tags?: string[];
}

interface OwlProps {
    onStateChange?: (state: 'armed' | 'inChallenge' | 'sleeping') => void;
}

export function Owl({ onStateChange }: OwlProps) {
    const [state, setState] = useState<'armed' | 'inChallenge' | 'sleeping'>('sleeping');
    const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(ProgressionConfig.discovery.ui.riddlePopup.timerSeconds);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [resultCorrect, setResultCorrect] = useState(false);

    // Check owl armed state on mount and periodically
    useEffect(() => {
        const checkOwlState = () => {
            const isArmed = ProgressionEngine.isOwlArmed();
            if (isArmed && state === 'sleeping') {
                setState('armed');
                onStateChange?.('armed');
            }
        };

        checkOwlState();
        const interval = setInterval(checkOwlState, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [state, onStateChange]);

    // Handle timeout - defined before useEffect that depends on it
    const handleTimeout = useCallback(() => {
        setShowResult(true);
        setResultCorrect(false);

        ProgressionEngine.processEvent({
            type: 'owl_riddle_timeout',
            payload: { riddleId: currentRiddle?.id },
        });

        // Auto-close after delay
        setTimeout(() => {
            setState('sleeping');
            onStateChange?.('sleeping');
            setCurrentRiddle(null);
        }, 2500);
    }, [currentRiddle, onStateChange]);

    // Timer countdown
    useEffect(() => {
        if (state !== 'inChallenge' || showResult) return;

        if (timeLeft <= 0) {
            handleTimeout();
            return;
        }

        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, state, showResult, handleTimeout]);

    // Get a random unasked riddle
    const getRandomRiddle = useCallback((): Riddle | null => {
        const riddles = riddlesData as Riddle[];
        const askedIds = ProgressionEngine.getState().riddles.askedIds;
        const available = riddles.filter(r => !askedIds.includes(r.id));

        if (available.length === 0) return riddles[0] || null; // Fallback to first
        return available[Math.floor(Math.random() * available.length)];
    }, []);

    // Handle owl click (start challenge)
    const handleOwlClick = useCallback(() => {
        if (state !== 'armed') return;

        const riddle = getRandomRiddle();
        if (!riddle) return;

        setCurrentRiddle(riddle);
        setTimeLeft(ProgressionConfig.discovery.ui.riddlePopup.timerSeconds);
        setSelectedAnswer(null);
        setShowResult(false);
        setState('inChallenge');
        onStateChange?.('inChallenge');

        ProgressionEngine.processEvent({ type: 'owl_riddle_opened' });
    }, [state, getRandomRiddle, onStateChange]);

    // Handle answer selection
    const handleAnswerSelect = useCallback((index: number) => {
        if (selectedAnswer !== null || showResult) return;

        setSelectedAnswer(index);
        const isCorrect = currentRiddle && index === currentRiddle.correctIndex;

        setResultCorrect(isCorrect || false);
        setShowResult(true);

        if (isCorrect) {
            ProgressionEngine.processEvent({
                type: 'owl_riddle_correct',
                payload: { riddleId: currentRiddle?.id },
            });
        } else {
            ProgressionEngine.processEvent({
                type: 'owl_riddle_wrong',
                payload: { riddleId: currentRiddle?.id },
            });
        }

        // Auto-close after delay
        setTimeout(() => {
            setState('sleeping');
            onStateChange?.('sleeping');
            setCurrentRiddle(null);
        }, 2500);
    }, [selectedAnswer, showResult, currentRiddle, onStateChange]);

    // Render owl image based on state
    const owlImage = state === 'armed'
        ? ProgressionConfig.shelf.assets.owlArmedPath
        : ProgressionConfig.shelf.assets.owlSleepPath;

    return (
        <>
            {/* Owl in slot */}
            <div
                className={`owl-container ${state}`}
                onClick={handleOwlClick}
                role="button"
                aria-label={state === 'armed' ? 'Ask the owl a riddle' : 'Owl is sleeping'}
            >
                <img
                    src={owlImage}
                    alt="Mystical Owl"
                    className="owl-image"
                    onError={(e) => {
                        // Fallback if image missing
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                {state === 'armed' && (
                    <div className="owl-glow" />
                )}
            </div>

            {/* Riddle Modal */}
            {state === 'inChallenge' && currentRiddle && (
                <div className="riddle-modal-overlay">
                    <div className="riddle-modal">
                        <div className="riddle-header">
                            <span className="riddle-owl-icon">🦉</span>
                            <span className="riddle-title">The Owl's Riddle</span>
                            <span className={`riddle-timer ${timeLeft <= 5 ? 'warning' : ''}`}>
                                ⏱️ {timeLeft}s
                            </span>
                        </div>

                        <div className="riddle-prompt">
                            "{currentRiddle.prompt}"
                        </div>

                        <div className="riddle-answers">
                            {currentRiddle.answers.map((answer, idx) => (
                                <button
                                    key={idx}
                                    className={`riddle-answer ${showResult
                                        ? idx === currentRiddle.correctIndex
                                            ? 'correct'
                                            : selectedAnswer === idx
                                                ? 'wrong'
                                                : ''
                                        : selectedAnswer === idx
                                            ? 'selected'
                                            : ''
                                        }`}
                                    onClick={() => handleAnswerSelect(idx)}
                                    disabled={showResult}
                                >
                                    {answer}
                                </button>
                            ))}
                        </div>

                        {showResult && (
                            <div className={`riddle-result ${resultCorrect ? 'success' : 'fail'}`}>
                                {resultCorrect
                                    ? `✨ Correct! +${ProgressionConfig.rewards.owlRiddleCorrect.goldStars} stars!`
                                    : '💤 Wrong answer... The owl needs rest now.'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Owl;
