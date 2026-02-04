import React, { useState, useRef, useEffect } from 'react';
import { useMagic } from '../../context/MagicContext';
import './HatchCinematic.css';

interface HatchCinematicProps {
    onClose: () => void;
}

/**
 * HatchCinematic - Full-screen cinematic for dragon egg hatching
 * Plays when all 20 magic items are collected.
 */
export const HatchCinematic: React.FC<HatchCinematicProps> = ({ onClose }) => {
    const { processEvent } = useMagic();
    const [videoError, setVideoError] = useState(false);
    const [showCloseButton, setShowCloseButton] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Attempt to play immediately
        if (videoRef.current) {
            videoRef.current.play().catch(err => {
                console.warn('[HatchCinematic] Autoplay failed, waiting for user interaction or error', err);
                // We show close button if autoplay is blocked so user isn't stuck
                setShowCloseButton(true);
            });
        }
    }, []);

    const handlePlay = () => {
        setShowCloseButton(true);
    };

    const handleError = () => {
        console.error('[HatchCinematic] Video failed to load');
        setVideoError(true);
        setShowCloseButton(true); // Always allow closing on error
    };

    const handleAcknowledge = () => {
        // Mark as seen in progression engine
        processEvent('hatch_cinematic_seen');
        onClose();
    };

    return (
        <div className="hatch-modal-overlay">
            <div className="hatch-video-container">
                {!videoError ? (
                    <video
                        ref={videoRef}
                        className="hatch-video"
                        src="/ui/cinematics/egg_hatch.mp4"
                        onPlay={handlePlay}
                        onError={handleError}
                        playsInline
                        autoPlay
                    />
                ) : (
                    <div className="hatch-fallback">
                        <h2>The Egg is Stirring!</h2>
                        <p>A crack appears in the ancient shell. A warm, golden light spills out as the first baby dragon in a thousand years is born into Sparkle World.</p>
                        <p className="mt-4 italic">The legends were true. You have united the 20 relics!</p>
                    </div>
                )}

                {/* Decorative sparkles */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="hatch-sparkle"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 10 + 5}px`,
                            height: `${Math.random() * 10 + 5}px`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            <button
                className={`hatch-close-btn ${showCloseButton ? 'visible' : ''}`}
                onClick={handleAcknowledge}
            >
                Continue Adventure
            </button>
        </div>
    );
};
