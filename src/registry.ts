import React from 'react';

// Lazy-loaded realm components
const HomeRealm = React.lazy(() => import('./realms/HomeRealm'));
const MediaRealm = React.lazy(() => import('./realms/MediaRealm'));
const DiaryRealm = React.lazy(() => import('./realms/DiaryRealm'));
const GamesRealm = React.lazy(() => import('./realms/GamesRealm'));
const CraftsRealm = React.lazy(() => import('./realms/CraftsRealm'));

export interface Realm {
    id: string;
    title: string;
    icon: string;
    component: React.LazyExoticComponent<React.ComponentType<{}>>;
}

/**
 * Central Realm Registry
 * To add a new realm, add an entry here - no other changes needed.
 * Navigation order matches array order.
 */
export const realms: Realm[] = [
    {
        id: 'home',
        title: 'HOME',
        icon: '🏠',
        component: HomeRealm,
    },
    {
        id: 'media',
        title: 'MEDIA',
        icon: '📚',
        component: MediaRealm,
    },
    {
        id: 'diary',
        title: 'DIARY',
        icon: '🔮',
        component: DiaryRealm,
    },
    {
        id: 'games',
        title: 'GAMES',
        icon: '🎮',
        component: GamesRealm,
    },
    {
        id: 'crafts',
        title: 'CRAFTS',
        icon: '🎨',
        component: CraftsRealm,
    },
];

export const DEFAULT_REALM_ID = 'home';

export function getRealmById(id: string): Realm | undefined {
    return realms.find((r) => r.id === id);
}
