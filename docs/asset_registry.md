# Home Page Asset & Sound Registry

## 🖼️ Graphic Asset Scheme

### 1. Naming Convention

Assets should follow a consistent snake_case format:

- **UI Elements**: `header_bg.png`, `nav_pill.png`, `glow_star.webp`.
- **Overlays**:
  - `frame_overlay_back.png`: Lower depth decorative layer (behind items).
  - `frame_overlay_front.png`: Higher depth decorative layer (occlusion/foreground).
  - `frame_arch_overlay.png`: All-in-one fallback arch decoration.
- **Trophy Items**:
  - `slot_[id].png` (e.g., `slot_s1_p1.png` for Shelf 1, Position 1).
  - Special placeholders: `item_owl.png`, `item_egg.png`.

### 2. File Locations

All production assets live in the `public/` directory for direct serving:

- **Main UI images**: `public/ui/`
- **Icon library**: `public/ui/icons/`
- **Trophy/Discovery items**: `public/ui/treasures/` (recommended) or `public/ui/`
- **Cinematics**: `public/ui/cinematics/`

### 3. Technical Specifications

- **Accepted Formats**:
  - **Images**: `.webp` (primary for performance), `.png` (for complex transparency), `.jpg` (only for non-transparent backgrounds).
  - **Animation**: Lottie (JSON) or CSS sprites.
- **Logical Grid**: Fixed **390 × 844** coordinate system.
- **Scaling**: Components use a "Stage" transform to scale the 390x844 canvas to cover the viewport.
- **Item Sizes**: Standard trophy items should target a logical size of ~**50x60px**.

---

## 🎯 Grid & Shelf Targeting

### 1. Targeting System

The Home realm uses a **bottom-anchor** system for placement:

- `anchorX`: The horizontal center of the item.
- `anchorY`: The vertical base (where the item "sits").

### 2. Shelf Alignment (Y-Coordinates)

Items should sit on "Shelf Lips" defined in `src/slots/trophySlots.ts`:

| Shelf ID | Logic Y (anchorY) | Description |
|----------|-------------------|-------------|
| `TOP`    | 378 | Top decorative ledge |
| `SHELF3` | 470 | Highest main shelf |
| `SHELF2` | 564 | Middle main shelf |
| `SHELF1` | 653 | Lowest main shelf |
| `BOTTOM` | 735 | Cabinet floor |

### 3. How to Update

1. **Calibration Mode**: In development, click "Calibrate" to drag slots.
2. **Export**: Click "Export JSON" to copy the new positions to the clipboard.
3. **Commit**: Update `src/slots/trophySlots.ts` with the exported `TROPHY_SLOTS` array.

---

## 🔊 Sound Registry

### 1. Configuration

Implemented in `src/services/SoundManager.ts`.

### 2. Registry & Predicted Actions

| Sound Key | Trigger Action | File Path (MP3) |
|-----------|----------------|-----------------|
| `ui_tap` | Any navigation or button interaction | `/ui/sfx/ui_tap.mp3` |
| `item_reveal` | New trophy/item appears for the first time | `/ui/sfx/item_reveal.mp3` |
| `star_win` | Earning a Gold Star (progression) | `/ui/sfx/star_win.mp3` |
| `blue_token` | Discovery step completion (blue spark) | `/ui/sfx/blue_token.mp3` |
| `red_token` | Error or failed interaction | `/ui/sfx/red_token.mp3` |
| `owl_correct` | Correct sequence in Owl minigame | `/ui/sfx/owl_correct.mp3` |
| `owl_wrong` | Fail/Error in Owl minigame | `/ui/sfx/owl_wrong.mp3` |

### 3. Implementation Rules

- **Format**: All sounds MUST be `.mp3`.
- **Location**: `public/ui/sfx/`.
- **Playback**: Use the `soundManager.play(key)` method.
- **Autoplay**: Sounds are throttled and requires a user gesture (`unlockAudio()`) before the first play.
