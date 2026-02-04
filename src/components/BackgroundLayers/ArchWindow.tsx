import React from 'react';
import './ArchWindow.css';

/**
 * Arched window - transparent mask showing night sky through opening
 * The arch frame is visible but the opening is transparent
 */
export function ArchWindow() {
    return (
        <div className="arch-window-container">
            {/* Arch frame with transparent opening */}
            <div className="arch-frame-wrapper">
                {/* Left side of frame */}
                <div className="arch-frame-side arch-frame-left" />

                {/* Right side of frame */}
                <div className="arch-frame-side arch-frame-right" />

                {/* Top arch curve (border only, transparent center) */}
                <div className="arch-curve">
                    {/* Decorative elements at arch top */}
                    <div className="arch-decor arch-decor-left">🍃</div>
                    <div className="arch-decor arch-decor-right">🍃</div>
                    <div className="arch-decor arch-decor-top">✨</div>
                </div>

                {/* Floating elements in the sky (visible through transparent arch) */}
                <div className="arch-sky-elements">
                    <div className="floating-cloud cloud-1" />
                    <div className="floating-cloud cloud-2" />
                    <div className="floating-moon" />
                </div>
            </div>
        </div>
    );
}

export default ArchWindow;
