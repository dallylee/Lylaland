import React from 'react';
import { useMagic } from '../../context/MagicContext';
import './TopHudCounters.css';

/**
 * HUD badges for stars (top-right) and items (top-left)
 * Positioned above the scene content with safe-area-inset-top
 */
export function TopHudCounters() {
    const { stars, inventory } = useMagic();
    const itemCount = inventory?.length ?? 0;

    return (
        <div className="top-hud">
            {/* Items badge - top left */}
            <div className="hud-badge items-badge">
                <span className="badge-icon">🏆</span>
                <span className="badge-count">{itemCount}</span>
            </div>

            {/* Stars badge - top right */}
            <div className="hud-badge stars-badge">
                <span className="badge-icon">⭐</span>
                <span className="badge-count">{stars ?? 0}</span>
            </div>
        </div>
    );
}

export default TopHudCounters;
