import React, { useState, useEffect, useCallback } from 'react';
import './AlertNotifications.css';
import alertsService from '../../services/alertsService';
import realTimeAlertsService from '../../services/realTimeAlertsService';

const AlertNotifications = ({
  alerts = [],
  trucks = [],
  onAlertClick,
  onCloseAlert,
  onAlertsUpdate,
  isOpen,
  onToggle
}) => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [newAlertIds, setNewAlertIds] = useState(new Set());

  const fetchRealAlerts = useCallback(async () => {
    try {
      const [standardAlerts, realTimeAlerts] = await Promise.all([
        alertsService.getAllAlerts(trucks),
        realTimeAlertsService.getAllRealTimeAlerts(trucks)
      ]);

      const allAlerts = [...standardAlerts, ...realTimeAlerts];
      const uniqueAlerts = allAlerts.filter((alert, index, self) =>
        index === self.findIndex(a => a.location === alert.location && a.type === alert.type)
      );

      return uniqueAlerts;
    } catch (error) {
      console.error('Erreur récupération alertes:', error);
      return [
        {
          id: `fallback_network_${Date.now()}`,
          type: 'info',
          title: 'Surveillance active',
          icon: '📶',
          location: 'Système de surveillance',
          position: [36.8065, 10.1815],
          description: 'Surveillance du trafic et météo (mode sécurisé)',
          severity: 'info',
          delay: 0,
          affectedRoutes: [],
          timestamp: new Date().toISOString(),
          isActive: true,
          source: 'network_fallback',
          realEvent: false
        }
      ];
    }
  }, [trucks]);

  useEffect(() => {
    const updateAlerts = async () => {
      try {
        const realAlerts = await fetchRealAlerts();

        const validAlerts = realAlerts.filter(alert => {
          try {
            return alert &&
              alert.id &&
              alert.type &&
              alert.position &&
              Array.isArray(alert.position) &&
              alert.position.length === 2 &&
              typeof alert.position[0] === 'number' &&
              typeof alert.position[1] === 'number' &&
              alert.isActive !== false;
          } catch (error) {
            console.warn('Alerte invalide:', alert);
            return false;
          }
        });

        const currentAlertIds = new Set(activeAlerts.map(a => a.id));
        const newIds = new Set();
        validAlerts.forEach(alert => {
          if (!currentAlertIds.has(alert.id)) {
            newIds.add(alert.id);
          }
        });

        if (newIds.size > 0) {
          setNewAlertIds(newIds);
          setTimeout(() => {
            setNewAlertIds(prev => {
              const updated = new Set(prev);
              newIds.forEach(id => updated.delete(id));
              return updated;
            });
          }, 6000);
        }

        setActiveAlerts(validAlerts);
        if (onAlertsUpdate) onAlertsUpdate(validAlerts);

      } catch (error) {
        const fallbackAlerts = [{
          id: `fallback_${Date.now()}`,
          type: 'info',
          title: 'Surveillance active',
          icon: '📶',
          location: 'Système',
          position: [36.8065, 10.1815],
          description: 'Surveillance du trafic et météo en cours',
          severity: 'info',
          delay: 0,
          affectedRoutes: [],
          timestamp: new Date().toISOString(),
          isActive: true,
          source: 'fallback'
        }];

        setActiveAlerts(fallbackAlerts);
        if (onAlertsUpdate) onAlertsUpdate(fallbackAlerts);
      }
    };

    const initTimer = setTimeout(updateAlerts, 1000);
    const getUpdateInterval = () => {
      const dangerCount = activeAlerts.filter(a => a.severity === 'danger').length;
      const realTimeCount = activeAlerts.filter(a => a.realEvent === true).length;

      if (dangerCount > 2) return 120000;
      if (realTimeCount > 0) return 60000;
      if (activeAlerts.length > 3) return 240000;
      return 120000;
    };

    const interval = setInterval(updateAlerts, getUpdateInterval());
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [trucks, fetchRealAlerts, activeAlerts.length]);

  const getTotalAlerts = () => [...alerts, ...activeAlerts].length;

  const getAllAlerts = () => {
    return [...alerts, ...activeAlerts].sort((a, b) => {
      const severityOrder = { danger: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const handleDeleteAlert = (alertId, e) => {
    e.stopPropagation();
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setNewAlertIds(prev => {
      const updated = new Set(prev);
      updated.delete(alertId);
      return updated;
    });
    if (onCloseAlert) onCloseAlert(alertId);
  };

  if (!isOpen) {
    return (
      <button
  onClick={onToggle}
  className="alert-notification-button"
  style={{
    position: 'fixed',
    top: '30px',
    right: '80px', // Position fixe inchangée pour mobile et desktop
    zIndex: 2000,
    width: window.innerWidth < 768 ? '35px' : '46px', // Taille réduite seulement en mobile
    height: window.innerWidth < 768 ? '35px' : '46px', // Taille réduite seulement en mobile
    borderRadius: '50%',
    background: getTotalAlerts() > 0
      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    border: '2px solid rgba(255,255,255,0.8)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: getTotalAlerts() > 0 ?
      '0 10px 30px rgba(239, 68, 68, 0.3), 0 0 15px rgba(239, 68, 68, 0.2)' :
      '0 6px 20px rgba(107, 114, 128, 0.2)',
    color: 'white',
    transition: 'all 0.3s ease',
    animation: getTotalAlerts() > 0 ? 'alertPulse 2.5s ease-in-out infinite' : 'none',
    backdropFilter: 'blur(8px)'
  }}
>
  <div style={{ position: 'relative' }}>
    <svg 
      width={window.innerWidth < 768 ? '16px' : '20px'} // Icône réduite en mobile
      height={window.innerWidth < 768 ? '16px' : '20px'} // Icône réduite en mobile
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {getTotalAlerts() > 0 && (
      <div style={{
        position: 'absolute',
        top: window.innerWidth < 768 ? '-8px' : '-14px', // Ajusté pour mobile
        right: window.innerWidth < 768 ? '-6px' : '-9px', // Ajusté pour mobile
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        color: '#ef4444',
        borderRadius: '50%',
        width: window.innerWidth < 768 ? '18px' : '24px', // Badge réduit en mobile
        height: window.innerWidth < 768 ? '18px' : '24px', // Badge réduit en mobile
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '900',
        border: '2px solid #ef4444',
        boxShadow: '0 3px 12px rgba(239, 68, 68, 0.3)',
        animation: 'badgePulse 3s ease-in-out infinite'
      }}>
        {getTotalAlerts()}
      </div>
    )}
  </div>
</button>
    );
  }

  return (
    <div className="alert-notifications-panel" style={{ width: '280px' }}>
      {/* Header */}
      <div className="alert-notifications-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="alert-notifications-icon" style={{ width: '36px', height: '36px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Alertes</h2>
          <div className="alert-count" style={{ 
            fontSize: '12px', 
            padding: '4px 8px',
            minWidth: '20px'
          }}>
            {getTotalAlerts()}
          </div>
        </div>
        <button 
          onClick={onToggle} 
          className="close-button" 
          style={{ 
            width: '32px', 
            height: '32px',
            borderRadius: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="alert-notifications-content">
        {getAllAlerts().length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <h3 style={{ fontSize: '14px' }}>Aucune alerte active</h3>
            <p style={{ fontSize: '12px' }}>Tous les itinéraires sont dégagés</p>
          </div>
        ) : (
          <div className="alerts-list">
            {getAllAlerts().map((alert, index) => (
              <div
                key={alert.id || index}
                className={`alert-item alert-${alert.severity}`}
                onClick={() => onAlertClick && onAlertClick(alert)}
                style={{
                  position: 'relative',
                  boxShadow: newAlertIds.has(alert.id)
                    ? '0 6px 20px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2)'
                    : undefined,
                  border: newAlertIds.has(alert.id)
                    ? '1px solid #3b82f6'
                    : undefined,
                  animation: newAlertIds.has(alert.id)
                    ? 'newAlertGlow 2s ease-in-out infinite'
                    : undefined
                }}
              >
                <div className="alert-icon">
                  {alert.icon}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <h4 style={{ fontSize: '14px', margin: 0 }}>{alert.title}</h4>
                    <div className="alert-badges">
                      {alert.realEvent && (
                        <span className="real-time-badge" style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontSize: '8px',
                          fontWeight: '700',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          marginRight: '3px'
                        }}>LIVE</span>
                      )}
                      <span className="alert-delay" style={{ 
                        top: '-4px',
                        fontSize: '8px',
                        padding: '2px 4px'
                      }}>+{alert.delay}min</span>
                    </div>
                  </div>
                  <p className="alert-description" style={{ fontSize: '12px', margin: '6px 0' }}>
                    {alert.description}
                  </p>
                  <div className="alert-meta" style={{ fontSize: '11px' }}>
                    <span className="alert-location">📍 {alert.location}</span>
                    {alert.affectedRoutes && alert.affectedRoutes.length > 0 && (
                      <span className="alert-routes">
                        🚛 {alert.affectedRoutes.join(', ')}
                      </span>
                    )}
                    {alert.city && (
                      <span className="alert-city" style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        marginLeft: '6px'
                      }}>🏢 {alert.city}</span>
                    )}
                  </div>
                </div>
                <button
                  className="alert-close"
                  onClick={(e) => handleDeleteAlert(alert.id, e)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    zIndex: 10
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="alert-notifications-footer" style={{ padding: '12px 16px' }}>
        <div className="alert-stats">
          <div className="stat-item">
            <span className="stat-icon">🚨</span>
            <span className="stat-label" style={{ fontSize: '10px' }}>Critiques</span>
            <span className="stat-value" style={{ fontSize: '14px' }}>
              {getAllAlerts().filter(a => a.severity === 'danger').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⚠️</span>
            <span className="stat-label" style={{ fontSize: '10px' }}>Attention</span>
            <span className="stat-value" style={{ fontSize: '14px' }}>
              {getAllAlerts().filter(a => a.severity === 'warning').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">ℹ️</span>
            <span className="stat-label" style={{ fontSize: '10px' }}>Info</span>
            <span className="stat-value" style={{ fontSize: '14px' }}>
              {getAllAlerts().filter(a => a.severity === 'info').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertNotifications;