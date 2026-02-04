import React from 'react';
import './BgStars.css';

/**
 * Animated starfield background layer
 * Creates twinkling stars using CSS animations
 */
export function BgStars() {
    // Generate random star positions
    const stars = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 2}s`,
    }));

    return (
        <div className="bg-stars">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: star.left,
                        top: star.top,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDelay: star.delay,
                        animationDuration: star.duration,
                    }}
                />
            ))}
            {/* Gradient glow overlay */}
            <div className="star-glow" />
        </div>
    );
}

export default BgStars;
