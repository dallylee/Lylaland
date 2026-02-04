import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MediaRealm from './MediaRealm';
import { MediaLibraryService } from '../services/MediaLibraryService';

// Mock MediaLibraryService
jest.mock('../services/MediaLibraryService', () => ({
    MediaLibraryService: {
        getLibraryItems: jest.fn().mockResolvedValue([]),
        toggleLibraryItem: jest.fn().mockResolvedValue(true),
        isInLibrary: jest.fn().mockResolvedValue(false)
    }
}));

describe('MediaRealm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders 4 menu buttons', async () => {
        render(<MediaRealm />);
        const buttons = screen.getAllByRole('button');
        const buttonTexts = buttons.map(b => b.textContent);

        expect(buttonTexts.some(t => t?.includes('Videos'))).toBe(true);
        expect(buttonTexts.some(t => t?.includes('Classic Books'))).toBe(true);
        expect(buttonTexts.some(t => t?.includes('New & Trending'))).toBe(true);
        expect(buttonTexts.some(t => t?.includes('My Library'))).toBe(true);
    });

    test('switches tabs and renders shelves', async () => {
        render(<MediaRealm />);

        // Switch to Classic Books
        const classicBtn = screen.getByText(/Classic Books/i);
        fireEvent.click(classicBtn);

        expect(screen.getByText(/Timeless Tales/i)).toBeInTheDocument();

        // Card is present - Goody Two-Shoes title
        expect(screen.getAllByText(/Goody Two-Shoes/i).length).toBeGreaterThan(0);
    });

    test('toggles book card front/back', async () => {
        render(<MediaRealm />);
        const classicBtn = screen.getByText(/Classic Books/i);
        fireEvent.click(classicBtn);

        const cardTitle = screen.getAllByText(/Goody Two-Shoes/i)[0];
        const card = cardTitle.closest('.book-card-container');
        expect(card).not.toHaveClass('flipped');

        fireEvent.click(card!);
        expect(card).toHaveClass('flipped');

        // Back content should be visible (the Read button)
        expect(screen.getAllByText(/Read/i).length).toBeGreaterThan(0);
    });

    test('clicking heart toggles state', async () => {
        (MediaLibraryService.getLibraryItems as jest.Mock).mockResolvedValueOnce([]);
        render(<MediaRealm />);

        // Find heart on first video card
        // Heart buttons have aria-label "Add to Library" initially
        const hearts = screen.getAllByLabelText(/Add to Library/i);
        fireEvent.click(hearts[0]);

        expect(MediaLibraryService.toggleLibraryItem).toHaveBeenCalled();
    });

    test('shows empty state for library when empty', async () => {
        (MediaLibraryService.getLibraryItems as jest.Mock).mockResolvedValue([]);
        render(<MediaRealm />);

        const libraryBtn = screen.getByText(/My Library/i);
        fireEvent.click(libraryBtn);

        await waitFor(() => {
            expect(screen.getByText(/Your library is empty/i)).toBeInTheDocument();
        });
    });
});
