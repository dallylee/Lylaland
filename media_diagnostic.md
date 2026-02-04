# Media UI Diagnostic Report - Scroll and Frame Locks

**Date:** 2026-02-03
**Status:** Investigation Only (No changes made)
**Milestone:** M4_MEDIA_UI_DIAG_COMPLETE

---

## 1. Component Tree for Media

The following hierarchy governs the rendering of the Media section from the root application level down to the individual shelf items.

1. **App** (`src/App.tsx`)
    - Wrapper: `div.sparkle-container` (Layout constraints)
2. **Cathedral** (`src/components/Cathedral/Cathedral.tsx`)
    - Wrapper: `div.cathedral` (Relative positioning shell)
3. **Realm Shell** (`src/components/Cathedral/Cathedral.tsx`)
    - Wrapper: `main.realm-content` (Routing/Realm swap area)
4. **MediaRealm** (`src/realms/MediaRealm.tsx`)
    - Wrapper: `div.realm.media-realm` (Realm container)
5. **Media Tab Content** (`src/realms/MediaRealm.tsx`)
    - Wrapper: `div.tab-content` or `div.realm-content` (Inner content area)
6. **MediaShelf** (`src/components/Media/MediaShelf.tsx`)
    - Wrapper: `div.media-shelf` -> `div.shelf-row` (Horizontal axis)
7. **Media Items**
    - `BookFlipCard.tsx` (div.book-card-container)
    - `VideoCard.tsx` (div.video-card)

---

## 2. Scroll and Sizing Blockers

Evidence suggests multiple layers of `overflow: hidden` and absolute positioning are "locking" the vertical scroll.

### A) Global Body/Container Lock

- **File:** `src/index.css` (Lines 33-37, 77-84)
- **Rule:**

    ```css
    html, body, #root {
      height: 100%;
      width: 100%;
      overflow: hidden; /* GLOBAL LOCK */
    }

    .sparkle-container {
      width: 100%;
      max-width: 430px;
      height: 100%;
      margin: 0 auto;
      position: relative;
      overflow: hidden; /* FRAME LOCK */
    }
    ```

- **Explanation:** These rules prevent the browser's default document scroll. All scrolling must occur within a nested container that has `height` and `overflow-y: auto`.

### B) Cathedral Realm Shell Lock

- **File:** `src/components/Cathedral/Cathedral.css` (Lines 11-19)
- **Rule:**

    ```css
    .realm-content {
        position: absolute;
        inset: 0;
        bottom: 60px;
        z-index: 4;
        display: flex;
        flex-direction: column;
        overflow: hidden; /* SHARED LOCK */
    }
    ```

- **Explanation:** This container wraps every realm (Home, Media, Diary, etc.). It forces a fixed viewport and clips any vertical overflow. It was designed for the "Home" realm which typically has fixed hotspot positions.

### C) Media Inner Content Collision

- **File:** `src/realms/MediaRealm.tsx` (Lines 54, 81, 118, 158, 204)
- **Evidence:**

    ```tsx
    <div className="realm-content">
        {activeTab === 'videos' && renderVideos()}
        ...
    </div>
    ```

- **Explanation:** The `MediaRealm` component uses the class name `"realm-content"` for its internal tab area. It accidentally inherits the `overflow: hidden` and `position: absolute` from `Cathedral.css`, which effectively cages the items and prevents them from pushing the `.media-realm` container's scroll height.

---

## 3. Media Shelf & Rendering Analysis

### Why shelves are not horizontal?

- The current `MediaShelf.tsx` uses a `.shelf-row` wrapper.
- **Evidence:** `src/realms/MediaRealm.css` (Lines 83-90)

    ```css
    .shelf-row {
        display: flex;
        gap: 16px;
        overflow-x: auto; /* Horizontal scroll intent */
        padding: 8px 4px 20px;
        scrollbar-width: none;
    }
    ```

- **Failure Point:** If the items inside do not have a fixed width or `flex-shrink: 0`, they may default to wrapping or shrinking.
- **Book Sizing:** In some previous iterations, items were stretched because no `flex: 0 0 160px` was applied. If a book becomes "huge", it’s because it lacks a constrained width in `flex-basis`.

---

## 4. Root Cause Summary

1. **Primary Cause:** **Class Name Collision.** The use of `.realm-content` in `MediaRealm.tsx` causes it to inherit `overflow: hidden` from the global `Cathedral.css` styles, which were designed for the static Home realm. This "leaks" a scroll lock into Media.
2. **Secondary Cause:** **HUD Overlap.** The top HUD (z-index: 6) overlaps the header because there is insufficient top padding in `.media-realm` to clear the badges (🏆/⭐).
3. **Third Contributor:** **Double-Scroll Ambiguity.** Having `overflow-y: auto` on `.media-realm` while the inner contents are absolute-positioned or clipped by the inner `.realm-content` wrapper creates a state where the container has nothing to scroll.

---

## 5. Minimal Fix Plan

### Option 1: CSS Override (Safest)

- **File:** `src/realms/MediaRealm.css`
- **Changes:**
  - Increase `padding-top` on `.media-realm` to `80px`.
  - Add a specific override for `.media-realm .realm-content` to set `position: relative; overflow: visible;`.
  - Ensure `.shelf-row` has `flex-wrap: nowrap;`.

### Option 2: Component Tag Refactor

- **File:** `src/realms/MediaRealm.tsx`
- **Changes:**
  - Rename the inner `<div className="realm-content">` to `<div className="media-tab-display">` to avoid class name collisions with the `Cathedral` shell.
  - Update `MediaRealm.css` to match the new class name.

---

**Git Status Verification:**
All investigation was read-only or search-based. Git status remains clean (aside from previous unrelated implementation).

AG_MILESTONE_TOKEN: M4_MEDIA_UI_DIAG_COMPLETE
