# Sparkle World - Repository Documentation

Sparkle World is a whimsical, magical digital grimoire designed for young adventurers. It is a local-first, privacy-focused application built with modern web technologies.

## 🌟 Project Vision

- **Atmosphere**: Whimsical, magical, and private.
- **Privacy First**: 100% local-first. No backend, no accounts, no tracking.
- **Zero Cost**: Built using browser-native features and free public APIs.
- **Accessibility**: Mobile-first design, responsive layout.

## 🗺️ Semantic Map

### 🏗️ Architecture: Modular "Realm" System

The application follows a **Plugin Architecture**. The core "Skeleton" (The Cathedral) is decoupled from individual feature modules (Realms).

- **Registry (`src/registry.ts`)**: The central manifest. Adding a feature only requires adding an entry here.
- **Realms (`src/realms/`)**: Standalone feature modules (Home, Media, Diary, Games, Crafts).
- **Cathedral (`src/components/Cathedral/`)**: The main layout wrapper that handles background layering and navigation.

### 🧪 State Management: The "Magic Bridge"

The app uses a central React Context to provide a unified interface for all modules.

- **MagicContext (`src/context/MagicContext.tsx`)**:
  - `stars`: Global currency/reward system.
  - `inventory`: Collection of magical items.
  - `activeRealmId`: Current navigation state.
  - `addStars()` / `unlockItem()`: Actions available to any realm.

### 📦 Data Layer: Local-First Persistence

- **Dexie.js**: An IndexedDB wrapper used for all persistent data (Stars, Inventory, Diary Entries, Game Progress).
- **Web Crypto API**: AES-GCM encryption used for securing private diary content.

### 🎨 UI & Layering (Z-Index)

1. `bg_stars` (Lowest)
2. `ArchWindow` (Masked sky/moon)
3. `Shelf` (Wood layers)
4. `ActiveRealmComponent` (Feature UI)
5. `frame_arch_overlay` (Architecture/Vines)
6. `BottomNav` (Navigation)
7. `Hotspots` (Interactive zones)

## 📂 Directory Structure

- `/public`: Static assets, UI images, sounds.
- `/src/components`: Reusable UI components (Cathedral, Hud, Nav).
- `/src/context`: State management (MagicContext).
- `/src/realms`: Individual feature modules (Realms).
- `/src/services`: Utility services (SoundManager).
- `/src/slots`: Item placement logic for the trophy room.

## 🛠️ Core Dependencies

- **React 19**: UI Framework.
- **TypeScript**: Type safety.
- **Tailwind CSS**: Styling and layout.
- **Dexie.js**: Local database.
- **CRACO**: Configuration override for Create React App.

## 📜 Coding Patterns

- **Lazy Loading**: Realms are loaded via `React.lazy` to optimize initial load.
- **Hooks**: Functional components with `useMagic` for state access.
- **Service Pattern**: Singleton services (like `SoundManager`) for non-UI logic.
