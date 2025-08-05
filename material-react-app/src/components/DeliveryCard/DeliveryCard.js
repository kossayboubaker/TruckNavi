import React, { useState, useEffect } from 'react';

const DeliveryCard = ({ delivery, isSelected = false, onSelect }) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', color: '#15803d', text: '🟢 Terminé' };
      case 'in-progress': return { bg: '#fef9c3', color: '#b45309', text: '🟠 En cours' };
      case 'delayed': return { bg: '#fee2e2', color: '#b91c1c', text: '🔴 Retard' };
      case 'pending': return { bg: '#dbeafe', color: '#1d4ed8', text: '🔵 Attente' };
      default: return { bg: '#e0e7ff', color: '#4338ca', text: `ℹ️ ${status}` };
    }
  };

  const getProgressPercentage = () => {
    // Utiliser la vraie progression de route au lieu du statut
    return delivery.route_progress || 0;
  };

  const statusInfo = getStatusColor(delivery.status);
  const progress = getProgressPercentage();
  const fuelConsumption = "4L/100km";

  const getResponsiveConfig = () => {
    const { width, height } = screenSize;
    // Configuration ultra-compacte pour mobile
    if (width < 90 && height < 90) return { padding: '4px', gap: '2px', textSize: '9px', iconSize: 12, borderRadius: '6px' };
    if (width < 320) return { padding: '6px', gap: '3px', textSize: '10px', iconSize: 14, borderRadius: '6px' };
    if (width < 480) return { padding: '8px', gap: '4px', textSize: '11px', iconSize: 16, borderRadius: '8px' };
    if (width < 768) return { padding: '10px', gap: '6px', textSize: '12px', iconSize: 18, borderRadius: '10px' };
    return { padding: '14px', gap: '8px', textSize: '13px', iconSize: 20, borderRadius: '12px' };
  };

  const responsive = getResponsiveConfig();

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .delivery-card {
            position: relative;
            overflow: hidden;
          }

          .delivery-card:hover {
            transform: translateY(-3px) scale(1.02) !important;
            box-shadow: 0 12px 35px rgba(9, 97, 239, 0.61) !important;
          }

          .delivery-card.selected::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(90deg, #5e9df5ff);
            background-size: 400% 400%;
            border-radius: inherit;
            z-index: -2;
            animation: gradientShift 2s ease infinite;
          }

          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .eco-badge {
            position: relative;
            overflow: hidden;
          }

          .eco-badge.eco-on::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(172, 71, 71, 0.6), transparent);
            animation: ecoShine 2s infinite;
          }

          @keyframes ecoShine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
      <div
        className={`delivery-card ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
      style={{
        backgroundColor: isSelected ? '#eff6ff' : '#fff',
        borderRadius: responsive.borderRadius,
        boxShadow: isSelected ? '0 8px 25px rgba(59, 130, 246, 0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        padding: responsive.padding,
        display: 'flex',
        flexDirection: 'column',
        gap: responsive.gap,
        margin: responsive.textSize === '9px' ? '2px 4px' : responsive.textSize === '10px' ? '3px 6px' : '4px 8px',
        width: 'calc(100% - 4px)',
        maxWidth: 'calc(100% - 8px)',
        minHeight: responsive.textSize === '9px' ? '60px' : responsive.textSize === '10px' ? '70px' : '80px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        wordBreak: 'break-word',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        position: 'relative',
        '::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: responsive.borderRadius,
          background: isSelected ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)' : 'transparent',
          zIndex: -1
        }
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: responsive.gap }}>
        <span
          className={`eco-badge ${delivery.ecoMode ? 'eco-on' : ''}`}
          style={{
            fontSize: responsive.textSize,
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '600',
            backgroundColor: delivery.ecoMode ? '#d1fae5' : '#f3f4f6',
            color: delivery.ecoMode ? '#065f46' : '#6b7280',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            border: delivery.ecoMode ? '1px solid #137a2aff' : '1px solid #b3bbc8ff',
            boxShadow: delivery.ecoMode ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          {delivery.ecoMode ? '🌿' : '⚡'} {delivery.ecoMode ? 'ECO' : 'STD'}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flex: 1,
            justifyContent: 'flex-end'
          }}
        >
          <span
            style={{
              fontSize: responsive.textSize,
              fontWeight: '700',
              color: '#1e40af',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(30, 64, 175, 0.1)'
            }}
          >
            {delivery.truck_id || delivery.id}
          </span>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: delivery.state === 'En Route' ? '#10b981' :
                             delivery.state === 'At Destination' ? '#8b5cf6' :
                             delivery.state === 'Maintenance' ? '#f59e0b' : '#6b7280',
              animation: delivery.state === 'En Route' ? 'pulse 2s infinite' : 'none'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: responsive.gap, alignItems: 'center' }}>
        <div
          style={{
            width: responsive.iconSize,
            height: responsive.iconSize,
            borderRadius: '3px',
            backgroundColor: '#e3f2fd',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          🚚
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '2px' }}>
            <span
              style={{
                fontSize: responsive.textSize,
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {delivery.vehicle}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '2px' }}>
            <span
              style={{
                fontSize: responsive.textSize,
                color: '#393a3dff',
                whiteSpace: 'nowrap',
              }}
            >
              {fuelConsumption}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: responsive.textSize,
                color: '#1a1a1aff',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontWeight: '400',
              }}
            >
               {delivery.speed || 0}km/h
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: progress >= 90 ? '#dcfce7' : progress >= 50 ? '#fef3c7' : '#fee2e2',
                border: `1px solid ${progress >= 90 ? '#bbf7d0' : progress >= 50 ? '#fde68a' : '#fecaca'}`
              }}
            >
              <span
                style={{
                  fontSize: responsive.textSize,
                  fontWeight: '600',
                  color: progress >= 90 ? '#059669' : progress >= 50 ? '#d97706' : '#dc2626',
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(progress)}% parcouru
              </span>
            </div>
          </div>
          <div
            style={{
              height: '3px',
              backgroundColor: '#f1f5f9',
              borderRadius: '2px',
              marginTop: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: progress >= 90 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' :
                           progress >= 50 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' :
                           'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '2px',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 1,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: progress > 0 ? 'shimmer 2s infinite' : 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: responsive.gap }}>
        <div style={{ display: 'flex', gap: responsive.gap, alignItems: 'center' }}>
          <span style={{ color: '#22c55e' }}>🟢</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: responsive.textSize,
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {delivery.pickup.address}
            </div>
            <div
              style={{
                fontSize: responsive.textSize,
                color: '#353639ff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: '400',
              }}
            >
              {delivery.pickup.city}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: responsive.gap, alignItems: 'center' }}>
          <span style={{ color: '#5387e0ff' }}>🔵</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: responsive.textSize,
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {typeof delivery.destination === 'string' ? delivery.destination : delivery.destination.address}
            </div>
            <div
              style={{
                fontSize: responsive.textSize,
                color: '#404349ff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: '400',
              }}
            >
              {typeof delivery.destination === 'string' ? 'Destination' : delivery.destination.city}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between ',
          alignItems: 'center',
          borderTop: '2.5px solid #cbd1d8ff',
          paddingTop: responsive.gap,
          gap: responsive.gap,
        }}
      >
       <div style={{ display: 'flex', alignItems: 'center', gap: responsive.gap, minWidth: 0 }}>
  <div
    style={{
      width: responsive.iconSize + 4,
      height: responsive.iconSize + 4,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f6a23bff 0%, #3a61deff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: responsive.textSize,
      color: 'white',
      fontWeight: 'bold',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
      border: '2px solid white',
      position: 'relative'
    }}
  >
    {delivery.driver?.avatar || delivery.driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
    <div
      style={{
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#10b981',
        border: '2px solid white',
        animation: 'pulse 2s infinite'
      }}
    />
  </div>
  
  {/* Conteneur texte modifié */}
  <div style={{ 
    minWidth: 0,
    marginTop: '-6px',  // Décalage vers le haut
    paddingTop: '1px',  // Compensation
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }}>
    <div
      style={{
        fontSize: responsive.textSize,
        fontWeight: '400',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: '1.2'  // Ajustement de l'interligne
      }}
    >
      {delivery.driver.name}
    </div>
    <div
      style={{
        fontSize: responsive.textSize,
        color: '#423939ff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginTop: '1px',  // Espacement réduit
        lineHeight: '1.2'  // Ajustement de l'interligne
      }}
    >
      {delivery.driver.contact}
    </div>
  </div>
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: responsive.textSize,
    backgroundColor: statusInfo.bg,
    color: statusInfo.color,
    padding: '3px 7px',
    borderRadius: '8px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    border: `1px solid ${statusInfo.color}20`,
    boxShadow: `0 2px 4px ${statusInfo.color}15`,
    marginLeft: '29px', // Augmente la marge gauche pour déplacer le badge à droite
    marginRight: '8px', // Conserve la marge droite
    marginTop: '-3px' // Déplace le badge légèrement en haut
  }}
>
  <span>{statusInfo.text}</span>
</div>
</div>
      </div>
    </div>
    </>
  );
};

export default DeliveryCard;
