import Dexie, { Table } from 'dexie';
import { ProgressionState } from '../types/progression';

export type MediaLibraryItemType = "video" | "classic_book" | "trending_book";

export type MediaLibraryItem = {
  id: string;         // stable unique id
  type: MediaLibraryItemType;
  title: string;
  imageUrl?: string;
  linkUrl: string;    // YouTube/Archive/Amazon URL
  savedAt: number;    // Date.now()
};


export interface DiaryEntry {
    id?: number;
    date: string;
    iv: string;
    ciphertext: string;
    createdAt: number;
}

export interface StoredRiddle {
    id: string;
    askedAt: number;
    solved: boolean;
}

export interface StoredClue {
    id: string;
    discoveredAt: number;
}

export interface MediaCompletion {
    mediaId: string;
    completedAt: number;
}

export interface MediaSearchCache {
    query: string;
    results: any[];
    timestamp: number;
}

export class SparkleDatabase extends Dexie {
    // Tables
    progression!: Table<{ key: string; data: ProgressionState }, string>;
    diary!: Table<DiaryEntry, number>;
    riddles!: Table<StoredRiddle, string>;
    clues!: Table<StoredClue, string>;
    mediaCompletions!: Table<MediaCompletion, string>;
    mediaSearchCache!: Table<MediaSearchCache, string>;

    mediaLibrary!: Table<MediaLibraryItem, string>;
    constructor() {
        super('SparkleWorldDB');

        // Define schema
        this.version(1).stores({
            progression: 'key',
            diary: '++id, date',
            riddles: 'id',
            clues: 'id'
        });

        this.version(2).stores({
            mediaCompletions: 'mediaId',
            mediaSearchCache: 'query'
        });
    
        this.version(3).stores({
            mediaLibrary: 'id, type, savedAt'
        });
}
}

export const db = new SparkleDatabase();
