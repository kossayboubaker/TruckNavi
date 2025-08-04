import React, { useState, useEffect } from 'react';

const BreakNotification = ({ notification, onClose, onStartBreak, onBreakEnd }) => {
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes en secondes
  const [isOnBreak, setIsOnBreak] = useState(false);

  useEffect(() => {
    if (!isOnBreak) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsOnBreak(false);
          // Reprendre le camion automatiquement
          onBreakEnd && onBreakEnd(notification.truckId);
          onClose && onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnBreak, onClose]);

  const handleStartBreak = () => {
    setIsOnBreak(true);
    onStartBreak && onStartBreak(notification);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: window.innerWidth < 90 && window.innerHeight < 90 ? '35px' : '90px',
      right: window.innerWidth < 90 && window.innerHeight < 90 ? '5px' : '15px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '2px solid #f59e0b',
      borderRadius: window.innerWidth < 90 && window.innerHeight < 90 ? '6px' : '16px',
      padding: window.innerWidth < 90 && window.innerHeight < 90 ? '6px' : '20px',
      minWidth: window.innerWidth < 90 && window.innerHeight < 90 ? '120px' : '320px',
      maxWidth: window.innerWidth < 90 && window.innerHeight < 90 ? '150px' : '400px',
      boxShadow: '0 20px 60px rgba(245, 158, 11, 0.3)',
      animation: 'slideInRight 0.5s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '32px',
          animation: 'pulse 2s infinite'
        }}>
          🚦
        </div>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '800',
            color: '#92400e'
          }}>
            Pause Obligatoire
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#b45309'
          }}>
            {notification.truckId}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#92400e',
            opacity: isOnBreak ? 0.6 : 1
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        background: 'rgba(251, 191, 36, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          color: '#92400e',
          lineHeight: '1.5'
        }}>
          {notification.message}
        </p>
        
        {isOnBreak ? (
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#92400e',
              marginBottom: '8px'
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{
              background: '#fbbf24',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#92400e',
                height: '100%',
                width: `${((45 * 60 - timeLeft) / (45 * 60)) * 100}%`,
                transition: 'width 1s linear',
                borderRadius: '4px'
              }}></div>
            </div>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '12px',
              color: '#b45309'
            }}>
              Pause en cours...
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStartBreak}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
              }}
            >
              🛑 Commencer la pause (45min)
            </button>
          </div>
        )}
      </div>

      <div style={{
        fontSize: '12px',
        color: '#b45309',
        textAlign: 'center'
      }}>
        📍 Point de pause obligatoire pour sécurité
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

export default BreakNotification;
