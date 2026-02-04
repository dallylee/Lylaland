import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrophySlotFrame } from '../components/TrophySlotFrame';
import { BASE_W, BASE_H, SHELF_LIPS, TROPHY_SLOTS } from '../slots';
import './HomeRealm.css';

/** Stage dimensions - fixed logical canvas size */
const STAGE_W = BASE_W; // 390
const STAGE_H = BASE_H; // 844

/**
 * Debug Toggle Button - Gated to development
 */
function DebugToggle() {
    const [active, setActive] = useState(window.__DEBUG_SLOTS__);

    const handleToggle = () => {
        const newVal = !window.__DEBUG_SLOTS__;
        window.__DEBUG_SLOTS__ = newVal;
        setActive(newVal);
        window.dispatchEvent(new CustomEvent('sparkle-debug-toggle'));
    };

    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <button className="dev-debug-toggle" onClick={handleToggle}>
            Debug Slots: {active ? 'ON' : 'OFF'}
        </button>
    );
}

/**
 * Home Realm - Trophy Room Scene
 * 
 * Uses a Stage-based transform approach:
 * - StageHost: fills available area (viewport minus nav)
 * - Stage: fixed 390×844 canvas with global cover transform
 * - All layers anchored to Stage in fixed pixel coordinates
 * - ONE transform handles all scaling/centering globally
 */
function HomeRealm() {
    const [debugActive, setDebugActive] = useState(window.__DEBUG_SLOTS__);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [slots, setSlots] = useState(TROPHY_SLOTS);
    const [shelfLips, setShelfLips] = useState(SHELF_LIPS);
    const hostRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ scale: 1, dx: 0, dy: 0 });
    const [draggedLip, setDraggedLip] = useState<string | null>(null);
    const dragLipStartRef = useRef<{ y: number; lipY: number } | null>(null);

    // Listen for debug toggle events
    useEffect(() => {
        const handleToggle = () => setDebugActive(window.__DEBUG_SLOTS__);
        window.addEventListener('sparkle-debug-toggle' as any, handleToggle);
        return () => window.removeEventListener('sparkle-debug-toggle' as any, handleToggle);
    }, []);

    // Compute cover transform on resize
    const updateTransform = useCallback(() => {
        if (!hostRef.current) return;

        const hostW = hostRef.current.clientWidth;
        const hostH = hostRef.current.clientHeight;

        // Cover transform: scale to fill, then center
        const scale = Math.max(hostW / STAGE_W, hostH / STAGE_H);
        const dx = (hostW - STAGE_W * scale) / 2;
        const dy = (hostH - STAGE_H * scale) / 2;

        setTransform({ scale, dx, dy });
    }, []);

    // ResizeObserver for responsive updates
    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const observer = new ResizeObserver(updateTransform);
        observer.observe(host);

        // Initial calculation
        updateTransform();

        return () => observer.disconnect();
    }, [updateTransform]);

    const handleSlotMove = (id: string, stageX: number, stageY: number) => {
        setSlots(prev => prev.map(s => {
            if (s.id !== id) return s;

            // Apply snapping to shelf lips (within 12px)
            let finalY = stageY;
            const SIT_OFFSET_VAL = 4;

            for (const lipY of Object.values(shelfLips)) {
                const targetY = lipY - SIT_OFFSET_VAL;
                if (Math.abs(stageY - targetY) < 12) {
                    finalY = targetY;
                    break;
                }
            }

            return { ...s, anchorX: Math.round(stageX), anchorY: Math.round(finalY) };
        }));
    };

    const handleLipMouseDown = (e: React.MouseEvent, lipKey: string, lipY: number) => {
        if (!isCalibrating) return;
        e.preventDefault();
        e.stopPropagation();

        setDraggedLip(lipKey);
        dragLipStartRef.current = {
            y: e.clientY,
            lipY: lipY
        };
    };

    const handleLipMouseMove = useCallback((e: MouseEvent) => {
        if (!draggedLip || !dragLipStartRef.current) return;

        const dy = (e.clientY - dragLipStartRef.current.y) / transform.scale;
        const newLipY = Math.round(dragLipStartRef.current.lipY + dy);

        setShelfLips(prev => ({
            ...prev,
            [draggedLip]: Math.max(0, Math.min(STAGE_H, newLipY))
        }));
    }, [draggedLip, transform.scale]);

    const handleLipMouseUp = useCallback(() => {
        setDraggedLip(null);
        dragLipStartRef.current = null;
    }, []);

    useEffect(() => {
        if (draggedLip) {
            window.addEventListener('mousemove', handleLipMouseMove);
            window.addEventListener('mouseup', handleLipMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleLipMouseMove);
                window.removeEventListener('mouseup', handleLipMouseUp);
            };
        }
    }, [draggedLip, handleLipMouseMove, handleLipMouseUp]);

    const handleExport = () => {
        const slotsJson = JSON.stringify(slots, null, 2);
        const shelfLipsCode = `export const SHELF_LIPS = {
    TOP: ${shelfLips.TOP},
    SHELF3: ${shelfLips.SHELF3},
    SHELF2: ${shelfLips.SHELF2},
    SHELF1: ${shelfLips.SHELF1},
    BOTTOM: ${shelfLips.BOTTOM},
} as const;`;

        const fullExport = `// SHELF_LIPS Constants
${shelfLipsCode}

// TROPHY_SLOTS Array
export const TROPHY_SLOTS: SlotAnchor[] = ${slotsJson}`;

        navigator.clipboard.writeText(fullExport);
        alert('Trophy slots + shelf lips copied to clipboard!');
        console.log('--- CALIBRATED MANIFEST ---');
        console.log(fullExport);
    };

    return (
        <div className="home-realm">
            <div className="dev-controls">
                <DebugToggle />
                {process.env.NODE_ENV === 'development' && (
                    <>
                        <button
                            className={`dev-btn ${isCalibrating ? 'active' : ''}`}
                            onClick={() => setIsCalibrating(!isCalibrating)}
                        >
                            {isCalibrating ? 'Exit Calibration' : 'Calibrate'}
                        </button>
                        {isCalibrating && (
                            <button className="dev-btn export-btn" onClick={handleExport}>
                                Export JSON
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* StageHost: fills available area */}
            <div ref={hostRef} className="stage-host">
                {/* Stage: fixed 390×844 canvas with global transform */}
                <div
                    className="stage"
                    data-debug={debugActive || isCalibrating}
                    style={{
                        width: STAGE_W,
                        height: STAGE_H,
                        transform: `translate(${transform.dx}px, ${transform.dy}px) scale(${transform.scale})`,
                    }}
                >
                    {/* Z-0: Background stars */}
                    <div className="stage-layer layer-bg-stars">
                        <picture>
                            <source srcSet="/ui/bg_stars.webp" type="image/webp" />
                            <img src="/ui/bg_stars.png" alt="" className="stage-img" />
                        </picture>
                    </div>

                    {/* Z-1: Frame overlay BACK (behind items) */}
                    <div className="stage-layer layer-overlay-back">
                        <img
                            src="/ui/frame_overlay_back.png"
                            alt=""
                            className="stage-img"
                            onLoad={() => {
                                if (process.env.NODE_ENV === 'development') {
                                    console.log('[HomeRealm] frame_overlay_back.png LOADED');
                                }
                            }}
                            onError={(e) => {
                                // Fallback to original combined overlay
                                const img = e.target as HTMLImageElement;
                                if (!img.src.includes('frame_arch_overlay.png')) {
                                    img.src = '/ui/frame_arch_overlay.png';
                                }
                            }}
                        />
                    </div>

                    {/* Z-10: SlotFrame items */}
                    <TrophySlotFrame
                        slots={slots}
                        isCalibrating={isCalibrating}
                        onSlotMove={isCalibrating ? handleSlotMove : undefined}
                        stageTransform={transform}
                    />

                    {/* Z-20: Frame overlay FRONT (occlusion) */}
                    <div className="stage-layer layer-overlay-front">
                        <img
                            src="/ui/frame_overlay_front.png"
                            alt=""
                            className="stage-img"
                            onLoad={() => {
                                if (process.env.NODE_ENV === 'development') {
                                    console.log('[HomeRealm] frame_overlay_front.png LOADED');
                                }
                            }}
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                            }}
                        />
                    </div>

                    {/* Z-30: Debug alignment guides */}
                    {(debugActive || isCalibrating) && (
                        <div className="stage-layer layer-debug-guides">
                            {/* Shelf lip guide lines - draggable in calibration mode */}
                            <div
                                className={`debug-guide-line ${isCalibrating ? 'draggable' : ''} ${draggedLip === 'TOP' ? 'dragging' : ''}`}
                                style={{ top: shelfLips.TOP }}
                                data-label={`Top Shelf (${shelfLips.TOP})`}
                                onMouseDown={isCalibrating ? (e) => handleLipMouseDown(e, 'TOP', shelfLips.TOP) : undefined}
                            />
                            <div
                                className={`debug-guide-line ${isCalibrating ? 'draggable' : ''} ${draggedLip === 'SHELF3' ? 'dragging' : ''}`}
                                style={{ top: shelfLips.SHELF3 }}
                                data-label={`Shelf 3 (${shelfLips.SHELF3})`}
                                onMouseDown={isCalibrating ? (e) => handleLipMouseDown(e, 'SHELF3', shelfLips.SHELF3) : undefined}
                            />
                            <div
                                className={`debug-guide-line ${isCalibrating ? 'draggable' : ''} ${draggedLip === 'SHELF2' ? 'dragging' : ''}`}
                                style={{ top: shelfLips.SHELF2 }}
                                data-label={`Shelf 2 (${shelfLips.SHELF2})`}
                                onMouseDown={isCalibrating ? (e) => handleLipMouseDown(e, 'SHELF2', shelfLips.SHELF2) : undefined}
                            />
                            <div
                                className={`debug-guide-line ${isCalibrating ? 'draggable' : ''} ${draggedLip === 'SHELF1' ? 'dragging' : ''}`}
                                style={{ top: shelfLips.SHELF1 }}
                                data-label={`Shelf 1 (${shelfLips.SHELF1})`}
                                onMouseDown={isCalibrating ? (e) => handleLipMouseDown(e, 'SHELF1', shelfLips.SHELF1) : undefined}
                            />
                            <div
                                className={`debug-guide-line ${isCalibrating ? 'draggable' : ''} ${draggedLip === 'BOTTOM' ? 'dragging' : ''}`}
                                style={{ top: shelfLips.BOTTOM }}
                                data-label={`Bottom Shelf (${shelfLips.BOTTOM})`}
                                onMouseDown={isCalibrating ? (e) => handleLipMouseDown(e, 'BOTTOM', shelfLips.BOTTOM) : undefined}
                            />

                            {/* Center crosshairs at each shelf lip */}
                            <div className="debug-crosshair" style={{ top: shelfLips.TOP }} />
                            <div className="debug-crosshair" style={{ top: shelfLips.SHELF3 }} />
                            <div className="debug-crosshair" style={{ top: shelfLips.SHELF2 }} />
                            <div className="debug-crosshair" style={{ top: shelfLips.SHELF1 }} />
                            <div className="debug-crosshair" style={{ top: shelfLips.BOTTOM }} />
                        </div>
                    )}

                    {/* Z-35: Cabinet outline (debug) */}
                    <div className="stage-layer layer-cabinet-outline">
                        <div className="shelf-line shelf-line-1" />
                        <div className="shelf-line shelf-line-2" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomeRealm;
