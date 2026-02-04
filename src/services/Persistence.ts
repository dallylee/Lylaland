/**
 * Persistence Service
 * Dexie.js (IndexedDB) wrapper for Sparkle World progression data
 * Includes migration logic from legacy localStorage
 */

import {
    ProgressionState,
    DEFAULT_STATE
} from '../types/progression';
import { db } from './db';

const STORAGE_VERSION = 'v1';
const STORAGE_PREFIX = 'sparkleworld';

// Legacy Storage keys for migration
const LEGACY_KEYS = {
    version: `${STORAGE_PREFIX}.version`,
    totals: `${STORAGE_PREFIX}.totals.${STORAGE_VERSION}`,
    inventory: `${STORAGE_PREFIX}.inventory.${STORAGE_VERSION}`,
    riddles: `${STORAGE_PREFIX}.riddles.${STORAGE_VERSION}`,
    clues: `${STORAGE_PREFIX}.clues.${STORAGE_VERSION}`,
    owl: `${STORAGE_PREFIX}.owl.${STORAGE_VERSION}`,
    discovery: `${STORAGE_PREFIX}.discovery.${STORAGE_VERSION}`,
    diaryStreak: `${STORAGE_PREFIX}.diary.${STORAGE_VERSION}`,
    dailyCounts: `${STORAGE_PREFIX}.daily.${STORAGE_VERSION}`,
} as const;

/**
 * Persistence class - singleton for managing Dexie storage
 */
class PersistenceService {
    private initialized = false;

    /**
     * Initialize persistence, check for migration from localStorage
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        // Check if we need to migrate from localStorage
        const legacyVersion = localStorage.getItem(LEGACY_KEYS.version);
        if (legacyVersion) {
            await this.migrateFromLocalStorage();
        }

        this.initialized = true;
    }

    /**
     * Migrate data from legacy localStorage to Dexie
     */
    private async migrateFromLocalStorage(): Promise<void> {
        console.log('[Persistence] Migrating legacy localStorage data to Dexie...');

        try {
            const state: ProgressionState = { ...DEFAULT_STATE };

            // Helper to get from localStorage
            const getLegacy = <T>(key: string, def: T): T => {
                const val = localStorage.getItem(key);
                if (!val) return def;
                try { return JSON.parse(val); } catch { return def; }
            };

            state.totals = getLegacy(LEGACY_KEYS.totals, DEFAULT_STATE.totals);
            state.inventory = getLegacy(LEGACY_KEYS.inventory, DEFAULT_STATE.inventory);
            state.riddles = getLegacy(LEGACY_KEYS.riddles, DEFAULT_STATE.riddles);
            state.clues = getLegacy(LEGACY_KEYS.clues, DEFAULT_STATE.clues);
            state.owl = getLegacy(LEGACY_KEYS.owl, DEFAULT_STATE.owl);
            state.discovery = getLegacy(LEGACY_KEYS.discovery, DEFAULT_STATE.discovery);
            state.diaryStreak = getLegacy(LEGACY_KEYS.diaryStreak, DEFAULT_STATE.diaryStreak);
            state.dailyCounts = getLegacy(LEGACY_KEYS.dailyCounts, DEFAULT_STATE.dailyCounts);

            // Save to Dexie
            await db.progression.put({ key: 'main', data: state });

            // Clear legacy keys (or just version to stop repeat migration)
            localStorage.removeItem(LEGACY_KEYS.version);
            console.log('[Persistence] Migration complete.');
        } catch (e) {
            console.error('[Persistence] Migration failed:', e);
        }
    }

    /**
     * Get full progression state (Async)
     */
    async getState(): Promise<ProgressionState> {
        await this.init();
        const stored = await db.progression.get('main');
        return stored ? stored.data : DEFAULT_STATE;
    }

    /**
     * Save full progression state (Async)
     */
    async saveState(state: ProgressionState): Promise<void> {
        await this.init();
        await db.progression.put({ key: 'main', data: state });
    }

    /**
     * Clear all stored data
     */
    async clear(): Promise<void> {
        await db.progression.clear();
        await db.diary.clear();
        await db.riddles.clear();
        await db.clues.clear();
        this.initialized = false;
    }
}

// Export singleton instance
export const persistence = new PersistenceService();
