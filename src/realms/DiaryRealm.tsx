import React from 'react';
import './RealmStyles.css';

/**
 * Diary Realm - Emoji Vault
 * Placeholder for M5 implementation
 */
function DiaryRealm() {
    return (
        <div className="realm diary-realm">
            <div className="realm-header">
                <h1 className="realm-title gradient-text">🔮 Diary</h1>
                <p className="realm-subtitle">Your Secret Vault</p>
            </div>

            <div className="realm-card glass">
                <div className="card-content">
                    <p>A magical encrypted diary just for you!</p>
                    <ul className="feature-list">
                        <li>🔐 Protected by your emoji key</li>
                        <li>✍️ Write your secrets safely</li>
                        <li>🎤 Voice input with Magic Mic</li>
                        <li>🔒 100% private - no one can read it!</li>
                    </ul>
                </div>

                <div className="warning-box">
                    ⚠️ If you forget your emoji key, your secrets stay locked forever!
                </div>

                <p className="coming-soon">
                    Encrypted diary coming in M5...
                </p>
            </div>
        </div>
    );
}

export default DiaryRealm;
