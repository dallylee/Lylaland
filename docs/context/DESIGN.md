# DESIGN: Sparkle World

## UI layering (z-index order)
1. bg_stars (lowest)
2. ArchWindow (masked sky/moon)
3. Shelf (wood layers)
4. ActiveRealmComponent (feature UI)
5. frame_arch_overlay (architecture/vines)
6. BottomNav (navigation)
7. Hotspots (invisible interactive zones)

## Navigation
- BottomNav uses the Realm Registry (`src/registry.ts`) to render tabs consistently.
- The 'Cathedral' shell owns routing between realms and keeps realm modules decoupled.

## Realm plugin architecture
- Each realm is a standalone module component.
- The shell imports realms via React.lazy to keep initial load small.
- To add a new module, only the registry needs updating.

## State: Magic Bridge (React Context)
Expose to all realms:
- stars: number
- inventory: string[]
- addStars(count: number): void
- unlockItem(id: string): void

## Home realm specifics
- Shelf slots map from inventory item IDs to placed trophy visuals.
- Owl prophecy: local JSON list, one per 24h, with lastProphecyTimestamp stored in Dexie.
- Hotspot sequences: tapped hotspot IDs recorded, matched against a table of unlock sequences.
- Dragon egg hatch: triggered when inventory.length === MAX.

## Media realm specifics
- Search query drives Archive.org requests.
- Media completion writes to completion log and calls addStars(10).

## Diary realm specifics
- 'Vault' lock state determined by presence of derived key in memory only.
- Store: salt, per-entry iv, ciphertext; never store derived key.
- UI: warning copy about no recovery and irreversible lockout if emoji key is lost.

## Assets
- All images expected under `public/ui/` as per handover.
- Confirm canonical filenames for icons and layered arch assets.
