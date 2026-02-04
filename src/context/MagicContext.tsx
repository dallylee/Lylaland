import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { soundManager } from '../services/SoundManager';
import { ProgressionEngine, ProgressionEventType, ProgressionResult } from '../engine/ProgressionEngine';
import { DEFAULT_STATE } from '../types/progression';

interface MagicContextType {
    // State
    stars: number;
    blueTokens: number;
    redTokens: number;
    inventory: string[];

    // Actions (all go through ProgressionEngine)
    processEvent: (type: ProgressionEventType, payload?: Record<string, string>) => ProgressionResult;
    addStars: (count: number) => void;
    unlockItem: (id: string) => void;

    // Navigation
    activeRealmId: string;
    setActiveRealmId: (id: string) => void;

    // Sound controls
    isMuted: boolean;
    toggleMute: () => void;

    // Clue/Discovery state
    pendingClueId: string | null;
    isHotspotArmed: (hotspotId: string) => boolean;
    isOwlArmed: boolean;
    isMirrorProphecyAvailable: boolean;

    // Egg hatch state
    showEggHatch: boolean;
    setShowEggHatch: (show: boolean) => void;

    // Loading state
    isLoading: boolean;
}

const MagicContext = createContext<MagicContextType | null>(null);

interface MagicProviderProps {
    children: ReactNode;
}

/**
 * Magic Bridge - Central state provider for Sparkle World
 * Now integrated with ProgressionEngine for persistent state and game logic.
 */
export function MagicProvider({ children }: MagicProviderProps) {
    // Initialize from engine (guaranteed non-nullable by engine fix)
    const initialState = ProgressionEngine.getState() || DEFAULT_STATE;

    const [stars, setStars] = useState<number>(initialState.totals?.goldStars || 0);
    const [blueTokens, setBlueTokens] = useState<number>(initialState.totals?.blueTokens || 0);
    const [redTokens, setRedTokens] = useState<number>(initialState.totals?.redTokens || 0);
    const [inventory, setInventory] = useState<string[]>(initialState.inventory || []);
    const [activeRealmId, setActiveRealmId] = useState<string>('home');
    const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());
    const [pendingClueId, setPendingClueId] = useState<string | null>(initialState.discovery?.pendingClueId || null);
    const [isOwlArmed, setIsOwlArmed] = useState<boolean>(ProgressionEngine.isOwlArmed());
    const [isMirrorProphecyAvailable, setIsMirrorProphecyAvailable] = useState<boolean>(ProgressionEngine.isMirrorProphecyAvailable());
    const [showEggHatch, setShowEggHatch] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Initialize Progression Engine
    useEffect(() => {
        const initEngine = async () => {
            try {
                await ProgressionEngine.init();
                const state = ProgressionEngine.getState();

                setStars(state.totals.goldStars);
                setBlueTokens(state.totals.blueTokens);
                setRedTokens(state.totals.redTokens);
                setInventory([...state.inventory]);
                setPendingClueId(state.discovery.pendingClueId);
                setIsOwlArmed(ProgressionEngine.isOwlArmed());
                setIsMirrorProphecyAvailable(ProgressionEngine.isMirrorProphecyAvailable());

                // Trigger initial events after load
                const initialResult = ProgressionEngine.processEvent({ type: 'app_opened' });
                if (initialResult.eggHatchTriggered) {
                    setShowEggHatch(true);
                }

                ProgressionEngine.processEvent({
                    type: 'realm_changed',
                    payload: { realmId: activeRealmId }
                });
            } catch (err) {
                console.error('[MagicContext] Error during engine initialization:', err);
                // Fallback to defaults already set in useState
            } finally {
                setIsLoading(false);
            }
        };

        initEngine();
    }, [activeRealmId]);

    const handleSetActiveRealmId = useCallback((id: string) => {
        setActiveRealmId(id);
        ProgressionEngine.processEvent({
            type: 'realm_changed',
            payload: { realmId: id }
        });
    }, []);

    // Subscribe to ProgressionEngine updates
    useEffect(() => {
        if (isLoading) return;

        const unsubscribe = ProgressionEngine.subscribe((result: ProgressionResult) => {
            // Update local state from engine result
            setStars(result.newState.totals.goldStars);
            setBlueTokens(result.newState.totals.blueTokens);
            setRedTokens(result.newState.totals.redTokens);
            setInventory([...result.newState.inventory]);
            setPendingClueId(result.newState.discovery.pendingClueId);
            setIsOwlArmed(ProgressionEngine.isOwlArmed());
            setIsMirrorProphecyAvailable(ProgressionEngine.isMirrorProphecyAvailable());

            // Play sound cues from engine
            if (result.soundCues && result.soundCues.length > 0) {
                result.soundCues.forEach(cue => soundManager.play(cue));
            }

            // Trigger egg hatch if needed
            if (result.eggHatchTriggered && !showEggHatch) {
                setShowEggHatch(true);
            }
        });

        return unsubscribe;
    }, [showEggHatch, isLoading]);

    // Check owl armed state periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setIsOwlArmed(ProgressionEngine.isOwlArmed());
            setIsMirrorProphecyAvailable(ProgressionEngine.isMirrorProphecyAvailable());
        }, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    // Process any progression event through the engine
    const processEvent = useCallback((type: ProgressionEventType, payload?: Record<string, string>): ProgressionResult => {
        return ProgressionEngine.processEvent({ type, payload });
    }, []);

    // Legacy addStars - now routes through engine for debug/testing
    const addStars = useCallback((count: number) => {
        ProgressionEngine.debugAddStars(count);
    }, []);

    const unlockItem = useCallback((id: string) => {
        ProgressionEngine.debugUnlockItem(id);
        const state = ProgressionEngine.getState();
        setInventory([...state.inventory]);
    }, []);

    const toggleMute = useCallback(() => {
        const newMuted = soundManager.toggleMute();
        setIsMuted(newMuted);
    }, []);

    const isHotspotArmed = useCallback((hotspotId: string): boolean => {
        return ProgressionEngine.isHotspotArmed(hotspotId);
    }, []);

    const value: MagicContextType = {
        stars,
        blueTokens,
        redTokens,
        inventory,
        processEvent,
        addStars,
        unlockItem,
        activeRealmId,
        setActiveRealmId: handleSetActiveRealmId,
        isMuted,
        toggleMute,
        pendingClueId,
        isHotspotArmed,
        isOwlArmed,
        isMirrorProphecyAvailable,
        showEggHatch,
        setShowEggHatch,
        isLoading,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-sparkle-gold">
                <div className="animate-pulse text-2xl font-medieval">Gathering Magic...</div>
            </div>
        );
    }

    return (
        <MagicContext.Provider value={value}>
            {children}
        </MagicContext.Provider>
    );
}

/**
 * Hook to access Magic Bridge state and actions
 */
export function useMagic(): MagicContextType {
    const context = useContext(MagicContext);
    if (!context) {
        throw new Error('useMagic must be used within a MagicProvider');
    }
    return context;
}
