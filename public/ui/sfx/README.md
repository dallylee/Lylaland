# Sound Effects (SFX) Assets

This directory contains sound effect files for Sparkle World.

## Required Files

| File | Trigger | Description |
|------|---------|-------------|
| `star_win.mp3` | `addStars()` | Played when stars are awarded |
| `item_reveal.mp3` | `unlockItem()` | Played when a new item is revealed |
| `ui_tap.mp3` | Navigation tap | Played on bottom nav tab clicks |

## Specifications

- **Format**: MP3 (broadly supported)
- **Duration**: Short (< 1 second preferred for UI sounds)
- **Volume**: Normalized (system handles gain adjustment)

## Notes

- The SoundManager will log a warning if files are missing but will not crash
- First user interaction unlocks audio (mobile autoplay restriction)
- Mute state is persisted in localStorage (`sparkle_world_muted`)

## Placeholder

Currently using placeholder paths. Replace with actual audio files when available.
