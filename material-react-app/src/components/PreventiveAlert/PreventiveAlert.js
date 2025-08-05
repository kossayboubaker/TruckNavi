import React from 'react';

const PreventiveAlert = ({ alert, onClose }) => {
  const getAlertIcon = (type) => {
    const icons = {
      'traffic': '🚦',
      'construction': '🚧',
      'accident': '⚠️',
      'weatherRain': '🌧️',
      'maintenance': '🔧',
      'police': '👮',
      'danger': '🚨',
      'info': 'ℹ️',
      'warning': '⚠️',
      'default': '🔔',

    };
    return icons[type] || '⚠️';
  };

  const getAlertColor = (severity) => {
    const colors = {
      'danger': '#dc2626',
      'warning': '#f59e0b',
      'info': '#3b82f6'
    };
    return colors[severity] || '#f59e0b';
  };

  const backgroundColor = alert.severity === 'danger' ? '#fef2f2' : 
                         alert.severity === 'warning' ? '#fffbeb' : '#eff6ff';
  const borderColor = getAlertColor(alert.severity);

  return (
    <div style={{
      position: 'fixed',
      top: window.innerWidth < 90 && window.innerHeight < 90 ? '60px' : '400px',
      right: window.innerWidth < 90 && window.innerHeight < 90 ? '5px' : '15px',
      zIndex: 9998,
      background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`,
      border: `2px solid ${borderColor}`,
      borderRadius: '12px',
      padding: '16px',
      minWidth: '300px',
      maxWidth: '380px',
      boxShadow: `0 8px 25px ${borderColor}40`,
      animation: 'slideInRight 0.4s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          animation: 'pulse 2s infinite'
        }}>
          {getAlertIcon(alert.type)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '700',
              color: borderColor
            }}>
              🔔 Alerte Préventive
            </h4>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: borderColor,
                opacity: 0.7
              }}
            >
              ×
            </button>
          </div>
          
          <h5 style={{
            margin: '0 0 6px 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151'
          }}>
            {alert.title}
          </h5>
        </div>
      </div>

      <div style={{
        background: `${borderColor}15`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#4b5563',
          lineHeight: '1.4'
        }}>
          {alert.message}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#6b7280'
      }}>
        <span>🚛 {alert.truckId}</span>
        <span style={{
          background: borderColor,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '6px',
          fontWeight: '600'
        }}>
          Dans ~{alert.estimatedTime}min
        </span>
      </div>

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

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default PreventiveAlert;
