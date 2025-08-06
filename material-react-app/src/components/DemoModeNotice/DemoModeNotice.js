import React from 'react';
import './DemoModeNotice.css';

const DemoModeNotice = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasBackendConfigured = !!process.env.REACT_APP_API_URL;

  // N'afficher qu'en production sans backend configuré
  if (isDevelopment || isLocalhost) {
    return null;
  }

  // Déterminer le type de notice à afficher
  const isProductionMode = !isDevelopment && !isLocalhost;
  const noticeType = hasBackendConfigured ? 'production' : 'demo';

  if (noticeType === 'production' && hasBackendConfigured) {
    // Mode production avec backend configuré
    return (
      <div className="demo-mode-notice production-mode">
        <div className="notice-content">
          <div className="notice-icon">🛡️</div>
          <div className="notice-text">
            <h3>Mode Production</h3>
            <p>Sécurisé - Vérifications désactivées</p>
          </div>
          <div className="notice-actions">
            <span className="demo-badge production">PROD</span>
          </div>
        </div>
      </div>
    );
  }

  // Mode démonstration sans backend
  return (
    <div className="demo-mode-notice">
      <div className="notice-content">
        <div className="notice-icon">🎭</div>
        <div className="notice-text">
          <h3>Mode Démonstration</h3>
          <p>Interface sans backend connecté</p>
        </div>
        <div className="notice-actions">
          <span className="demo-badge">DÉMO</span>
        </div>
      </div>
    </div>
  );
};

export default DemoModeNotice;
