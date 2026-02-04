import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('Sparkle World App Shell', () => {
  test('renders Cathedral shell and BottomNav with 5 tabs', async () => {
    render(<App />);

    await waitFor(() => {
      const container = document.querySelector('.sparkle-container');
      expect(container).toBeInTheDocument();
    });

    // Should show all 5 realm tabs
    expect(screen.getByLabelText(/navigate to HOME/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to MEDIA/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to DIARY/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to GAMES/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to CRAFTS/i)).toBeInTheDocument();
  });

  test('HUD badges display at top corners', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.querySelector('.top-hud')).toBeInTheDocument();
    });

    expect(document.querySelector('.items-badge')).toBeInTheDocument();
    expect(document.querySelector('.stars-badge')).toBeInTheDocument();
  });
});

describe('Home Realm Scene + SlotFrame', () => {
  test('Home renders Stage container with SlotFrame', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.querySelector('.home-realm')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Stage container should exist (fixed 390x844 canvas)
    expect(document.querySelector('.stage')).toBeInTheDocument();

    // SlotFrame should exist
    expect(document.querySelector('.trophy-slot-frame')).toBeInTheDocument();

    // Should have slot elements (24 total slots in manifest)
    const slots = document.querySelectorAll('.slot');
    expect(slots.length).toBe(24);
  });

  test('SlotFrame has correct slot IDs', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.querySelector('.trophy-slot-frame')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check for specific slot IDs per requirements
    expect(document.querySelector('[data-slot-id="ts_p1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="ts_p2"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="ts_p3"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="s1_p1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="s2_p1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="bs_p1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="lt_stone_p1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot-id="rt_stone_p1"]')).toBeInTheDocument();
  });
});

describe('Dashboard Layer Order', () => {
  test('Cathedral contains all required layers', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.querySelector('.cathedral')).toBeInTheDocument();
    });

    const cathedral = document.querySelector('.cathedral');
    expect(cathedral?.querySelector('.bg-stars')).toBeInTheDocument();
    expect(cathedral?.querySelector('.arch-window-container')).toBeInTheDocument();
    expect(cathedral?.querySelector('.realm-content')).toBeInTheDocument();
    expect(cathedral?.querySelector('.frame-overlay')).toBeInTheDocument();
    expect(cathedral?.querySelector('.top-hud')).toBeInTheDocument();
    expect(cathedral?.querySelector('.bottom-nav')).toBeInTheDocument();
  });
});
