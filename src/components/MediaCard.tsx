import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { ProgressionEngine } from '../engine/ProgressionEngine';
import { getArchiveEmbedUrl } from '../services/archiveSearch';

import '../realms/MediaRealm.css';

interface MediaCardProps {
    id: string; // ia:<id> or yt:<id>
    title: string;
    type: 'book' | 'video';
    coverImage?: string;
    category?: string;
    about?: string;
    identifier?: string; // For books
    videoId?: string; // For YouTube
    isCompletedInitial?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
    id,
    title,
    type,
    coverImage,
    category,
    about,
    identifier,
    videoId,
    isCompletedInitial = false
}) => {
    const [isCompleted, setIsCompleted] = useState(isCompletedInitial);
    const [showEmbed, setShowEmbed] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);

        // Check local DB for completion status if not provided
        if (!isCompletedInitial) {
            db.mediaCompletions.get(id).then(status => {
                if (status) setIsCompleted(true);
            });
        }

        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, [id, isCompletedInitial]);

    const handleMarkCompleted = async () => {
        if (isCompleted) return;

        try {
            // Persist completion
            await db.mediaCompletions.put({
                mediaId: id,
                completedAt: Date.now()
            });

            // Route reward through ProgressionEngine
            ProgressionEngine.processEvent({
                type: 'media_done',
                payload: { clueId: id } // Using clueId as generic ID for payload
            });

            setIsCompleted(true);
        } catch (err) {
            console.error('[MediaCard] Failed to save completion:', err);
        }
    };

    const toggleEmbed = () => {
        if (!isOnline && !showEmbed) return;
        setShowEmbed(!showEmbed);
    };

    const getEmbedUrl = () => {
        if (type === 'video' && videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}`;
        }
        if (type === 'book' && identifier) {
            return getArchiveEmbedUrl(identifier);
        }
        return '';
    };

    const embedUrl = getEmbedUrl();

    return (
        <div className={`media-card ${isCompleted ? 'completed' : ''}`}>
            {category && <span className="category-tag">{category}</span>}

            <div className="card-top" onClick={toggleEmbed}>
                {showEmbed && isOnline ? (
                    <div className="embed-container">
                        <iframe
                            src={embedUrl}
                            title={title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                        <button className="close-embed" onClick={(e) => { e.stopPropagation(); setShowEmbed(false); }}>
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="cover-container">
                        {coverImage ? (
                            <img src={coverImage} alt={title} className="cover-image" />
                        ) : (
                            <div className="cover-placeholder">
                                {type === 'book' ? '📖' : '🎬'}
                            </div>
                        )}
                        <div className="play-overlay">
                            <span className="play-icon">{isOnline ? '✨ View ✨' : '📴 Offline'}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="card-info">
                <h3 className="media-title">{title}</h3>
                {about && <p className="media-description">{about}</p>}

                <div className="card-actions">
                    {!isOnline && (
                        <span className="offline-notice">Offline - preview only</span>
                    )}
                    {type === 'video' && videoId && (
                        <a
                            href={`https://www.youtube.com/watch?v=${videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                        >
                            Open on YouTube ↗
                        </a>
                    )}
                    <button
                        className={`complete-btn ${isCompleted ? 'done' : ''}`}
                        onClick={handleMarkCompleted}
                        disabled={isCompleted}
                    >
                        {isCompleted ? '✅ Finished' : (type === 'book' ? 'Mark as Read' : 'Mark as Watched')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MediaCard;
