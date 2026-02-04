import React from 'react';

interface MediaCardBaseProps {
    children: React.ReactNode;
    className?: string;
}

const MediaCardBase: React.FC<MediaCardBaseProps> = ({ children, className }) => {
    return (
        <div className={`media-card-base ${className || ''}`}>
            {children}
        </div>
    );
};

export default MediaCardBase;
