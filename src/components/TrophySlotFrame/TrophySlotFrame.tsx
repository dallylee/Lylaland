import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TROPHY_SLOTS, getSlotStyle, SlotAnchor } from '../../slots';
import { useMagic } from '../../context/MagicContext';
import './TrophySlotFrame.css';

/**
 * Build slot-to-item mapping using filename-based placement
 * 
 * Filename format: {slotId}_{itemName}.png
 * Examples:
 *   - s3_p1_owl.png → Owl appears at Shelf 3, Position 1
 *   - rt_stone_p1_bluepotion.png → Blue Potion at Right Tower Stone Position 1
 *   - ts_p2_trophy.png → Trophy at Top Shelf, Position 2
 * 
 * Falls back to array-based mapping for items without slot prefix.
 */
function buildSlotItemMap(inventory: string[]): Map<string, string> {
    const map = new Map<string, string>();
    const slots = [...TROPHY_SLOTS];

    // Create array of valid slot IDs for ES5 compatibility
    const validSlotIds = slots.map(s => s.id);

    inventory.forEach((item, idx) => {
        // Try filename-based placement first
        let placed = false;

        // Check if item name starts with a valid slot ID
        validSlotIds.forEach((slotId) => {
            // Pattern: {slotId}_{itemName}
            if (!placed && item.startsWith(slotId + '_')) {
                // Extract the actual item name after the slot prefix
                const itemName = item.substring(slotId.length + 1);
                map.set(slotId, itemName);
                placed = true;
            }
        });

        // Fallback: array-based mapping (backward compatibility)
        if (!placed && idx < slots.length) {
            map.set(slots[idx].id, item);
        }
    });

    return map;
}

interface TrophySlotFrameProps {
    slots?: SlotAnchor[];
    isCalibrating?: boolean;
    onSlotMove?: (id: string, stageX: number, stageY: number) => void;
    stageTransform?: { scale: number; dx: number; dy: number };
}

/**
 * TrophySlotFrame - Renders items into anchor-positioned slots
 * 
 * Uses anchor-based placement:
 * - Each slot has an anchor point (bottom-center of item)
 * - Debug mode shows hit areas + anchor crosshairs
 * - Calibration mode enables draggable anchors with snapping
 */
export function TrophySlotFrame({
    slots = TROPHY_SLOTS,
    isCalibrating = false,
    onSlotMove,
    stageTransform = { scale: 1, dx: 0, dy: 0 }
}: TrophySlotFrameProps) {
    const { inventory, isMirrorProphecyAvailable, processEvent } = useMagic();
    const [debugActive, setDebugActive] = useState(window.__DEBUG_SLOTS__ || false);
    const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
    const dragStartRef = useRef<{ x: number; y: number; anchorX: number; anchorY: number } | null>(null);

    useEffect(() => {
        const handleToggle = () => setDebugActive(window.__DEBUG_SLOTS__);
        window.addEventListener('sparkle-debug-toggle' as any, handleToggle);
        return () => window.removeEventListener('sparkle-debug-toggle' as any, handleToggle);
    }, []);

    // Development only: Force some items if flag is active
    const effectiveInventory = [...inventory];
    if (process.env.NODE_ENV === 'development' && window.__FORCE_ITEMS__) {
        if (!effectiveInventory.includes('owl')) effectiveInventory.push('owl');
        if (!effectiveInventory.includes('potion1')) effectiveInventory.push('potion1');
        if (!effectiveInventory.includes('trophy1')) effectiveInventory.push('trophy1');
    }

    const slotItemMap = buildSlotItemMap(effectiveInventory);

    const handleMouseDown = useCallback((e: React.MouseEvent, slot: SlotAnchor) => {
        if (!isCalibrating || !onSlotMove) return;
        e.preventDefault();

        setDraggedSlotId(slot.id);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            anchorX: slot.anchorX,
            anchorY: slot.anchorY
        };
    }, [isCalibrating, onSlotMove]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggedSlotId || !dragStartRef.current || !onSlotMove) return;

        const dx = (e.clientX - dragStartRef.current.x) / stageTransform.scale;
        const dy = (e.clientY - dragStartRef.current.y) / stageTransform.scale;

        const newAnchorX = dragStartRef.current.anchorX + dx;
        const newAnchorY = dragStartRef.current.anchorY + dy;

        onSlotMove(draggedSlotId, newAnchorX, newAnchorY);
    }, [draggedSlotId, onSlotMove, stageTransform.scale]);

    const handleMouseUp = useCallback(() => {
        setDraggedSlotId(null);
        dragStartRef.current = null;
    }, []);

    useEffect(() => {
        if (draggedSlotId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggedSlotId, handleMouseMove, handleMouseUp]);

    return (
        <div className="trophy-slot-frame" data-debug={debugActive || isCalibrating} data-calibrating={isCalibrating}>
            {slots.map((slot) => {
                const itemId = slotItemMap.get(slot.id);
                const hasItem = Boolean(itemId);
                const isDragging = draggedSlotId === slot.id;

                return (
                    <div
                        key={slot.id}
                        className={`slot ${debugActive || isCalibrating ? 'slot-debug' : ''} ${hasItem ? 'slot-filled' : ''} ${isDragging ? 'slot-dragging' : ''} ${itemId === 'item_03_clueRelic' && isMirrorProphecyAvailable ? 'mirror-prophecy' : ''}`}
                        style={getSlotStyle(slot)}
                        data-slot-id={slot.id}
                        onMouseDown={isCalibrating ? (e) => handleMouseDown(e, slot) : undefined}
                        onClick={!isCalibrating && itemId === 'item_03_clueRelic' ? () => processEvent('prophecy_tapped') : undefined}
                    >
                        {/* Item image - bottom-center pinned to anchor */}
                        {hasItem && (
                            <img
                                src={`/ui/items/${itemId}.png`}
                                alt={itemId}
                                className="slot-item"
                                onError={(e) => {
                                    if (process.env.NODE_ENV === 'development') {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpIi8+PHRleHQgeD0iNTAiIHk9IjYwIiBmb250LXNpemU9IjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5iOPC90ZXh0Pjwvc3ZnPg==';
                                    } else {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }
                                }}
                            />
                        )}

                        {/* Debug/Calibration: Anchor crosshair at bottom-center */}
                        {(debugActive || isCalibrating) && (
                            <div className="anchor-marker">
                                {isCalibrating && (
                                    <div className="anchor-coords">
                                        {Math.round(slot.anchorX)}, {Math.round(slot.anchorY)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default TrophySlotFrame;
