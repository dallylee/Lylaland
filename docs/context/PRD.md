# PRD: Sparkle World

## Product goal
Create a whimsical, magical, private 'digital grimoire' that feels safe and personal, designed for a 12-year-old audience.

## Hard constraints
- 100% local-first: no backend, no accounts, no tracking
- Zero cost: no paid APIs; use browser-native features and free public APIs (Archive.org, YouTube embeds)
- Mobile-first layout; on desktop the app is centred and aspect-ratio constrained
- Data persistence: Dexie (IndexedDB) only
- Diary must be encrypted using Web Crypto (AES-GCM) with an emoji-derived key (PBKDF2); no recovery

## MVP realms
### Home (Trophy Room)
- Layered UI using `ArchWindow.tsx` and `Shelf.tsx` from handover
- Inventory-driven trophies placed on shelves (potions, eggs, feathers, etc.)
- Owl prophecy engine: one prophecy per 24h from local JSON
- Easter-egg hotspot tap sequences unlock hidden items
- Dragon egg hatches when inventory reaches MAX

### Media (Books & Videos)
- Archive.org advancedsearch (JSON) for books and audiobooks
- YouTube embed cards for videos
- Card UI that reveals details on click
- Reward: 'Mark as Watched/Read' gives +10 stars

### Diary (Emoji Vault)
- Emoji key derives encryption key (PBKDF2) and encrypts entries (AES-GCM)
- Clear 'no recovery' warning
- Encrypted entries stored; decrypt only on unlock
- Text entry plus optional voice input via SpeechRecognition where available

## Daily riddle system
- 24h gating using lastRiddleTimestamp stored in Dexie
- One attempt per day
- Success reward: +20 stars

## Future modules (non-MVP, but supported by architecture)
- Games: quizzes, memory match as standalone components
- Crafts: step-by-step DIY guides
- Save highscores and completion logs to Dexie

## Success criteria (V1)
- Runs entirely client-side with no analytics or network dependencies for core play loop
- Works smoothly on a typical mobile viewport (320px and up) with no horizontal scroll
- Diary entries are not readable without the emoji key, and plaintext is not stored
- Offline: app shell loads without network, with clear UX for online-only media
