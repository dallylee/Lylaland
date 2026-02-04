import React from 'react';

interface VideoModalProps {
    title: string;
    videoId: string;
    onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ title, videoId, onClose }) => {
    return (
        <div className="video-modal-overlay" onClick={onClose}>
            <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>×</button>
                <div className="video-embed-wrapper">
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>
                <div className="video-modal-info">
                    <h2 className="video-modal-title">{title}</h2>
                    <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="open-youtube-link"
                    >
                        Open on YouTube ↗
                    </a>
                </div>
            </div>
        </div>
    );
};

export default VideoModal;
