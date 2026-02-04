import React from 'react';

interface HeartButtonProps {
    isFull: boolean;
    onClick: (e: React.MouseEvent) => void;
}

const HeartButton: React.FC<HeartButtonProps> = ({ isFull, onClick }) => {
    return (
        <button
            className={`heart-button ${isFull ? 'active' : ''}`}
            onClick={onClick}
            aria-label={isFull ? "Remove from Library" : "Add to Library"}
        >
            {isFull ? '💖' : '🤍'}
        </button>
    );
};

export default HeartButton;
