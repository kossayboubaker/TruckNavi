import React, { useState } from 'react';

const MapControlPanel = ({ 
  onZoomIn, 
  onZoomOut, 
  onMapStyleChange, 
  mapStyle = 'standard',
  alertsCount = 0,
  onToggleAlerts,
  showAlerts = false
}) => {
  const [showControls, setShowControls] = useState(false);

  const mapStyles = [
    { value: 'standard', label: 'Standard', icon: '🗺️' },
    { value: 'satellite', label: 'Satellite', icon: '🛰️' },
    { value: 'terrain', label: 'Terrain', icon: '🏔️' }
  ];

  const currentStyle = mapStyles.find(style => style.value === mapStyle) || mapStyles[0];

  return (
    <div style={{
      position: 'fixed',
      top: '10px', // Glissé vers le bas pour éviter conflit avec header
      left: '20px',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(29, 78, 216, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      border: '2px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Zoom Controls */}
      <button
        onClick={onZoomIn}
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1)';
        }}
        title="Zoom avant"
      >
        +
      </button>

      <button
        onClick={onZoomOut}
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1)';
        }}
        title="Zoom arrière"
      >
        −
      </button>

      {/* Style de carte */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            height: '40px',
            padding: '0 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          title="Style de carte"
        >
          <span style={{ fontSize: '16px' }}>{currentStyle.icon}</span>
          {currentStyle.label}
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: showControls ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {/* Menu déroulant des styles */}
        {showControls && (
          <div style={{
            position: 'absolute',
            top: '48px',
            left: '0',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            minWidth: '180px',
            overflow: 'hidden',
            zIndex: 2001
          }}>
            {mapStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => {
                  onMapStyleChange(style.value);
                  setShowControls(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: mapStyle === style.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: mapStyle === style.value ? '#3b82f6' : '#374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (mapStyle !== style.value) {
                    e.target.style.background = 'rgba(0, 0, 0, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (mapStyle !== style.value) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{style.icon}</span>
                {style.label}
                {mapStyle === style.value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bouton paramètres (selon capture 3) */}
      <button
        onClick={onToggleAlerts}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%', // Rond comme dans capture 3
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1)';
        }}
        title={`Paramètres et alertes (${alertsCount})`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
        {alertsCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            border: '2px solid white',
            color: 'white'
          }}>
            {alertsCount > 99 ? '99+' : alertsCount}
          </div>
        )}
      </button>

      {/* Fond cliquable pour fermer les menus */}
      {showControls && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1999
          }}
          onClick={() => setShowControls(false)}
        />
      )}
    </div>
  );
};

export default MapControlPanel;
