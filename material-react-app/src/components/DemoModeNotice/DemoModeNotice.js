import React from 'react';
import './DemoModeNotice.css';

const DemoModeNotice = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Afficher seulement en production sans backend configuré
  if (isDevelopment || isLocalhost || process.env.REACT_APP_API_URL) {
    return null;
  }

  return (
    <div className="demo-mode-notice">
      <div className="notice-content">
        <div className="notice-icon">🎭</div>
        <div className="notice-text">
          <h3>Mode Démonstration</h3>
          <p>Interface utilisateur sans backend connecté</p>
        </div>
        <div className="notice-actions">
          <span className="demo-badge">DÉMO</span>
        </div>
      </div>
    </div>
  );
};

export default DemoModeNotice;
