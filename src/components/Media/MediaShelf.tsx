import React from 'react';

interface MediaShelfProps {
    title: string;
    children: React.ReactNode;
}

const MediaShelf: React.FC<MediaShelfProps> = ({ title, children }) => {
    return (
        <div className="media-shelf">
            <h2 className="shelf-title">{title}</h2>
            <div className="shelf-row">
                {children}
            </div>
        </div>
    );
};

export default MediaShelf;
