import React, { useState } from 'react';

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

  const mapStyles = [
    { value: 'standard', label: 'Standard', icon: '🗺️' },
    { value: 'satellite', label: 'Satellite', icon: '🛰️' },
    { value: 'terrain', label: 'Terrain', icon: '🏔️' }
  ];



  return (
    <div style={{
      position: 'fixed',
      top: window.innerWidth < 90 && window.innerHeight < 90 ? '5px' : '15px',
      right: window.innerWidth < 90 && window.innerHeight < 90 ? '5px' : '15px',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: window.innerWidth < 90 && window.innerHeight < 90 ? '4px' : '8px'
    }}>
      {/* Bouton principal pour ouvrir/fermer le panneau */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        style={{
          width: window.innerWidth < 90 && window.innerHeight < 90 ? '30px' :
                 window.innerWidth < 768 ? '40px' : '50px',
          height: window.innerWidth < 90 && window.innerHeight < 90 ? '30px' :
                  window.innerWidth < 768 ? '40px' : '50px',
          background: isPanelOpen ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
        }}
        title="Contrôles Carte"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        
        {alertsCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '24px',
            height: '24px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid white',
            color: 'white'
          }}>
            {alertsCount > 99 ? '99+' : alertsCount}
          </div>
        )}
      </button>

      {/* Panneau de contrôles selon votre image */}
      {isPanelOpen && (
        <div style={{
          width: window.innerWidth < 90 && window.innerHeight < 90 ? '200px' :
                 window.innerWidth < 768 ? '280px' : '320px',
          maxHeight: window.innerWidth < 90 && window.innerHeight < 90 ? '70vh' : '80vh',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: window.innerWidth < 90 && window.innerHeight < 90 ? '8px' : '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          overflow: 'hidden',
          animation: 'slideInRight 0.3s ease-out',
          position: 'relative',
          top: window.innerWidth < 90 && window.innerHeight < 90 ? '0px' : '-30px'
        }}>
          {/* Header du panneau */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
                <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-3c0-.6-.4-1-1-1h-5z"/>
                <circle cx="7" cy="18" r="2"/>
                <path d="M15 18H9"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                Contrôles Carte
              </h3>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            padding: window.innerWidth < 90 && window.innerHeight < 90 ? '8px' : '15px',
            maxHeight: 'none',
            overflow: 'hidden'
          }}>
            {/* Contrôles de zoom */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={onZoomIn}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                  +
                </button>
                <button
                  onClick={onZoomOut}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                  −
                </button>
              </div>
            </div>

            {/* Style de carte */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '13px', 
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
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '13px',
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

            {/* Couches de carte */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Couches de carte
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={(e) => onToggleRoutes(e.target.checked)}
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  🗺️ Afficher les routes
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={showWeather}
                    onChange={(e) => onToggleWeather(e.target.checked)}
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  🌧️ Couche météo
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={followTruck}
                    onChange={(e) => onToggleFollowTruck(e.target.checked)}
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  📱 Suivre le camion sélectionné
                </label>
              </div>
            </div>

            {/* Camion sélectionné selon votre image */}
            {selectedTruck && (
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #4fc3f7'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '12px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>��</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: '#0d47a1' 
                    }}>
                      {selectedTruck.truck_id}
                    </span>
                  </div>
                  <span style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    En Route
                  </span>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5f6368', marginBottom: '2px' }}>Conducteur</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                    👤 {selectedTruck.driver?.name || 'N/A'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5f6368', marginBottom: '2px' }}>Destination</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                    📍 {selectedTruck.destination || 'N/A'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#5f6368', marginBottom: '2px' }}>Vitesse</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                      ⚡ {Math.round(selectedTruck.speed || 0)} km/h
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#5f6368', marginBottom: '2px' }}>Progression</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                      📊 {selectedTruck.route_progress || 0}%
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '6px',
                  height: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${selectedTruck.route_progress || 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.5s ease'
                  }} />
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
              transform: translateX(100%);
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
