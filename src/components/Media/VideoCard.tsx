import React from 'react';
import HeartButton from './HeartButton';

interface VideoCardProps {
    id: string;
    title: string;
    videoId: string;
    thumbnailUrl?: string;
    onPlay: () => void;
    isSaved: boolean;
    onToggleSave: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
    title,
    videoId,
    thumbnailUrl,
    onPlay,
    isSaved,
    onToggleSave
}) => {
    const thumb = thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    return (
        <div className="video-card" onClick={onPlay}>
            <div className="video-thumbnail-container">
                <img src={thumb} alt={title} className="video-thumbnail" />
                <div className="video-play-hint">
                    <span className="play-icon-large">▶</span>
                </div>
                <HeartButton
                    isFull={isSaved}
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                />
            </div>
            <div className="video-info">
                <h3 className="video-title">{title}</h3>
            </div>
        </div>
    );
};

export default VideoCard;
