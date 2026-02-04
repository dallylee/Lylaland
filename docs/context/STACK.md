# STACK: Sparkle World

## Frontend
- React + TypeScript (CRA/CRACO as per handover)
- Tailwind CSS

## Persistence
- Dexie.js (IndexedDB wrapper) for:
  - stars, inventory
  - diary entry metadata and ciphertext
  - prophecy/riddle timestamps
  - completion logs and high scores

## Crypto
- Web Crypto API
  - PBKDF2 for emoji-key derivation (salt per user vault)
  - AES-GCM for diary entry encryption (unique IV per entry)

## Media integrations
- Archive.org advancedsearch JSON endpoint for books/audiobooks
- YouTube embeds via iframe

## Voice input
- Web Speech API: SpeechRecognition (feature-detect and provide fallback)

## Performance and UX
- React.lazy dynamic imports for realm modules
- PWA service worker for offline shell
