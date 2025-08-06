import React, { useState, useEffect } from 'react';
import DeliveryList from '../components/DeliveryList/DeliveryList.js';
import MapCanvas from '../components/MapCanvas/MapCanvas.js';
import AdvancedMapControls from '../components/AdvancedMapControls/AdvancedMapControls.js';
import AlertNotifications from '../components/AlertNotifications/AlertNotifications.js';
import DriverChat from '../components/DriverChat/DriverChat.js';
import BreakNotification from '../components/BreakNotification/BreakNotification.js';
import PreventiveAlert from '../components/PreventiveAlert/PreventiveAlert.js';

// Services dynamiques - AUCUNE donnée statique
import useRealTimeData from '../hooks/useRealTimeData';
import dynamicRoutesService from '../services/dynamicRoutesService';
import realtimeService from '../services/realtimeService';
import roleManager from '../services/roleManager';

// Hook pour gestion responsive ultra-optimisée
const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Support des très petits écrans jusqu'à 4K
  const isUltraCompact = dimensions.width < 100 && dimensions.height < 100;
  const isMobile = dimensions.width < 768;
  const isSmallMobile = dimensions.width < 480;
  const is4K = dimensions.width >= 3840;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1024;

  return { 
    dimensions, 
    isUltraCompact, 
    isMobile, 
    isSmallMobile, 
    is4K, 
    isTablet 
  };
};

const Map = () => {
  const { dimensions, isUltraCompact, isMobile, isSmallMobile, is4K } = useResponsive();
  
  // États locaux de l'interface
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isAsideOpen, setIsAsideOpen] = useState(!isUltraCompact);
  const [mapStyle, setMapStyle] = useState('standard');
  const [showAlerts, setShowAlerts] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [followTruck, setFollowTruck] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(roleManager.getCurrentRole());
  const [chatOpen, setChatOpen] = useState(false);
  const [breakNotifications, setBreakNotifications] = useState([]);
  const [preventiveAlerts, setPreventiveAlerts] = useState([]);

  // Utilisateur actuel basé sur le rôle
  const [currentUser, setCurrentUser] = useState(
    currentRole === 'conducteur'
      ? { id: 'driver_current', name: 'Conducteur Actuel' }
      : { id: 'current_user', name: 'Gestionnaire' }
  );

  // Hook de données temps réel - TOUTES LES DONNÉES DEPUIS LE BACKEND
  const {
    trucks,
    routes,
    alerts,
    weather,
    traffic,
    connectionStatus,
    lastUpdate,
    isLoading,
    error,
    activeTrucks,
    pausedTrucks,
    activeAlerts,
    isConnected,
    refresh,
    sendTruckCommand,
    startSimulator,
    stopSimulator
  } = useRealTimeData({
    autoConnect: true,
    enableTrucks: true,
    enableRoutes: true,
    enableAlerts: true,
    enableWeather: showWeather,
    enableTraffic: true,
    updateInterval: 5000
  });

  // Camions visibles selon le rôle (filtrage dynamique)
  const visibleTrucks = roleManager.filterTrucks(trucks);

  // Sélection automatique du premier camion disponible
  useEffect(() => {
    if (!selectedDelivery && visibleTrucks.length > 0) {
      setSelectedDelivery(visibleTrucks[0]);
    }
  }, [visibleTrucks, selectedDelivery]);

  // Gestion des changements de rôle
  useEffect(() => {
    const handleRoleChange = (event) => {
      setCurrentRole(event.detail.role);
      
      // Mettre à jour currentUser selon le rôle
      if (event.detail.role === 'conducteur') {
        setCurrentUser({ id: 'driver_current', name: 'Conducteur Actuel' });
      } else {
        setCurrentUser({ id: 'current_user', name: 'Gestionnaire' });
      }

      console.log(`🎭 Rôle changé: ${event.detail.role} - ${visibleTrucks.length} camions visibles`);
    };

    // Gestion des notifications de pause (100% dynamiques)
    const handleBreakRequired = (event) => {
      const notification = event.detail;
      setBreakNotifications(prev => {
        const exists = prev.find(n => n.truckId === notification.truckId);
        if (exists) return prev;
        return [...prev, notification];
      });
    };

    // Gestion des alertes préventives (100% dynamiques)
    const handlePreventiveAlert = (event) => {
      const alert = event.detail;
      setPreventiveAlerts(prev => {
        const exists = prev.find(a => a.id === alert.id && a.truckId === alert.truckId);
        if (exists) return prev;
        return [...prev, alert];
      });
    };

    window.addEventListener('roleChanged', handleRoleChange);
    window.addEventListener('breakRequired', handleBreakRequired);
    window.addEventListener('preventiveAlert', handlePreventiveAlert);

    return () => {
      window.removeEventListener('roleChanged', handleRoleChange);
      window.removeEventListener('breakRequired', handleBreakRequired);
      window.removeEventListener('preventiveAlert', handlePreventiveAlert);
    };
  }, [visibleTrucks.length]);

  // Responsive: fermer panneau automatiquement en ultra-compact
  useEffect(() => {
    if (isUltraCompact && isAsideOpen) {
      setIsAsideOpen(false);
    }
  }, [isUltraCompact, isAsideOpen]);

  // Gestionnaires d'événements
  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleDeliverySelect = (delivery) => {
    setSelectedDelivery(delivery);

    // Focus sur le camion avec zoom intelligent
    if (mapInstance && delivery && delivery.position) {
      const zoomLevel = isUltraCompact ? 12 : isMobile ? 13 : 14;
      mapInstance.flyTo(delivery.position, Math.max(mapInstance.getZoom(), zoomLevel), {
        animate: true,
        duration: 1.8
      });

      // Fermer panneau sur mobile pour voir la carte
      if (isMobile) {
        setIsAsideOpen(false);
      }
    }
  };

  const handleMapStyleChange = (style) => {
    setMapStyle(style);
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  };

  const handleToggleAlerts = () => {
    setShowAlerts(!showAlerts);
  };

  const handleToggleRoutes = (show) => {
    setShowRoutes(show);
  };

  const handleToggleWeather = (show) => {
    setShowWeather(show);
  };

  const handleToggleFollowTruck = (follow) => {
    setFollowTruck(follow);
  };

  const handleAlertClick = (alert) => {
    if (mapInstance && alert.position) {
      const zoomLevel = isUltraCompact ? 13 : 15;
      mapInstance.flyTo(alert.position, zoomLevel, {
        animate: true,
        duration: 1.5
      });

      setIsAlertsOpen(false);

      // Ouvrir popup après navigation
      setTimeout(() => {
        mapInstance.eachLayer(layer => {
          if (layer.options && layer.options.alertId === alert.id) {
            layer.openPopup();
          }
        });
      }, 1600);
    }
  };

  const handleCloseAlert = async (alertId) => {
    // Supprimer l'alerte via l'API (pas localement)
    try {
      const success = await realtimeService.emit('close_alert', { alertId });
      if (success) {
        console.log(`✅ Alerte ${alertId} fermée`);
      }
    } catch (error) {
      console.error(`❌ Erreur fermeture alerte ${alertId}:`, error);
    }
  };

  const handleToggleAlertPanel = () => {
    setIsAlertsOpen(!isAlertsOpen);
  };

  // Gestion des pauses 100% dynamiques
  const handleBreakStart = async (truckId, breakInfo) => {
    try {
      const success = await sendTruckCommand(truckId, 'start_break', breakInfo);
      if (success) {
        console.log(`🚦 Pause commencée pour ${truckId}`);
      }
    } catch (error) {
      console.error(`❌ Erreur pause ${truckId}:`, error);
    }
  };

  const handleBreakEnd = async (truckId) => {
    try {
      const success = await sendTruckCommand(truckId, 'end_break');
      if (success) {
        console.log(`▶️ Pause terminée pour ${truckId} - reprise automatique`);
      }
    } catch (error) {
      console.error(`❌ Erreur fin pause ${truckId}:`, error);
    }
  };

  const handleBreakClose = (notificationId) => {
    setBreakNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  // Styles responsives dynamiques
  const getAsideWidth = () => {
    if (!isAsideOpen) return '0px';
    if (isUltraCompact) return '180px';
    if (isSmallMobile) return '240px';
    if (isMobile) return '280px';
    if (isTablet) return '300px';
    if (is4K) return '400px';
    return '320px';
  };

  const getButtonSize = () => {
    if (isUltraCompact) return { width: '18px', height: '18px', fontSize: '8px' };
    if (isSmallMobile) return { width: '28px', height: '28px', fontSize: '12px' };
    if (isMobile) return { width: '32px', height: '32px', fontSize: '14px' };
    if (is4K) return { width: '48px', height: '48px', fontSize: '18px' };
    return { width: '38px', height: '38px', fontSize: '14px' };
  };

  const buttonSize = getButtonSize();

  // Affichage conditionnel en cas d'erreur critique (pas de données du tout)
  if (error && trucks.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-yellow-50">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">⚠️ Mode Démo</h2>
          <p className="text-yellow-700 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-yellow-600 mb-4">
            <p>• Le backend n'est pas accessible</p>
            <p>• Utilisation des données de démonstration</p>
            <p>• Fonctionnalités limitées</p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            🔄 Réessayer la Connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isAsideOpen ? 'bg-background' : 'bg-white'} overflow-hidden`}>
      {/* Indicateur de rôle et connexion */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '120px',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {/* Indicateur de rôle */}
        <div style={{
          background: currentRole === 'conducteur' ? '#10b981' :
                     currentRole === 'admin' ? '#3b82f6' : '#8b5cf6',
          color: 'white',
          padding: isUltraCompact ? '2px 4px' : '4px 8px',
          borderRadius: '12px',
          fontSize: isUltraCompact ? '8px' : '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          🎭 {currentRole}
        </div>

        {/* Indicateur de connexion */}
        <div style={{
          background: isConnected ? '#10b981' : '#ef4444',
          color: 'white',
          padding: isUltraCompact ? '2px 4px' : '3px 6px',
          borderRadius: '8px',
          fontSize: isUltraCompact ? '6px' : '8px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}
        </div>

        {/* Indicateur de dernière mise à jour */}
        {lastUpdate && (
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: isUltraCompact ? '1px 3px' : '2px 4px',
            borderRadius: '6px',
            fontSize: isUltraCompact ? '5px' : '7px',
            fontWeight: '500'
          }}>
            ⏱️ {new Date(lastUpdate).toLocaleTimeString('fr-FR', {
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        )}
      </div>

      {/* Contrôles avancés de carte */}
      <AdvancedMapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMapStyleChange={handleMapStyleChange}
        mapStyle={mapStyle}
        alertsCount={activeAlerts.length}
        onToggleAlerts={handleToggleAlerts}
        showAlerts={showAlerts}
        selectedTruck={selectedDelivery}
        showRoutes={showRoutes}
        onToggleRoutes={handleToggleRoutes}
        showWeather={showWeather}
        onToggleWeather={handleToggleWeather}
        followTruck={followTruck}
        onToggleFollowTruck={handleToggleFollowTruck}
      />

      {/* Système AlertNotifications 100% dynamique */}
      <AlertNotifications
        alerts={alerts}
        trucks={visibleTrucks}
        onAlertClick={handleAlertClick}
        onCloseAlert={handleCloseAlert}
        isOpen={isAlertsOpen}
        onToggle={handleToggleAlertPanel}
      />

      <div className="flex w-full" style={{
        height: isUltraCompact ? '100vh' : 'calc(100vh - 1px)',
        maxHeight: isUltraCompact ? '100vh' : 'calc(100vh - 1px)',
        overflow: 'hidden'
      }}>
        {/* Panneau latéral responsive */}
        <aside
          className="transition-all duration-300 bg-background border-r border-border flex-shrink-0 overflow-hidden"
          style={{
            width: getAsideWidth(),
            display: 'block',
            borderWidth: isUltraCompact ? '1px' : '2px'
          }}
        >
          <DeliveryList
            deliveries={visibleTrucks}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onSelectDelivery={handleDeliverySelect}
            selectedDelivery={selectedDelivery}
            alerts={roleManager.filterAlerts(alerts, visibleTrucks)}
            isLoading={isLoading}
          />
        </aside>

        {/* Carte principale */}
        <main className={`flex-1 min-w-0 overflow-hidden ${isAsideOpen ? '' : 'w-full'}`}>
          <MapCanvas
            deliveries={visibleTrucks}
            selectedDelivery={selectedDelivery}
            onSelectDelivery={handleDeliverySelect}
            alerts={alerts}
            routes={routes}
            weather={weather}
            traffic={traffic}
            mapStyle={mapStyle}
            onMapReady={setMapInstance}
            showAlerts={showAlerts}
            showRoutes={showRoutes}
            showWeather={showWeather}
            followTruck={followTruck}
            onAlertClick={handleAlertClick}
            isLoading={isLoading}
          />
        </main>

        {/* Chat Conducteurs - Rôle conditionnel */}
        {currentRole === 'conducteur' && (
          <button
            className="chat-toggle-btn"
            onClick={() => setChatOpen(true)}
            style={{
              position: 'fixed',
              bottom: isUltraCompact ? '5px' : '20px',
              right: isUltraCompact ? '5px' : '20px',
              width: isUltraCompact ? '35px' : '60px',
              height: isUltraCompact ? '35px' : '60px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontSize: isUltraCompact ? '12px' : '24px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              zIndex: 1500,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            💬
          </button>
        )}

        {/* Module de Discussion */}
        <DriverChat
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          currentUser={currentUser}
          trucks={visibleTrucks}
        />

        {/* Notifications de pause 100% dynamiques */}
        {breakNotifications.map((notification, index) => (
          <BreakNotification
            key={notification.id}
            notification={notification}
            onClose={() => handleBreakClose(notification.id)}
            onStartBreak={(breakInfo) => handleBreakStart(notification.truckId, breakInfo)}
            onBreakEnd={(truckId) => handleBreakEnd(truckId)}
          />
        ))}

        {/* Alertes préventives 100% dynamiques */}
        {preventiveAlerts.map((alert, index) => (
          <PreventiveAlert
            key={`${alert.id}-${alert.truckId}`}
            alert={alert}
            onClose={() => {
              setPreventiveAlerts(prev =>
                prev.filter(a => !(a.id === alert.id && a.truckId === alert.truckId))
              );
            }}
          />
        ))}

        {/* Boutons de contrôle responsive ultra-adaptatifs */}
        <div style={{
          position: 'fixed',
          top: isUltraCompact ? '2px' : '8px',
          left: isUltraCompact ? '2px' : '8px',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          gap: isUltraCompact ? '1px' : '4px'
        }}>
          {/* Bouton Panneau */}
          <button
            onClick={() => setIsAsideOpen(!isAsideOpen)}
            style={{
              background: isAsideOpen ?
                'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' :
                'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              ...buttonSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              color: 'white'
            }}
            title="Panneau de livraisons"
          >
            <svg
              width={isUltraCompact ? '8' : '14'}
              height={isUltraCompact ? '8' : '14'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={isAsideOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
            </svg>
          </button>

          {/* Bouton Actualiser */}
          <button
            onClick={refresh}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              ...buttonSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: 'white'
            }}
            title="Actualiser les données"
          >
            <svg
              width={isUltraCompact ? '8' : '14'}
              height={isUltraCompact ? '8' : '14'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3v5h5M3 8a9 9 0 1 0 2.12-5.84" />
            </svg>
          </button>
        </div>
      </div>

      {/* Styles responsives ultra-adaptatifs */}
      <style>
        {`
          /* Mode ultra-compact pour très petits écrans */
          @media (max-width: 100px) and (max-height: 100px) {
            .ultra-compact {
              font-size: 6px !important;
              padding: 0px !important;
              margin: 0px !important;
            }
            
            .hide-on-mini {
              display: none !important;
            }
          }

          /* Modes mobiles */
          @media (max-width: 480px) {
            .mobile-compact {
              font-size: 10px !important;
              padding: 2px !important;
            }
          }

          @media (max-width: 320px) {
            .mobile-mini {
              font-size: 8px !important;
              padding: 1px !important;
            }
          }

          /* Mode tablette */
          @media (min-width: 768px) and (max-width: 1024px) {
            .tablet-optimized {
              font-size: 14px !important;
              padding: 8px !important;
            }
          }

          /* Mode 4K */
          @media (min-width: 3840px) {
            .ultra-hd {
              font-size: 18px !important;
              padding: 12px !important;
            }
            
            .delivery-card {
              max-width: 400px;
            }
            
            .statistics-grid {
              grid-template-columns: repeat(8, 1fr);
              gap: 12px;
            }
          }

          /* Animations optimisées */
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

          /* Chat button responsive */
          .chat-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.6);
          }
        `}
      </style>
    </div>
  );
};

export default Map;
