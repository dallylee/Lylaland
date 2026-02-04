# Sparkle World Specification

This repository is initialised with documentation derived from the supplied specification file:

- `Sparkle World Specification.md`

For convenience, the current copy of that specification is included below verbatim.

---

# **Technical Specification: Sparkle World**

## **1\. Vision & Constraints**

* **Target Audience:** 12-year-old girls.  
* **Atmosphere:** Whimsical, magical, private, "digital grimoire."  
* **Privacy First:** 100% local-first. No backend, no accounts, no tracking.  
* **Zero Cost:** No paid APIs. Use browser-native features and free public APIs (Archive.org, YouTube Embeds).  
* **Responsive:** Mobile-first design, centered and aspect-ratio constrained on desktop.

## **2\. Technical Stack**

* **Framework:** React \+ TypeScript (CRA/CRACO as per handover).  
* **Styling:** Tailwind CSS (for glassmorphism and layouts).  
* **Local Database:** Dexie.js (IndexedDB wrapper) for all persistent data.  
* **Encryption:** Web Crypto API (AES-GCM) for the Diary.  
* **Voice:** Web Speech API (SpeechRecognition) for diary input.

## **3\. Core Architecture: The Modular "Realm" System**

The app must follow a **Plugin Architecture**. The "Skeleton" (The Cathedral) should not have hard dependencies on feature modules.

### **A. The Registry (src/registry.ts)**

A central manifest defining all modules. To add a game or feature, the dev only edits this file.

export const realms \= \[  
  { id: 'home', title: 'Home', icon: 'home\_icon.png', component: HomeRealm },  
  { id: 'media', title: 'Media', icon: 'media\_icon.png', component: MediaRealm },  
  { id: 'diary', title: 'Diary', icon: 'diary\_icon.png', component: DiaryRealm },  
  // Adding a new game is just adding an object here  
\];

### **B. The Magic Bridge (State Management)**

Use a React Context (e.g., MagicContext) to provide a "Bridge" to all modules:

* stars: Total collected.  
* inventory: Array of magical item IDs.  
* addStars(count): Function to reward player.  
* unlockItem(id): Function to add item to shelf.

## **4\. Feature Specifications**

### **🏠 Home Realm (The Trophy Room)**

* **Visuals:** Uses ArchWindow.tsx and Shelf.tsx from the handover.  
* **Trophies:** Trophies (Potions, Eggs, Feathers) appear on the shelves when inventory changes.  
* **The Owl:** A sprite on the top shelf.  
  * *Prophecy Engine:* Every 24h, it offers a random "Enigmatic Prophecy" from a local JSON list.  
  * *Easter Eggs:* It monitors hotspot taps. Sequence logic (e.g., \[Shelf1-Left, Shelf1-Left, Shelf3-Right\]) unlocks hidden items.  
* **The Dragon Egg:** A permanent item on the bottom shelf. When inventory.length \=== MAX, trigger the HatchSequence animation.

### **📚 Media Realm (Books & Videos)**

* **Library:** \- Books/Audiobooks: Fetch via https://archive.org/advancedsearch.php (JSON).  
  * Videos: Embed YouTube URLs in an \<iframe\>.  
* **Card UI:** Cards that flip/pop out on click to show descriptions.  
* **Rewards:** A "Mark as Watched/Read" button calls addStars(10).

### **🔒 Diary Realm (The Emoji Vault)**

* **Encryption:** Use the user's Emoji sequence to derive a key via PBKDF2.  
* **No Recovery:** Clear warning: "If you lose your emoji key, your secrets stay locked forever."  
* **Entries:** Scrollable list showing snippets. Full entry is decrypted only when "unlocked."  
* **Input:** Traditional text area \+ "Magic Mic" button using window.SpeechRecognition.

### **🎮 Games & 🎨 Crafts**

* **Games:** Mini-games (Quizzes, Memory match) built as standalone components.  
* **Crafts:** Step-by-step guides for real-world DIY.  
* **Engagement:** High scores and completion logs are saved to Dexie.js.

## **5\. UI Integration Details (From Figma Handover)**

* **Asset Pipeline:** All images in public/ui/.  
* **Layering (Z-Index):**  
  1. bg\_stars (Lowest)  
  2. ArchWindow (Masked sky/moon)  
  3. Shelf (Wood layers)  
  4. ActiveRealmComponent (The specific feature UI)  
  5. frame\_arch\_overlay (Architecture/Vines)  
  6. BottomNav (Top layer navigation)  
  7. Hotspots (Invisible interactive zones)

## **6\. Daily Riddle System**

* **Persistence:** Save lastRiddleTimestamp in Dexie.  
* **Logic:** If (now \- lastTimestamp) \> 24h, show "Riddle of the Day" modal.  
* **Limit:** Only one attempt allowed. Success \= addStars(20).

## **7\. Build Guidelines**

1. **Dynamic Imports:** Use React.lazy for module components to keep the initial load "Magical" and fast.  
2. **Offline Support:** Implement a Service Worker (PWA) so she can play in her room without Wi-Fi.  
3. **Sound FX:** Add soft "sparkle" sounds for star gains and "page turns" for books.
