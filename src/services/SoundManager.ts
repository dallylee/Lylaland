/**
 * Sound Manager - Web Audio API based sound system
 * Handles mobile autoplay restrictions and mute state
 */

export type SoundKey =
    | 'star_win'
    | 'item_reveal'
    | 'ui_tap'
    | 'blue_token'
    | 'red_token'
    | 'owl_open'
    | 'owl_correct'
    | 'owl_wrong'
    | 'owl_timeout';

interface SoundConfig {
    path: string;
    volume: number;
}

const SOUND_CONFIG: Record<SoundKey, SoundConfig> = {
    star_win: { path: '/ui/sfx/star_win.mp3', volume: 0.7 },
    item_reveal: { path: '/ui/sfx/item_reveal.mp3', volume: 0.8 },
    ui_tap: { path: '/ui/sfx/ui_tap.mp3', volume: 0.5 },
    blue_token: { path: '/ui/sfx/blue_token.mp3', volume: 0.6 },
    red_token: { path: '/ui/sfx/red_token.mp3', volume: 0.6 },
    owl_open: { path: '/ui/sfx/owl_open.mp3', volume: 0.7 },
    owl_correct: { path: '/ui/sfx/owl_correct.mp3', volume: 0.7 },
    owl_wrong: { path: '/ui/sfx/owl_wrong.mp3', volume: 0.7 },
    owl_timeout: { path: '/ui/sfx/owl_timeout.mp3', volume: 0.7 },
};

const MUTE_STORAGE_KEY = 'sparkle_world_muted';
const UI_TAP_THROTTLE_MS = 100;

class SoundManager {
    private audioContext: AudioContext | null = null;
    private audioBuffers: Map<SoundKey, AudioBuffer> = new Map();
    private muted: boolean;
    private unlocked: boolean = false;
    private lastUiTapTime: number = 0;
    private loadErrors: Set<SoundKey> = new Set();
    private pendingCues: SoundKey[] = [];

    constructor() {
        // Load mute state from localStorage
        const storedMute = localStorage.getItem(MUTE_STORAGE_KEY);
        this.muted = storedMute === 'true';
    }

    /**
     * Initialize AudioContext (must be called after user gesture)
     */
    async unlockAudio(): Promise<void> {
        if (this.unlocked) return;

        try {
            // Create AudioContext on first user interaction
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Resume if suspended (required for some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.unlocked = true;
            console.log('[SoundManager] Audio unlocked successfully');

            // Preload sounds
            await this.preloadSounds();

            // Flush pending cues
            if (this.pendingCues.length > 0) {
                console.log(`[SoundManager] Flushing ${this.pendingCues.length} pending cues`);
                const toPlay = [...this.pendingCues];
                this.pendingCues = [];
                toPlay.forEach(key => this.play(key));
            }
        } catch (err) {
            console.warn('[SoundManager] Failed to unlock audio:', err);
        }
    }

    /**
     * Preload all sound files
     */
    private async preloadSounds(): Promise<void> {
        if (!this.audioContext) return;

        const loadPromises = Object.entries(SOUND_CONFIG).map(async ([key, config]) => {
            try {
                const response = await fetch(config.path);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(key as SoundKey, audioBuffer);
            } catch (err) {
                // Log once and fail gracefully
                if (!this.loadErrors.has(key as SoundKey)) {
                    console.warn(`[SoundManager] Could not load ${key}: ${config.path}`);
                    this.loadErrors.add(key as SoundKey);
                }
            }
        });

        await Promise.allSettled(loadPromises);
    }

    /**
     * Play a sound by key
     */
    play(key: SoundKey): void {
        // Don't play if muted
        if (this.muted) return;

        // Queue if not yet unlocked
        if (!this.unlocked || !this.audioContext) {
            if (!this.pendingCues.includes(key)) {
                this.pendingCues.push(key);
                // Keep queue small
                if (this.pendingCues.length > 5) this.pendingCues.shift();
            }
            return;
        }

        // Throttle ui_tap to avoid spam
        if (key === 'ui_tap') {
            const now = Date.now();
            if (now - this.lastUiTapTime < UI_TAP_THROTTLE_MS) {
                return;
            }
            this.lastUiTapTime = now;
        }

        const buffer = this.audioBuffers.get(key);
        if (!buffer) {
            // Already logged during preload, fail silently
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = buffer;
            gainNode.gain.value = SOUND_CONFIG[key].volume;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            source.start(0);
        } catch (err) {
            console.warn(`[SoundManager] Error playing ${key}:`, err);
        }
    }

    /**
     * Set mute state
     */
    setMuted(muted: boolean): void {
        this.muted = muted;
        localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    }

    /**
     * Get current mute state
     */
    isMuted(): boolean {
        return this.muted;
    }

    /**
     * Toggle mute state
     */
    toggleMute(): boolean {
        this.setMuted(!this.muted);
        return this.muted;
    }

    /**
     * Check if audio is unlocked
     */
    isUnlocked(): boolean {
        return this.unlocked;
    }
}

// Singleton instance
export const soundManager = new SoundManager();
