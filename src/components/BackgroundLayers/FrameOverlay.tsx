import React from 'react';
import './FrameOverlay.css';

/**
 * Decorative overlay layer (architecture/vines frame)
 * Adds magical vine decorations around the edges
 */
export function FrameOverlay() {
    return (
        <div className="frame-overlay">
            {/* Top decorative elements */}
            <div className="vine vine-top-left" />
            <div className="vine vine-top-right" />

            {/* Side vines */}
            <div className="vine vine-left" />
            <div className="vine vine-right" />

            {/* Sparkle accents */}
            <div className="sparkle-accent accent-1">✨</div>
            <div className="sparkle-accent accent-2">✨</div>
            <div className="sparkle-accent accent-3">⭐</div>
        </div>
    );
}

export default FrameOverlay;
