import React, { useState } from 'react';
import HeartButton from './HeartButton';

interface BookFlipCardProps {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    actionLabel: string;
    onAction: () => void;
    isSaved: boolean;
    onToggleSave: () => void;
}

const BookFlipCard: React.FC<BookFlipCardProps> = ({
    title,
    description,
    imageUrl,
    actionLabel,
    onAction,
    isSaved,
    onToggleSave
}) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => setIsFlipped(!isFlipped);

    return (
        <div className={`book-card-container ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="book-card-inner">
                {/* Front Side */}
                <div className="book-card-front">
                    <div className="book-cover-container">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="book-cover" />
                        ) : (
                            <div className="book-cover-placeholder">📖</div>
                        )}
                        <HeartButton
                            isFull={isSaved}
                            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                        />
                    </div>
                    <div className="book-card-info">
                        <h3 className="book-title">{title}</h3>
                    </div>
                </div>

                {/* Back Side */}
                <div className="book-card-back">
                    <div className="book-back-content">
                        <h3 className="book-title-back">{title}</h3>
                        <p className="book-description">{description}</p>
                        <div className="book-actions">
                            <button
                                className="book-action-btn"
                                onClick={(e) => { e.stopPropagation(); onAction(); }}
                            >
                                {actionLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookFlipCard;
