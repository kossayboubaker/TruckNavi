import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      color: 'white',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 1000
    }}>
      {/* Logo et titre seulement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-3c0-.6-.4-1-1-1h-5z"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M15 18H9"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '800',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            letterSpacing: '-0.5px'
          }}>
            Truck Control
          </h1>
          <p style={{
            margin: 0,
            fontSize: '12px',
            opacity: 0.8,
            fontWeight: '400'
          }}>
            Système intelligent de gestion de flotte
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
