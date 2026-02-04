import React, { useEffect, useRef } from 'react';
import { MagicProvider } from './context/MagicContext';
import { Cathedral } from './components/Cathedral';
import { soundManager } from './services/SoundManager';
import './debug-types.d.ts';
import './index.css';

// Initialize global debug flags
if (typeof window !== 'undefined') {
  window.__DEBUG_SLOTS__ = window.__DEBUG_SLOTS__ ?? (process.env.NODE_ENV === 'development');
  window.__FORCE_ITEMS__ = window.__FORCE_ITEMS__ ?? false;
}

/**
 * Sparkle World App
 * A magical digital grimoire for young adventurers
 */
function App() {
  const hasUnlocked = useRef(false);

  useEffect(() => {
    // Unlock audio on first user interaction (mobile autoplay restriction)
    const unlockAudio = () => {
      if (!hasUnlocked.current) {
        hasUnlocked.current = true;
        soundManager.unlockAudio();
        // Remove listeners after first unlock
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      }
    };

    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('touchstart', unlockAudio, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return (
    <MagicProvider>
      <div className="sparkle-container">
        <Cathedral />
      </div>
    </MagicProvider>
  );
}

export default App;
