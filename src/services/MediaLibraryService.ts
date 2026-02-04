import { db, MediaLibraryItem } from './db';

export const MediaLibraryService = {
    async addToLibrary(item: Omit<MediaLibraryItem, 'savedAt'>): Promise<void> {
        await db.mediaLibrary.put({
            ...item,
            savedAt: Date.now()
        });
    },

    async removeFromLibrary(id: string): Promise<void> {
        await db.mediaLibrary.delete(id);
    },

    async isInLibrary(id: string): Promise<boolean> {
        const item = await db.mediaLibrary.get(id);
        return !!item;
    },

    async getLibraryItems(): Promise<MediaLibraryItem[]> {
        return await db.mediaLibrary.orderBy('savedAt').reverse().toArray();
    },

    async toggleLibraryItem(item: Omit<MediaLibraryItem, 'savedAt'>): Promise<boolean> {
        const exists = await this.isInLibrary(item.id);
        if (exists) {
            await this.removeFromLibrary(item.id);
            return false;
        } else {
            await this.addToLibrary(item);
            return true;
        }
    }
};
