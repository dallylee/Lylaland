import React, { Suspense, useMemo } from 'react';
import { useMagic } from '../../context/MagicContext';
import { getRealmById, DEFAULT_REALM_ID } from '../../registry';
import { BgStars, ArchWindow, FrameOverlay } from '../BackgroundLayers';
import { TopHudCounters } from '../TopHudCounters';
import { BottomNav } from '../BottomNav';
import { Hotspot } from '../Hotspot';
import { getHotspotsForRealm } from '../../config/hotspotRegistry';
import { HatchCinematic } from '../HatchCinematic/HatchCinematic';
import './Cathedral.css';

/**
 * Loading fallback for lazy-loaded realms
 */
function RealmLoader() {
    return (
        <div className="realm-loader">
            <div className="loader-spinner">✨</div>
            <p>Opening realm...</p>
        </div>
    );
}

/**
 * Cathedral - Main shell container
 * Manages layered backgrounds and realm rendering
 */
export function Cathedral() {
    const { activeRealmId, showEggHatch, setShowEggHatch } = useMagic();
    const realm = getRealmById(activeRealmId) || getRealmById(DEFAULT_REALM_ID);

    const hotspots = useMemo(() => getHotspotsForRealm(activeRealmId), [activeRealmId]);

    if (!realm) {
        return <div>Error: No realm found</div>;
    }

    const RealmComponent = realm.component;

    return (
        <div className="cathedral">
            {/* Z-1: Star background */}
            <BgStars />

            {/* Z-2: Arched window */}
            <ArchWindow />

            {/* Z-4: Active realm content */}
            <main className="realm-content">
                <Suspense fallback={<RealmLoader />}>
                    <RealmComponent />
                </Suspense>

                {/* Hotspots for discovery - rendered inside main to maintain relative scaling if applicable */}
                {hotspots.map(h => (
                    <Hotspot
                        key={h.id}
                        id={h.id}
                        realm={h.realm}
                        x={h.x}
                        y={h.y}
                        width={h.width}
                        height={h.height}
                    />
                ))}
            </main>

            {/* Z-5: Decorative frame overlay */}
            <FrameOverlay />

            {/* Z-6: HUD counters (top) */}
            <TopHudCounters />

            {/* Z-6: Navigation (bottom) */}
            <BottomNav />

            {/* Z-1000: Egg Hatch Cinematic Overlay */}
            {showEggHatch && (
                <HatchCinematic onClose={() => setShowEggHatch(false)} />
            )}
        </div>
    );
}

export default Cathedral;
