import React from 'react';

export type MediaTab = 'videos' | 'classic' | 'trending' | 'library';

interface MediaMenuTabsProps {
    activeTab: MediaTab;
    onTabChange: (tab: MediaTab) => void;
}

const MediaMenuTabs: React.FC<MediaMenuTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="realm-tabs media-menu-tabs">
            <button
                className={activeTab === 'videos' ? 'active' : ''}
                onClick={() => onTabChange('videos')}
            >
                🎬 Videos
            </button>
            <button
                className={activeTab === 'classic' ? 'active' : ''}
                onClick={() => onTabChange('classic')}
            >
                📚 Classic Books
            </button>
            <button
                className={activeTab === 'trending' ? 'active' : ''}
                onClick={() => onTabChange('trending')}
            >
                ✨ New & Trending
            </button>
            <button
                className={activeTab === 'library' ? 'active' : ''}
                onClick={() => onTabChange('library')}
            >
                💖 My Library
            </button>
        </nav>
    );
};

export default MediaMenuTabs;
