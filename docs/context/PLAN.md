# PLAN: Sparkle World

This plan is written to match the uploaded specification and to minimise rework.

## Milestones

### M0 Context and plan gate
- Context Pack complete: PRD, STACK, DESIGN, PLAN, PLAN_REVIEW
- Discovery Output recorded and reviewed

Pass criteria:
- docs/context files exist and align with SPEC
- PLAN_REVIEW acceptance checklist is ready for sign-off

### M1 App shell and realm registry
- CRA/CRACO React + TypeScript scaffold
- Tailwind configured
- Cathedral shell layout and layered background pipeline
- Realm registry and BottomNav rendering from registry
- React.lazy realm loading

Pass criteria:
- App boots and switches between placeholder realms
- Layout matches mobile-first, centred desktop constraint

### M2 Local persistence foundation (Dexie)
- Dexie schema v1:
  - stars, inventory
  - timestamps: lastProphecyTimestamp, lastRiddleTimestamp
  - diary: salt + entries (iv, ciphertext, createdAt)
  - completion logs and high scores
- Load/save flows wired into MagicContext

Pass criteria:
- Reload preserves stars/inventory/timestamps
- No plaintext diary content stored

### M3 Home realm core loop
- Trophy shelf rendering from inventory
- Owl prophecy engine (24h)
- Hotspot sequence unlocks
- Dragon egg hatch trigger at MAX inventory

Pass criteria:
- All triggers work and persist correctly

### M4 Media realm
- Archive.org search (books/audiobooks)
- YouTube embed cards
- Card UI for details
- 'Mark as Watched/Read' +10 stars

Pass criteria:
- Search works, reward persists, embeds responsive

### M5 Diary realm
- Emoji key input, PBKDF2 key derivation
- AES-GCM encryption/decryption per entry
- Lock/unlock UX and no recovery warning
- SpeechRecognition input with fallback

Pass criteria:
- Cannot decrypt without correct key, plaintext never stored
- Voice input degrades gracefully where unsupported

### M6 Daily riddle system
- 24h gating, one attempt
- Success gives +20 stars
- Local JSON riddle bank

Pass criteria:
- Enforced attempt limit and gating persists

### M7 PWA and mobile/performance gates
- Service worker for offline shell
- Define offline UX for remote media
- Basic accessibility and performance checks

Pass criteria:
- Shell loads offline
- No horizontal scroll at 320px+
