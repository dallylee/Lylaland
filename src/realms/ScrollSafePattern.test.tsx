import React from 'react';
import { render } from '@testing-library/react';
import MediaRealm from './MediaRealm';
import DiaryRealm from './DiaryRealm';
import GamesRealm from './GamesRealm';
import CraftsRealm from './CraftsRealm';

// Mock dependencies to avoid complex setup
jest.mock('../services/MediaLibraryService', () => ({
    MediaLibraryService: {
        getLibraryItems: jest.fn().mockResolvedValue([]),
        isInLibrary: jest.fn().mockResolvedValue(false)
    }
}));

describe('Scroll-Safe Realm Containers', () => {
    const realms = [
        { name: 'Media', Component: MediaRealm },
        { name: 'Diary', Component: DiaryRealm },
        { name: 'Games', Component: GamesRealm },
        { name: 'Crafts', Component: CraftsRealm }
    ];

    realms.forEach(({ name, Component }) => {
        test(`${name} realm renders with the scroll-safe container class`, () => {
            const { container } = render(<Component />);
            const wrapper = container.firstElementChild;
            expect(wrapper).toHaveClass('realm-scroll-area');
        });

        test(`${name} realm does not use the colliding "realm-content" class for internal layout`, () => {
            const { container } = render(<Component />);
            const collisions = container.querySelectorAll('.realm-content');

            // Should be 0 collisions. The Cathedral shell provides the outer .realm-content,
            // but the realms themselves should NOT use it for internal tab wrappers.
            expect(collisions.length).toBe(0);
        });
    });
});
