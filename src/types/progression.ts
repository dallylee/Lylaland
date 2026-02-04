import { ActiveDiscoverySequence } from './discovery';

export interface TotalsData {
    goldStars: number;
    blueTokens: number;
    redTokens: number;
    lifetimeGoldStars: number;
    goldStarsSinceLastBlue: number;
    goldStarsSinceLastRed: number;
}

export interface RiddleData {
    askedIds: string[];
    timestamps: Record<string, number>;
    solvedCount: number;
}

export interface ClueData {
    usedIds: string[];
    timestamps: Record<string, number>;
}

export interface OwlData {
    lastAttemptTimestamp: number;
    state: 'armed' | 'sleeping';
}

export interface DiscoveryData {
    armedHotspots: string[];
    pendingClueId: string | null;
    triggeredDiscoveries: string[];
    appOpenCount: number;
    lastOpenDate: string;
    activeSequence: ActiveDiscoverySequence | null;
    activeRealmId: string;
    prophecyClueId: string | null;
    prophecyState: 'hidden' | 'available' | 'showing' | 'active';
    prophecyStartTime: number;
    hatchSeen: boolean;
}

export interface DiaryStreakData {
    currentStreak: number;
    lastEntryDate: string;
    longestStreak: number;
}

export interface DailyCountsData {
    date: string;
    dailyCappedStars: number;
}

export interface ProgressionState {
    totals: TotalsData;
    inventory: string[];
    riddles: RiddleData;
    clues: ClueData;
    owl: OwlData;
    discovery: DiscoveryData;
    diaryStreak: DiaryStreakData;
    dailyCounts: DailyCountsData;
}

export const DEFAULT_STATE: ProgressionState = {
    totals: {
        goldStars: 0,
        blueTokens: 0,
        redTokens: 0,
        lifetimeGoldStars: 0,
        goldStarsSinceLastBlue: 0,
        goldStarsSinceLastRed: 0,
    },
    inventory: [],
    riddles: {
        askedIds: [],
        timestamps: {},
        solvedCount: 0,
    },
    clues: {
        usedIds: [],
        timestamps: {},
    },
    owl: {
        lastAttemptTimestamp: 0,
        state: 'armed',
    },
    discovery: {
        armedHotspots: [],
        pendingClueId: null,
        triggeredDiscoveries: [],
        appOpenCount: 0,
        lastOpenDate: '',
        activeSequence: null,
        activeRealmId: 'home',
        prophecyClueId: null,
        prophecyState: 'hidden',
        prophecyStartTime: 0,
        hatchSeen: false,
    },
    diaryStreak: {
        currentStreak: 0,
        lastEntryDate: '',
        longestStreak: 0,
    },
    dailyCounts: {
        date: '',
        dailyCappedStars: 0,
    },
};
