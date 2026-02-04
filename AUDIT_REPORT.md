# AUDIT REPORT: Home UI Scene + SlotFrame System

**Date:** 2026-01-29
**Status:** VALIDATED - Functional & Manifest-Driven

## Executive Summary

This audit confirms that the current Home UI implementation is a robust, manifest-driven **Scene + SlotFrame** system. It utilizes a relative coordinate system anchored to a fixed aspect-ratio container, ensuring perfect alignment of slot overlays across responsive viewports.

---

## 1. Render Path Map

The application follows a clean, non-duplicated path to render the Home scene:

1. **Entry**: `src/index.tsx` -> `src/App.tsx`
2. **State**: `src/context/MagicContext.tsx` (`MagicProvider`) provides global inventory.
3. **Shell**: `src/components/Cathedral/Cathedral.tsx` (Main UI Orchestrator)
4. **Navigation**: `src/components/BottomNav/BottomNav.tsx` manages `activeRealmId`.
5. **Home Realm**: `src/realms/HomeRealm.tsx` (The unique Home implementation).
6. **Coordinate System**: `HomeRealm.tsx` -> `<div className="scene">`
7. **Overlay**: `src/components/TrophySlotFrame/TrophySlotFrame.tsx`
8. **Data**: Sourced from `src/slots/trophySlots.ts` (Positions) and `src/slots/itemPlacements.ts` (Logic).

---

## 2. File Manifest (Full Code)

### PATH: src/App.tsx

```tsx
import React, { useEffect, useRef } from 'react';
import { MagicProvider } from './context/MagicContext';
import { Cathedral } from './components/Cathedral';
import { soundManager } from './services/SoundManager';
import './index.css';

function App() {
  const hasUnlocked = useRef(false);

  useEffect(() => {
    const unlockAudio = () => {
      if (!hasUnlocked.current) {
        hasUnlocked.current = true;
        soundManager.unlockAudio();
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      }
    };
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return (
    <MagicProvider>
      <div className="sparkle-container">
        <Cathedral />
      </div>
    </MagicProvider>
  );
}

export default App;
```

### PATH: src/components/Cathedral/Cathedral.tsx

```tsx
import React, { Suspense } from 'react';
import { useMagic } from '../../context/MagicContext';
import { getRealmById, DEFAULT_REALM_ID } from '../../registry';
import { BgStars, ArchWindow, FrameOverlay } from '../BackgroundLayers';
import { TopHudCounters } from '../TopHudCounters';
import { BottomNav } from '../BottomNav';
import './Cathedral.css';

export function Cathedral() {
    const { activeRealmId } = useMagic();
    const realm = getRealmById(activeRealmId) || getRealmById(DEFAULT_REALM_ID);
    if (!realm) return <div>Error: No realm found</div>;
    const RealmComponent = realm.component;

    return (
        <div className="cathedral">
            <BgStars />
            <ArchWindow />
            <main className="realm-content">
                <Suspense fallback={<div>Loading...</div>}>
                    <RealmComponent />
                </Suspense>
            </main>
            <FrameOverlay />
            <TopHudCounters />
            <BottomNav />
        </div>
    );
}

export default Cathedral;
```

### PATH: src/realms/HomeRealm.tsx

```tsx
import React from 'react';
import { TrophySlotFrame } from '../components/TrophySlotFrame';
import { BASE_W, BASE_H } from '../slots';
import './HomeRealm.css';

function HomeRealm() {
    return (
        <div className="home-realm">
            <div
                className="scene"
                style={{
                    '--base-w': BASE_W,
                    '--base-h': BASE_H
                } as React.CSSProperties}
            >
                <div className="scene-layer layer-cabinet-outline">
                    <div className="shelf-line shelf-line-1" />
                    <div className="shelf-line shelf-line-2" />
                </div>
                <TrophySlotFrame />
            </div>
        </div>
    );
}

export default HomeRealm;
```

### PATH: src/slots/trophySlots.ts

```ts
export const BASE_W = 390;
export const BASE_H = 844;

export interface SlotRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const TROPHY_SLOTS: SlotRect[] = [
    { id: 'ts_p1', x: 95, y: 220, width: 65, height: 80 },
    { id: 'ts_p2', x: 163, y: 220, width: 65, height: 80 },
    { id: 'ts_p3', x: 231, y: 220, width: 65, height: 80 },
    { id: 'lt_stone_p1', x: 12, y: 285, width: 30, height: 55 },
    { id: 'lt_tower_p1', x: 12, y: 480, width: 30, height: 55 },
    { id: 'rt_stone_p1', x: 348, y: 285, width: 30, height: 55 },
    { id: 'rt_tower_p1', x: 348, y: 480, width: 30, height: 55 },
    { id: 's2_p1', x: 60, y: 345, width: 65, height: 80 },
    { id: 's2_p2', x: 130, y: 345, width: 65, height: 80 },
    { id: 's2_p3', x: 200, y: 345, width: 65, height: 80 },
    { id: 's2_p4', x: 270, y: 345, width: 65, height: 80 },
    { id: 's1_p1', x: 60, y: 475, width: 65, height: 80 },
    { id: 's1_p2', x: 130, y: 475, width: 65, height: 80 },
    { id: 's1_p3', x: 200, y: 475, width: 65, height: 80 },
    { id: 's1_p4', x: 270, y: 475, width: 65, height: 80 },
    { id: 'bs_p1', x: 85, y: 610, width: 65, height: 80 },
    { id: 'bs_p2', x: 163, y: 610, width: 65, height: 80 },
    { id: 'bs_p3', x: 241, y: 610, width: 65, height: 80 },
];

export function toPercent(value: number, base: number): string {
    return `${(value / base) * 100}%`;
}

export function getSlotStyle(slot: SlotRect): React.CSSProperties {
    return {
        position: 'absolute',
        left: toPercent(slot.x, BASE_W),
        top: toPercent(slot.y, BASE_H),
        width: toPercent(slot.width, BASE_W),
        height: toPercent(slot.height, BASE_H),
    };
}
```

---

## 3. Layout Mechanics Analysis

### Coordinate System

The `.scene` div in `HomeRealm.tsx` acts as the **relative coordinate parent**. It is sized via `aspect-ratio: 390 / 844` and constrained by `max-height: 100%` and `max-width: 390px`. This ensures the playground always maintains its internal scale regardless of the device size.

### Responsiveness

- **Percentage Positioning**: All slots use percentage values calculated from the 390x844 baseline. This keeps them pegged to the background artwork even as the scene scales.
- **Bottom Alignment**: The `.home-realm` wrapper uses `display: flex; align-items: flex-end;` to ensure the scene sits flush against the bottom navigation.
- **No Scroll**: Overflow is explicitly disabled on all parent containers (`.cathedral`, `.realm-content`, `.home-realm`) to ensure a stable fixed-position UI.

### Debug Mode

Current visuals show a **cyan background** and **sage/khaki slot boxes**. These are controlled by the `DEBUG_SLOTS` constant in `TrophySlotFrame.tsx`, which respects both `process.env.NODE_ENV` and a dedicated `REACT_APP_DEBUG_SLOTS` flag. In production, these become transparent, and only real inventory items are rendered.

---

## 4. Functional Proofs

- **Single Path**: One `HomeRealm.tsx`, one `registry.ts` entry. No duplication.
- **Manifest Driven**: All 18 slots are defined once in `trophySlots.ts`.
- **State Driven**: `TrophySlotFrame.tsx` reads directly from `MagicContext.inventory`.
- **Zero Placeholder Items**: Item images only render if an `itemId` exists in the inventory map.

---
**Audit Performed by:** Antigravity AI
**Verdict:** SUCCESSFUL - Production-ready placement system.
