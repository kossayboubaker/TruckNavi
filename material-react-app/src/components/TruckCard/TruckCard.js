import React, { useState, useEffect } from 'react';

const TruckCard = ({ truck, alerts = [], isSelected = false, onSelect }) => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const getStateInfo = (state) => {
    switch (state) {
      case 'En Route': 
        return { 
          bg: '#dcfce7', 
          color: '#15803d', 
          text: '🚛 En Route',
          icon: '🟢'
        };
      case 'At Destination': 
        return { 
          bg: '#e0e7ff', 
          color: '#4338ca', 
          text: '📍 À destination',
          icon: '🔵'
        };
      case 'Maintenance': 
        return { 
          bg: '#fef9c3', 
          color: '#b45309', 
          text: '🔧 Maintenance',
          icon: '🟡'
        };
      case 'Emergency': 
        return { 
          bg: '#fee2e2', 
          color: '#b91c1c', 
          text: '🚨 Urgence',
          icon: '🔴'
        };
      default: 
        return { 
          bg: '#f3f4f6', 
          color: '#4b5563', 
          text: `ℹ️ ${state}`,
          icon: '⚪'
        };
    }
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getProgressPercentage = () => {
    return truck.route_progress || 0;
  };

  const getResponsiveConfig = () => {
    const { width } = screenSize;
    if (width < 200) return { padding: '8px', gap: '6px', textSize: '10px', iconSize: 16 };
    if (width < 250) return { padding: '10px', gap: '8px', textSize: '11px', iconSize: 18 };
    if (width < 320) return { padding: '12px', gap: '10px', textSize: '12px', iconSize: 20 };
    if (width < 400) return { padding: '14px', gap: '12px', textSize: '13px', iconSize: 22 };
    return { padding: '16px', gap: '14px', textSize: '14px', iconSize: 24 };
  };

  const responsive = getResponsiveConfig();
  const stateInfo = getStateInfo(truck.state);
  const progress = getProgressPercentage();
  const hasAlerts = alerts.length > 0;
  const highPriorityAlerts = alerts.filter(alert => alert.severity === 'danger').length;

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatEstimatedArrival = () => {
    if (!truck.estimatedArrival) return 'N/A';
    
    const baseTime = new Date(truck.estimatedArrival);
    let totalDelay = 0;
    
    alerts.forEach(alert => {
      if (alert.delay) totalDelay += alert.delay;
    });
    
    const adjustedTime = new Date(baseTime.getTime() + totalDelay * 60 * 1000);
    return adjustedTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: isSelected ? '#eff6ff' : '#fff',
        borderRadius: '16px',
        boxShadow: isSelected 
          ? '0 8px 32px rgba(59, 130, 246, 0.15)' 
          : '0 2px 8px rgba(0,0,0,0.05)',
        border: isSelected 
          ? '2px solid #3b82f6' 
          : hasAlerts 
            ? '2px solid #ef4444' 
            : '1px solid #e2e8f0',
        padding: responsive.padding,
        display: 'flex',
        flexDirection: 'column',
        gap: responsive.gap,
        margin: '4px 0',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        wordBreak: 'break-word',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        background: isSelected 
          ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          : hasAlerts 
            ? 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
            : '#ffffff'
      }}
    >
      {/* Badge d'alerte urgent */}
      {highPriorityAlerts > 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#ef4444',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          animation: 'pulse 2s infinite'
        }}>
          !
        </div>
      )}

      {/* Header avec ID du camion et statut */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: responsive.gap,
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: responsive.textSize,
            fontWeight: '800',
            color: isSelected ? '#1d4ed8' : '#1f2937',
            background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            padding: '4px 8px',
            borderRadius: '8px',
            border: isSelected ? '1px solid #3b82f6' : '1px solid transparent'
          }}>
            {truck.truck_id}
          </span>
          {truck.ecoMode && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: '600',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              whiteSpace: 'nowrap'
            }}>
              ECO
            </span>
          )}
        </div>
        <span style={{
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '8px',
          fontWeight: '600',
          backgroundColor: stateInfo.bg,
          color: stateInfo.color,
          whiteSpace: 'nowrap',
          border: `1px solid ${stateInfo.color}20`
        }}>
          {stateInfo.text}
        </span>
      </div>

      {/* Infos principales */}
      <div style={{ display: 'flex', gap: responsive.gap, alignItems: 'flex-start' }}>
        <div style={{
          width: responsive.iconSize,
          height: responsive.iconSize,
          borderRadius: '8px',
          background: isSelected 
            ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
          fontSize: responsive.iconSize > 20 ? '16px' : '12px'
        }}>
          {isSelected ? '🚛' : '🚚'}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Véhicule et conducteur */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            marginBottom: '4px' 
          }}>
            <span style={{
              fontSize: responsive.textSize,
              fontWeight: '700',
              color: '#1f2937',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1
            }}>
              {truck.vehicle}
            </span>
          </div>
          
          {/* Conducteur avec avatar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '6px' 
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {truck.driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <span style={{
              fontSize: '12px',
              color: '#4b5563',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {truck.driver.name}
            </span>
          </div>
          
          {/* Vitesse et progression */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ 
                color: truck.speed > 0 ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
              }}>
                ⚡ {Math.round(truck.speed || 0)} km/h
              </span>
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#3b82f6',
              background: '#eff6ff',
              padding: '2px 6px',
              borderRadius: '6px'
            }}>
              {progress.toFixed(0)}%
            </span>
          </div>
          
          {/* Barre de progression */}
          <div style={{
            height: '6px',
            backgroundColor: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: truck.state === 'En Route' 
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Destination et heure */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '8px',
        padding: '8px'
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>📍</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#1f2937',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {truck.destination}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#6b7280'
            }}>
              Arrivée prévue: {formatEstimatedArrival()}
              {alerts.length > 0 && (
                <span style={{ color: '#ef4444', fontWeight: '600' }}>
                  {' '}(+{alerts.reduce((sum, alert) => sum + (alert.delay || 0), 0)}min)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alertes actives */}
      {alerts.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '8px'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#dc2626',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⚠️ {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
          </div>
          {alerts.slice(0, 2).map((alert, index) => (
            <div key={alert.id || index} style={{
              fontSize: '10px',
              color: '#7f1d1d',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: index < Math.min(alerts.length, 2) - 1 ? '2px' : 0
            }}>
              <span style={{ 
                color: getAlertSeverityColor(alert.severity),
                fontSize: '12px'
              }}>
                {alert.icon}
              </span>
              <span style={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                flex: 1
              }}>
                {alert.title}
              </span>
              {alert.delay && (
                <span style={{ 
                  color: '#ef4444',
                  fontWeight: 'bold'
                }}>
                  +{alert.delay}min
                </span>
              )}
            </div>
          ))}
          {alerts.length > 2 && (
            <div style={{
              fontSize: '9px',
              color: '#9ca3af',
              fontStyle: 'italic',
              marginTop: '2px'
            }}>
              ...et {alerts.length - 2} autre{alerts.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Informations supplémentaires (carburant, température) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        marginTop: '4px'
      }}>
        {truck.fuel_level && (
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: truck.fuel_level < 20 ? '#fef2f2' : '#f0fdf4',
            borderRadius: '6px',
            border: `1px solid ${truck.fuel_level < 20 ? '#fecaca' : '#bbf7d0'}`
          }}>
            <div style={{
              fontSize: '10px',
              color: truck.fuel_level < 20 ? '#dc2626' : '#059669',
              fontWeight: 'bold'
            }}>
              ⛽ {truck.fuel_level}%
            </div>
          </div>
        )}
        {truck.temperature !== undefined && (
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: '#f0f9ff',
            borderRadius: '6px',
            border: '1px solid #bae6fd'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#0369a1',
              fontWeight: 'bold'
            }}>
              🌡️ {truck.temperature}°C
            </div>
          </div>
        )}
        <div style={{
          textAlign: 'center',
          padding: '6px',
          background: '#fefce8',
          borderRadius: '6px',
          border: '1px solid #fde047'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#a16207',
            fontWeight: 'bold'
          }}>
            📦 {truck.weight ? `${(truck.weight/1000).toFixed(1)}T` : 'N/A'}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default TruckCard;
