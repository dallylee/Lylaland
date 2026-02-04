# PLAN REVIEW: Sparkle World

## Required Discovery Output

```json
{
  "understanding_summary": [
    "Sparkle World is a mobile-first, whimsical React + TypeScript PWA for a 12-year-old audience, designed as a private 'digital grimoire'.",
    "It is strictly local-first: no backend, no accounts, no tracking, and uses Dexie (IndexedDB) for persistence.",
    "The app follows a plugin-like 'Realm' system driven by a central registry; shared state is provided via a React Context ('Magic Bridge').",
    "Key features include Home (trophy room, owl prophecy, easter-egg hotspots, dragon egg hatch), Media (Archive.org discovery plus YouTube embeds and rewards), Diary (emoji-derived key encryption using Web Crypto and optional voice input), plus future Games and Crafts modules."
  ],
  "open_questions": [
    "Where are the referenced handover UI components (ArchWindow.tsx and Shelf.tsx) and the asset pack under public/ui/, and what are the canonical filenames?",
    "What is the minimum supported browser set for V1 (especially for SpeechRecognition support and iOS constraints)?",
    "What is the expected offline UX for Archive.org searches and YouTube embeds, and do we cache any metadata locally?",
    "What are the initial local JSON contents for prophecies and riddles (quantity, tone boundaries, any banned themes)?",
    "What is the initial Dexie schema versioning and migration approach for future changes (upgrade paths versus reset)?"
  ],
  "complexity_level": {
    "level": 2,
    "justification": "Single-frontend app with no backend, but moderate complexity from plugin-style architecture, encrypted diary with key derivation, PWA offline shell, and browser-dependent voice input behaviour."
  },
  "stack_options": [
    {
      "stack": "React + TypeScript (CRA/CRACO), Tailwind, Dexie, Web Crypto, Web Speech API, PWA service worker",
      "tradeoffs": "Matches the specification and handover constraints; CRA/CRACO is stable but slower than modern bundlers; acceptable for V1.",
      "recommended": true
    },
    {
      "stack": "React + TypeScript (Vite), Tailwind, Dexie, Web Crypto, Web Speech API, PWA plugin",
      "tradeoffs": "Faster dev/build loop; diverges from 'CRA/CRACO as per handover' and may cause rework if handover assumes CRA conventions.",
      "recommended": false
    }
  ],
  "draft_milestones": [
    {
      "code": "M0_CONTEXT_LOADING_AND_PLAN",
      "description": "Context Pack completed (PRD/STACK/DESIGN/PLAN/PLAN_REVIEW) derived from the Sparkle World specification; Discovery Output recorded.",
      "pass_criteria": "docs/context contains required files and DISCOVERY.json; PLAN_REVIEW contains the Discovery Output block."
    },
    {
      "code": "M1_APP_SHELL_AND_REALM_REGISTRY",
      "description": "Implement the 'Cathedral' shell: layered background assets, BottomNav, Realm registry, and lazy-loaded realms wired to MagicContext.",
      "pass_criteria": "App renders shell and can navigate between realms; realms are React.lazy loaded; MagicContext provides stars/inventory."
    },
    {
      "code": "M2_LOCAL_PERSISTENCE_FOUNDATION",
      "description": "Dexie schema for stars, inventory, diary entry metadata, completion logs, timestamps (lastProphecy, lastRiddle). Load/save flows.",
      "pass_criteria": "Reloading preserves stars, inventory, and timestamps; schema versioning documented."
    },
    {
      "code": "M3_HOME_REALM_CORE_LOOP",
      "description": "Home realm trophy shelf, owl prophecy engine (24h), hotspot sequence unlocks, dragon egg hatch trigger when inventory is full.",
      "pass_criteria": "Inventory updates shelf; prophecy changes after 24h; hotspot sequence unlocks items; hatch triggers at MAX inventory."
    },
    {
      "code": "M4_MEDIA_REALM_AND_REWARDS",
      "description": "Archive.org advancedsearch integration for books/audiobooks; YouTube embeds for videos; card UI with details; mark watched/read triggers ProgressionEngine mediaInteraction event, awards configured stars, respects daily cap, and persists via Dexie.",
      "pass_criteria": "Search returns and displays results; marking content grants stars and persists; embeds are responsive and sandboxed."
    },
    {
      "code": "M5_DIARY_ENCRYPTION_AND_VOICE",
      "description": "Emoji key derivation with PBKDF2; AES-GCM encrypt/decrypt diary entries; lock/unlock UX with no-recovery warning; voice input fallback.",
      "pass_criteria": "Encrypted entries are unreadable without correct key; plaintext not stored; voice input works where supported and degrades gracefully."
    },
    {
      "code": "M6_EXPANDED_OWL_QUIZ_AND_ENGAGEMENT_LOGS",
      "description": "Expand owl quiz content pool; enforce anti-repeat and 24h gating; add local engagement logs in Dexie. Stub Games and Crafts module slots.",
      "pass_criteria": "Owl quiz gating works; anti-repeat enforced; engagement logs stored in Dexie."
    },
    {
      "code": "M7_PWA_OFFLINE_AND_MOBILE_GATES",
      "description": "Service worker offline shell; define offline UX for remote content; apply mobile-first UI and performance gates; basic accessibility sweep.",
      "pass_criteria": "App shell loads offline; no horizontal scroll from 320px upwards; acceptable Lighthouse baseline; core UX usable on mobile."
    }
  ],
  "context_pack_status": {
    "status": "PASS",
    "missing_files": []
  },
  "format_flags": [
    "none"
  ]
}
```

## Acceptance checklist

- [ ] Plan matches SPEC constraints (local-first, no backend, zero cost)
- [ ] Realm plugin architecture is registry-driven and decoupled
- [ ] Dexie schema and migration approach defined
- [ ] Diary crypto approach reviewed (PBKDF2 params, AES-GCM, salt/iv storage)
- [ ] Offline behaviour defined for Archive.org and YouTube content
- [ ] Browser support decisions documented (SpeechRecognition fallbacks)

## Notes / decisions

### Decision Lock (M4 onwards)

1. **Offline UX for Archive.org and YouTube (V1)**
   - “Offline-friendly shell, online-only media”
   - Do not cache media streams
   - Do cache lightweight metadata in Dexie:
     - last successful search results (optional, capped, e.g. 20 items)
     - user saved list (optional)
     - completion state (watched/read) with timestamps
   - When offline or fetch fails:
     - show a friendly offline panel
     - render cached saved items and logs
     - disable embeds and show “Open when online” behaviour

2. **Minimum supported browsers (V1)**
   - Capability-based support, no hard-coded browser versions
   - Baseline capability expectations: IndexedDB (Dexie), Web Crypto, modern ES modules
   - SpeechRecognition explicitly optional:
     - if window.SpeechRecognition or window.webkitSpeechRecognition exists, enable voice
     - otherwise hide/disable mic UI and show typing fallback
   - Time windows use device local time, not any fixed region

3. **Dexie schema versioning and migration approach (V1)**
   - Additive migrations only, never silent resets
   - Use Dexie db.version(n).stores(...).upgrade(...)
   - For shape changes: provide upgrade transforms, never delete user diary data automatically
   - If a hard break is unavoidable: must be a user-triggered reset, never automatic

4. **Glossary and reward locks**
   - Canonical term is “quiz”:
     - Owl = daily quiz (interactive), 24h gating, correct reward is 8 gold stars
     - Mirror = clue delivery (non-interactive clue scroll), arms discovery, 24h window, re-offer until solved
     - Treat “prophecy” as legacy wording only
   - Reward amounts are locked and must not be altered by docs or implementation:
     - owl 8, craft 3, diary 1, game 1, media 1, streak 8

5. **Known doc mismatch notes (document, do not fix other files here)**
   - PLAN.md mentions M4 “+10 stars” and M6 “Riddle of the Day +20”.
     - Record that implementation must award stars via ProgressionEngine using progressionConfig values, and must not introduce a second daily riddle system that conflicts with Owl = daily quiz.
