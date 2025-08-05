import React, { useState, useEffect } from 'react';

const AdvancedMapControls = ({ 
  onZoomIn, 
  onZoomOut, 
  onMapStyleChange, 
  mapStyle = 'standard',
  alertsCount = 0,
  onToggleAlerts,
  showAlerts = false,
  selectedTruck = null,
  showRoutes = true,
  onToggleRoutes,
  showWeather = false,
  onToggleWeather,
  followTruck = false,
  onToggleFollowTruck
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isSmallScreen = windowSize.width < 480;

  const mapStyles = [
    { value: 'standard', label: 'Standard', icon: '🗺️' },
    { value: 'satellite', label: 'Satellite', icon: '🛰️' },
    { value: 'terrain', label: 'Terrain', icon: '🏔️' }
  ];

  const getSize = (mobileSize, tabletSize, desktopSize) => {
    if (isSmallScreen) return mobileSize;
    if (isMobile) return tabletSize;
    return desktopSize;
  };

  return (
    <div style={{
      position: 'fixed',
      top: getSize('30px', '30px', '30px'),
      right: getSize('10px', '15px', '20px'),
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: getSize('6px', '8px', '10px')
    }}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        style={{
          width: getSize('40px', '45px', '50px'),
          height: getSize('40px', '45px', '50px'),
          background: isPanelOpen ? 
            'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' : 
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1500,
          
        }}
        aria-label="Contrôles Carte"
      >
        <svg 
          width={getSize('20px', '22px', '24px')} 
          height={getSize('20px', '22px', '24px')} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        
        {alertsCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: getSize('20px', '22px', '24px'),
            height: getSize('20px', '22px', '24px'),
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: getSize('10px', '11px', '12px'),
            fontWeight: 'bold',
            border: '2px solid white',
            color: 'white'
          }}>
            {alertsCount > 99 ? '99+' : alertsCount}
          </div>
        )}
      </button>

      {/* Panneau de contrôles */}
      {isPanelOpen && (
        <div style={{
          width: getSize('260px', '280px', '300px'),
          maxWidth: `calc(100vw - ${getSize('30px', '40px', '50px')})`,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: getSize('12px', '14px', '16px'),
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          overflow: 'hidden',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: getSize('10px 14px', '12px 16px', '14px 18px'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg 
                width={getSize('16px', '18px', '20px')} 
                height={getSize('16px', '18px', '20px')} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
                <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-3c0-.6-.4-1-1-1h-5z"/>
                <circle cx="7" cy="18" r="2"/>
                <path d="M15 18H9"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
              <h3 style={{ 
                margin: 0, 
                fontSize: getSize('14px', '15px', '16px'), 
                fontWeight: '700' 
              }}>
                Contrôles Carte
              </h3>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                width: getSize('24px', '26px', '28px'),
                height: getSize('24px', '26px', '28px'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Contenu */}
          <div style={{
            padding: getSize('10px', '12px', '14px'),
            maxHeight: `calc(${windowSize.height}px - ${getSize('160px', '180px', '200px')})`,
            overflowY: 'auto'
          }}>
            {/* Zoom Controls */}
            <div style={{ marginBottom: getSize('12px', '14px', '16px') }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={onZoomIn}
                  style={{
                    flex: 1,
                    padding: getSize('6px', '8px', '10px'),
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: getSize('14px', '15px', '16px'),
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  aria-label="Zoom avant"
                >
                  +
                </button>
                <button
                  onClick={onZoomOut}
                  style={{
                    flex: 1,
                    padding: getSize('6px', '8px', '10px'),
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: getSize('14px', '15px', '16px'),
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  aria-label="Zoom arrière"
                >
                  −
                </button>
              </div>
            </div>

            {/* Map Style */}
            <div style={{ marginBottom: getSize('12px', '14px', '16px') }}>
              <label style={{ 
                display: 'block', 
                marginBottom: getSize('4px', '6px', '8px'), 
                fontSize: getSize('12px', '13px', '14px'), 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Style de carte
              </label>
              <select
                value={mapStyle}
                onChange={(e) => onMapStyleChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: getSize('6px 8px', '8px 10px', '10px 12px'),
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: getSize('12px', '13px', '14px'),
                  cursor: 'pointer',
                  background: 'white',
                  outline: 'none',
                  color: '#374151'
                }}
              >
                {mapStyles.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.icon} {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Map Layers */}
            <div style={{ marginBottom: getSize('12px', '14px', '16px') }}>
              <h4 style={{ 
                margin: `0 0 ${getSize('8px', '10px', '12px')} 0`, 
                fontSize: getSize('12px', '13px', '14px'), 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Couches de carte
              </h4>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: getSize('6px', '8px', '10px') 
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: getSize('12px', '13px', '14px'),
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={(e) => onToggleRoutes(e.target.checked)}
                    style={{ 
                      width: getSize('14px', '15px', '16px'), 
                      height: getSize('14px', '15px', '16px'), 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  🗺️ Afficher les routes
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: getSize('12px', '13px', '14px'),
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={showWeather}
                    onChange={(e) => onToggleWeather(e.target.checked)}
                    style={{ 
                      width: getSize('14px', '15px', '16px'), 
                      height: getSize('14px', '15px', '16px'), 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  🌧️ Couche météo
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: getSize('12px', '13px', '14px'),
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={followTruck}
                    onChange={(e) => onToggleFollowTruck(e.target.checked)}
                    style={{ 
                      width: getSize('14px', '15px', '16px'), 
                      height: getSize('14px', '15px', '16px'), 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  📱 Suivre le camion
                </label>
              </div>
            </div>

            {/* Selected Truck Card */}
            {selectedTruck && (
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #77d3feff 100%)',
                borderRadius: '10px',
                padding: getSize('8px', '10px', '12px'),
                border: '2px solid #4fc3f7',
                marginBottom: getSize('12px', '14px', '16px')
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: getSize('8px', '10px', '12px') 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: getSize('14px', '15px', '16px') }}>🚚</span>
                    <span style={{ 
                      fontSize: getSize('12px', '13px', '14px'), 
                      fontWeight: '700', 
                      color: '#0d47a1' 
                    }}>
                      {selectedTruck.truck_id}
                    </span>
                  </div>
                  <span style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: getSize('2px 4px', '3px 6px', '4px 8px'),
                    borderRadius: '4px',
                    fontSize: getSize('10px', '11px', '12px'),
                    fontWeight: '600'
                  }}>
                    En Route
                  </span>
                </div>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: getSize('8px', '10px', '12px'),
                  marginBottom: getSize('8px', '10px', '12px')
                }}>
                  <div>
                    <div style={{ 
                      fontSize: getSize('10px', '11px', '12px'), 
                      color: '#5f6368', 
                      marginBottom: '2px' 
                    }}>
                      Conducteur
                    </div>
                    <div style={{ 
                      fontSize: getSize('12px', '13px', '14px'), 
                      fontWeight: '600', 
                      color: '#1f2937' 
                    }}>
                      👤 {selectedTruck.driver?.name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: getSize('10px', '11px', '12px'), 
                      color: '#5f6368', 
                      marginBottom: '2px' 
                    }}>
                      Destination
                    </div>
                    <div style={{ 
                      fontSize: getSize('12px', '13px', '14px'), 
                      fontWeight: '600', 
                      color: '#1f2937' 
                    }}>
                      📍 {selectedTruck.destination || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: getSize('10px', '11px', '12px'), 
                      color: '#5f6368', 
                      marginBottom: '2px' 
                    }}>
                      Vitesse
                    </div>
                    <div style={{ 
                      fontSize: getSize('12px', '13px', '14px'), 
                      fontWeight: '600', 
                      color: '#1f2937' 
                    }}>
                      ⚡ {Math.round(selectedTruck.speed || 0)} km/h
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: getSize('10px', '11px', '12px'), 
                      color: '#5f6368', 
                      marginBottom: '2px' 
                    }}>
                      Progression
                    </div>
                    <div style={{ 
                      fontSize: getSize('12px', '13px', '14px'), 
                      fontWeight: '600', 
                      color: '#1f2937' 
                    }}>
                      📊 {selectedTruck.route_progress || 0}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdvancedMapControls;