import React from 'react';
import { realms } from '../../registry';
import { useMagic } from '../../context/MagicContext';
import './BottomNav.css';

/**
 * Navigation bar rendered from realm registry
 * Provides tab switching between all 5 realms
 */
export function BottomNav() {
    const { activeRealmId, setActiveRealmId } = useMagic();

    const handleTabClick = (realmId: string) => {
        setActiveRealmId(realmId);
    };

    return (
        <nav className="bottom-nav glass">
            <div className="nav-tabs">
                {realms.map((realm) => (
                    <button
                        key={realm.id}
                        className={`nav-tab ${activeRealmId === realm.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(realm.id)}
                        aria-label={`Navigate to ${realm.title}`}
                        aria-current={activeRealmId === realm.id ? 'page' : undefined}
                    >
                        <span className="nav-icon">{realm.icon}</span>
                        <span className="nav-label">{realm.title}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
