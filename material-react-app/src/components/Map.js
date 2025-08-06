import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import DeliveryList from '../components/DeliveryList/DeliveryList.js';
import MapCanvas from '../components/MapCanvas/MapCanvas.js';
import AdvancedMapControls from '../components/AdvancedMapControls/AdvancedMapControls.js';
import AlertNotifications from '../components/AlertNotifications/AlertNotifications.js';
import DriverChat from '../components/DriverChat/DriverChat.js';
import BreakNotification from '../components/BreakNotification/BreakNotification.js';
import PreventiveAlert from '../components/PreventiveAlert/PreventiveAlert.js';
import roleManager from '../services/roleManager';
import extendedAlertsService from '../services/extendedAlertsService';
import routeGenerator from '../services/routeGenerator';
import dynamicDataService from '../services/dynamicDataService';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Hook ultra-responsive optimisé pour toutes résolutions (4K à <100px)
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

    // Débouncé pour les performances sur redimensionnement
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 16); // 60fps
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Classification détaillée des résolutions
  const width = dimensions.width;
  const height = dimensions.height;
  const minDimension = Math.min(width, height);

  const breakpoints = {
    // Résolutions extrêmes
    isMicro: minDimension < 100,           // <100px (micro devices)
    isTiny: minDimension < 150 && minDimension >= 100,    // 100-150px
    isCompact: minDimension < 250 && minDimension >= 150, // 150-250px

    // Résolutions mobiles
    isSmallMobile: width < 380,            // Petits mobiles
    isMobile: width >= 380 && width < 768, // Mobiles standards
    isTabletPortrait: width >= 768 && width < 1024 && height > width,

    // Résolutions desktop
    isTabletLandscape: width >= 1024 && width < 1366,
    isDesktop: width >= 1366 && width < 1920,
    isLargeDesktop: width >= 1920 && width < 2560,
    is4K: width >= 2560,                   // 4K et plus

    // Ratios d'aspect
    isUltraWide: width / height > 2.1,     // Écrans ultra-larges
    isSquare: Math.abs(width - height) < 100, // Écrans carrés

    // Combinaisons critiques
    isUltraCompact: minDimension < 120,    // Mode ultra-compact
    isPortrait: height > width,
    isLandscape: width > height
  };

  // Calcul de la taille des éléments UI selon la résolution
  const uiScale = {
    fontSizeBase: Math.max(8, Math.min(16, minDimension / 25)),
    iconSize: Math.max(12, Math.min(32, minDimension / 20)),
    buttonSize: Math.max(20, Math.min(48, minDimension / 15)),
    panelWidth: breakpoints.isMicro ? '100%' :
                breakpoints.isTiny ? '90%' :
                breakpoints.isCompact ? '80%' :
                breakpoints.isSmallMobile ? '320px' :
                breakpoints.isMobile ? '380px' : '420px',
    mapControlsSize: breakpoints.isMicro ? 16 :
                     breakpoints.isTiny ? 20 :
                     breakpoints.isCompact ? 24 : 32
  };

  return {
    dimensions,
    ...breakpoints,
    uiScale,
    // Helpers pour conditions complexes
    needsMinimalUI: breakpoints.isMicro || breakpoints.isTiny,
    needsCompactLayout: breakpoints.isCompact || breakpoints.isSmallMobile,
    supportsFullFeatures: !breakpoints.isMicro && !breakpoints.isTiny
  };
};

const Map = () => {
  const {
    dimensions,
    isMicro,
    isTiny,
    isCompact,
    isSmallMobile,
    isMobile,
    isTabletPortrait,
    isDesktop,
    isLargeDesktop,
    is4K,
    isUltraCompact,
    isPortrait,
    needsMinimalUI,
    needsCompactLayout,
    supportsFullFeatures,
    uiScale
  } = useResponsive();
  
  // États principaux
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isAsideOpen, setIsAsideOpen] = useState(
    !needsMinimalUI && !needsCompactLayout && dimensions.width > 1024
  );
  const [mapStyle, setMapStyle] = useState('standard');
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [deletedAlerts, setDeletedAlerts] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [followTruck, setFollowTruck] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(roleManager.getCurrentRole());
  const [visibleTrucks, setVisibleTrucks] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(
    currentRole === 'conducteur'
      ? { id: 'driver_current', name: 'Conducteur Actuel' }
      : { id: 'current_user', name: 'Gestionnaire' }
  );
  const [breakNotifications, setBreakNotifications] = useState([]);
  const [preventiveAlerts, setPreventiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Fonction pour récupérer les camions depuis l'API
  const fetchTrucksFromAPI = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Récupération 100% dynamique des camions...');

      // Utiliser le service de données dynamiques
      const trucks = await dynamicDataService.getActiveTrucks();

      if (trucks.length > 0) {
        console.log(`✅ ${trucks.length} camions dynamiques récupérés`);

        // Valider que toutes les données sont dynamiques
        const validatedTrucks = trucks.filter(truck => {
          const isValid = dynamicDataService.validateDynamicData(truck);
          if (!isValid) {
            console.warn('⚠️ Camion avec données statiques exclu:', truck.id);
          }
          return isValid;
        });

        // Traitement des données 100% dynamiques
        const validTrucks = validatedTrucks.map(truck => ({
          ...truck,
          position: Array.isArray(truck.position) ? truck.position : null,
          speed: truck.speed || 0,
          bearing: truck.bearing || 0,
          route_progress: truck.route_progress || 0,
          state: truck.state || 'Inconnu',
          route: Array.isArray(truck.route) ? truck.route : [],
          last_update: truck.last_update || new Date().toISOString(),
          dataSource: 'dynamic'
        })).filter(truck => truck.position !== null);

        // Mettre à jour le générateur de routes avec les nouvelles donn��es
        validTrucks.forEach(truck => {
          routeGenerator.updateTruckData(truck);
        });

        setVisibleTrucks(validTrucks);

        if (validTrucks.length > 0 && !selectedDelivery) {
          setSelectedDelivery(validTrucks[0]);
        }

        setLastUpdate(new Date());
        console.log(`🎯 ${validTrucks.length} camions dynamiques validés et affichés`);

      } else {
        console.log('ℹ️ Aucun camion actif trouvé');
        setVisibleTrucks([]);
      }

    } catch (err) {
      console.error('❌ Erreur récupération:', err);

      let errorMessage = 'Erreur de connexion à l\'API';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Timeout - API non accessible';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Erreur réseau - Vérifiez que le backend est démarré';
      } else if (err.response) {
        errorMessage = `Erreur API ${err.response.status}: ${err.response.statusText}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Pas de données de démonstration - système 100% dynamique
      console.log('🚫 Aucune donnée statique utilisée - attente de données dynamiques');
      setVisibleTrucks([]);

    } finally {
      setLoading(false);
    }
  };

  // Service 100% dynamique - Aucune donnée de démonstration statique

  // Configuration Socket.IO pour temps réel
  useEffect(() => {
    console.log('🔌 Initialisation Socket.IO...');

    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connecté:', newSocket.id);
      setConnectionStatus('connected');
      setSocket(newSocket);

      // S'abonner aux mises à jour des camions
      newSocket.join('truck_updates');
      console.log('🚛 Abonné aux mises à jour des camions');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO déconnecté');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.IO:', error);
      setConnectionStatus('error');
    });

    // Écouter les mises à jour de camions en temps réel
    newSocket.on('truckUpdate', (truckData) => {
      console.log('🚛 Mise à jour camion reçue:', truckData.id);

      // Valider que les données reçues sont dynamiques
      if (!dynamicDataService.validateDynamicData(truckData)) {
        console.warn('⚠️ Données statiques reçues via Socket.IO, ignorées:', truckData.id);
        return;
      }

      // Mettre à jour le service de données dynamiques
      dynamicDataService.updateRealTimeData('truck', truckData);

      setVisibleTrucks(prevTrucks => {
        const updatedTrucks = prevTrucks.map(truck => {
          if (truck.id === truckData.id || truck.truck_id === truckData.id) {
            return {
              ...truck,
              position: truckData.position,
              speed: truckData.speed || truck.speed,
              bearing: truckData.bearing || truck.bearing,
              route_progress: truckData.route_progress || truck.route_progress,
              state: truckData.state || truck.state,
              route: truckData.route || truck.route,
              last_update: new Date().toISOString(),
              dataSource: 'realtime'
            };
          }
          return truck;
        });

        setLastUpdate(new Date());
        return updatedTrucks;
      });
    });

    // Écouter les mises à jour de routes
    newSocket.on('truckRouteUpdate', (routeData) => {
      console.log('🛣️ Mise à jour route reçue:', routeData.truck_id);

      setVisibleTrucks(prevTrucks => {
        const updatedTrucks = prevTrucks.map(truck => {
          if (truck.id === routeData.truck_id || truck.truck_id === routeData.truck_id) {
            return {
              ...truck,
              route: routeData.route,
              distance: routeData.distance,
              duration: routeData.duration,
              last_update: new Date().toISOString()
            };
          }
          return truck;
        });

        setLastUpdate(new Date());
        return updatedTrucks;
      });
    });

    // Écouter les listes complètes de camions
    newSocket.on('trucks_list_update', (data) => {
      console.log(`📋 Liste complète reçue: ${data.count} camions`);

      if (data.trucks && Array.isArray(data.trucks)) {
        const formattedTrucks = data.trucks.map(truck => ({
          ...truck,
          position: Array.isArray(truck.position) ? truck.position : [36.8, 10.18],
          speed: truck.speed || 0,
          bearing: truck.bearing || 0,
          route_progress: truck.route_progress || 0,
          state: truck.state || 'Arrêté',
          route: Array.isArray(truck.route) ? truck.route : [],
          last_update: truck.last_update || new Date().toISOString()
        }));

        setVisibleTrucks(formattedTrucks);
        setLastUpdate(new Date());

        if (formattedTrucks.length > 0 && !selectedDelivery) {
          setSelectedDelivery(formattedTrucks[0]);
        }
      }
    });

    // Écouter les alertes de camions
    newSocket.on('truck_alert', (alert) => {
      console.log('🚨 Alerte reçue:', alert.title);
      setAlerts(prev => [...prev, {
        ...alert,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString()
      }]);
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Fermeture Socket.IO');
      newSocket.disconnect();
    };
  }, [API_BASE_URL]);

  // Chargement initial et rafraîchissement de secours
  useEffect(() => {
    // Chargement initial
    fetchTrucksFromAPI();

    // Rafraîchissement de secours si Socket.IO ne fonctionne pas
    const interval = setInterval(() => {
      if (connectionStatus !== 'connected') {
        console.log('🔄 Rafraîchissement de secours (Socket.IO déconnecté)');
        fetchTrucksFromAPI();
      }
    }, 45000); // Plus long car Socket.IO gère le temps réel

    return () => clearInterval(interval);
  }, [connectionStatus]);



  // Gestion des changements de rôle
  useEffect(() => {
    const handleRoleChange = (event) => {
      setCurrentRole(event.detail.role);
      const filteredTrucks = roleManager.filterTrucks(visibleTrucks);
      setVisibleTrucks(filteredTrucks);

      if (event.detail.role === 'conducteur') {
        setCurrentUser({ id: 'driver_current', name: 'Conducteur Actuel' });
      } else {
        setCurrentUser({ id: 'current_user', name: 'Gestionnaire' });
      }

      console.log(`🎭 Rôle changé: ${event.detail.role}`);
    };

    window.addEventListener('roleChanged', handleRoleChange);
    return () => window.removeEventListener('roleChanged', handleRoleChange);
  }, [visibleTrucks]);

  // Gestionnaires d'événements
  const handleZoomIn = () => mapInstance?.zoomIn();
  const handleZoomOut = () => mapInstance?.zoomOut();
  const handleMapStyleChange = (style) => setMapStyle(style);
  const handleToggleAlerts = () => setShowAlerts(!showAlerts);
  const handleToggleRoutes = (show) => setShowRoutes(show);
  const handleToggleWeather = (show) => setShowWeather(show);
  const handleToggleFollowTruck = (follow) => setFollowTruck(follow);

  const handleAlertClick = (alert) => {
    if (mapInstance && alert.position) {
      mapInstance.flyTo(alert.position, 15, {
        animate: true,
        duration: 1.5
      });
      setIsAlertsOpen(false);
    }
  };

  const handleCloseAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setDeletedAlerts(prev => [...prev, alertId]);
  };

  const handleToggleAlertPanel = () => setIsAlertsOpen(!isAlertsOpen);
  const handleSearchChange = (term) => setSearchTerm(term);

  const handleDeliverySelect = (delivery) => {
    setSelectedDelivery(delivery);

    if (mapInstance && delivery && delivery.position) {
      mapInstance.flyTo(delivery.position, Math.max(mapInstance.getZoom(), 14), {
        animate: true,
        duration: 1.8
      });

      if (window.innerWidth < 768) {
        setIsAsideOpen(false);
      }
    }

    console.log(`🚛 Camion sélectionné: ${delivery.truck_id}`);
  };

  // Interface de chargement
  if (loading && visibleTrucks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground">Chargement des camions...</h2>
          <p className="text-muted-foreground mt-2">
            Récupération depuis l'API backend...
          </p>
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
              <button
                onClick={fetchTrucksFromAPI}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isAsideOpen ? 'bg-background' : 'bg-white'} overflow-hidden`}
      style={{
        fontSize: `${uiScale.fontSizeBase}px`,
        // Optimisation pour très hautes résolutions
        ...(is4K && {
          '--ui-scale': '1.5',
          fontSize: `${uiScale.fontSizeBase * 1.2}px`
        })
      }}
    >
      {/* Indicateurs de statut adaptatifs selon résolution */}
      {!needsMinimalUI && (
        <>
          {/* Indicateur de statut connexion */}
          <div style={{
            position: 'fixed',
            top: isMicro ? '2px' : isTiny ? '4px' : '10px',
            right: isMicro ? '2px' : isTiny ? '4px' : '10px',
            zIndex: 3000,
            background: connectionStatus === 'connected' ? '#10b981' :
                       connectionStatus === 'error' ? '#ef4444' : '#f59e0b',
            color: 'white',
            padding: isMicro ? '1px 3px' : isTiny ? '2px 4px' : '4px 8px',
            borderRadius: isMicro ? '4px' : isTiny ? '6px' : '12px',
            fontSize: `${Math.max(6, uiScale.fontSizeBase * 0.8)}px`,
            fontWeight: '700',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: isMicro ? 'none' : 'block' // Masquer sur micro-écrans
          }}>
            {isTiny ? (connectionStatus === 'connected' ? '🟢' : connectionStatus === 'error' ? '🔴' : '🟡') :
             (connectionStatus === 'connected' ? '🟢 TEMPS RÉEL' :
              connectionStatus === 'error' ? '🔴 SOCKET ERREUR' : '🟡 CONNEXION...')}
          </div>

          {/* Indicateur de rôle - Adaptatif */}
          {supportsFullFeatures && !isCompact && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: isMobile ? '80px' : '150px',
              zIndex: 3000,
              background: currentRole === 'conducteur' ? '#10b981' :
                         currentRole === 'admin' ? '#3b82f6' : '#8b5cf6',
              color: 'white',
              padding: isTiny ? '2px 4px' : '4px 8px',
              borderRadius: isTiny ? '6px' : '12px',
              fontSize: `${Math.max(6, uiScale.fontSizeBase * 0.8)}px`,
              fontWeight: '700',
              textTransform: 'uppercase',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {isMobile ? currentRole[0].toUpperCase() : `🎭 ${currentRole}`}
            </div>
          )}
        </>
      )}

      {/* Compteur de camions - Toujours visible mais adaptatif */}
      <div style={{
        position: 'fixed',
        top: isMicro ? '2px' : isTiny ? '20px' : needsMinimalUI ? '30px' : '50px',
        right: isMicro ? '2px' : isTiny ? '4px' : '10px',
        zIndex: 3000,
        background: 'rgba(255,255,255,0.95)',
        color: '#1f2937',
        padding: isMicro ? '2px 4px' : isTiny ? '4px 6px' : '8px 12px',
        borderRadius: isMicro ? '4px' : isTiny ? '6px' : '8px',
        fontSize: `${Math.max(8, uiScale.fontSizeBase)}px`,
        fontWeight: '600',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        minWidth: isMicro ? '40px' : 'auto'
      }}>
        {isMicro ? `${visibleTrucks.length}🚛` :
         isTiny ? `${visibleTrucks.length} 🚛` :
         `🚛 ${visibleTrucks.length} camion${visibleTrucks.length > 1 ? 's' : ''}`}

        {lastUpdate && !needsMinimalUI && (
          <div style={{
            fontSize: `${Math.max(6, uiScale.fontSizeBase * 0.7)}px`,
            color: '#6b7280',
            marginTop: '2px'
          }}>
            MAJ: {lastUpdate.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              ...(supportsFullFeatures && { second: '2-digit' })
            })}
          </div>
        )}
      </div>

      <AdvancedMapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMapStyleChange={handleMapStyleChange}
        mapStyle={mapStyle}
        alertsCount={allAlerts.length}
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

      <AlertNotifications
        alerts={alerts}
        trucks={visibleTrucks}
        onAlertClick={handleAlertClick}
        onCloseAlert={handleCloseAlert}
        isOpen={isAlertsOpen}
        onToggle={handleToggleAlertPanel}
      />

      <div
        className={needsMinimalUI ? "block" : "flex"}
        style={{
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Panneau latéral ultra-adaptatif */}
        {!needsMinimalUI && (
          <aside
            className="transition-all duration-300 bg-background border-r border-border flex-shrink-0 overflow-hidden"
            style={{
              width: isAsideOpen ? (
                isMicro ? '90%' :
                isTiny ? '85%' :
                isCompact ? '75%' :
                isSmallMobile ? uiScale.panelWidth :
                isMobile ? '320px' :
                isTabletPortrait ? '380px' :
                isDesktop ? '420px' :
                isLargeDesktop ? '480px' :
                is4K ? '600px' : '420px'
              ) : '0px',
              display: 'block',
              borderWidth: needsCompactLayout ? '0.5px' : '1px',
              // Position absolue sur micro-écrans pour overlay
              ...(isMicro || isTiny) && isAsideOpen && {
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100vh',
                zIndex: 2000,
                boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
              }
            }}
          >
            <DeliveryList
              deliveries={visibleTrucks}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onSelectDelivery={handleDeliverySelect}
              selectedDelivery={selectedDelivery}
              alerts={roleManager.filterAlerts(allAlerts, visibleTrucks)}
              loading={loading}
              error={error}
              onRefresh={fetchTrucksFromAPI}
              // Props pour adaptation UI
              isCompactMode={needsCompactLayout}
              isMicroMode={needsMinimalUI}
              uiScale={uiScale}
            />
          </aside>
        )}

        <main
          className={`${needsMinimalUI || !isAsideOpen ? 'w-full' : 'flex-1'} min-w-0 overflow-hidden`}
          style={{
            height: '100vh',
            position: 'relative'
          }}
        >
          <MapCanvas
            deliveries={visibleTrucks}
            selectedDelivery={selectedDelivery}
            onSelectDelivery={handleDeliverySelect}
            alerts={alerts}
            allAlerts={allAlerts}
            deletedAlerts={deletedAlerts}
            mapStyle={mapStyle}
            onMapReady={setMapInstance}
            showAlerts={showAlerts}
            showRoutes={showRoutes}
            showWeather={showWeather}
            followTruck={followTruck}
            onAlertClick={handleAlertClick}
            useDynamicRoutes={true}
            isRealTime={!error}
            // Props pour adaptation UI
            dimensions={dimensions}
            isCompactMode={needsCompactLayout}
            isMicroMode={needsMinimalUI}
            uiScale={uiScale}
            responsiveBreakpoints={{
              isMicro,
              isTiny,
              isCompact,
              isMobile,
              isDesktop,
              is4K
            }}
          />
        </main>

        {/* Chat pour conducteurs - Adaptatif */}
        {currentRole === 'conducteur' && supportsFullFeatures && (
          <button
            className="chat-toggle-btn"
            onClick={() => setChatOpen(true)}
            style={{
              position: 'fixed',
              bottom: isMicro ? '4px' : isTiny ? '8px' : isCompact ? '12px' : '20px',
              right: isMicro ? '4px' : isTiny ? '8px' : isCompact ? '12px' : '20px',
              width: `${Math.max(32, uiScale.buttonSize)}px`,
              height: `${Math.max(32, uiScale.buttonSize)}px`,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontSize: `${Math.max(16, uiScale.iconSize)}px`,
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              zIndex: 1500,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Chat conducteurs"
          >
            💬
          </button>
        )}

        <DriverChat
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          currentUser={currentUser}
          trucks={visibleTrucks}
        />

        {/* Notifications */}
        {breakNotifications.map((notification) => (
          <BreakNotification
            key={notification.id}
            notification={notification}
            onClose={() => {
              setBreakNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
          />
        ))}

        {preventiveAlerts.map((alert) => (
          <PreventiveAlert
            key={`${alert.id}-${alert.truckId}`}
            alert={alert}
            onClose={() => {
              setPreventiveAlerts(prev => prev.filter(a => a.id !== alert.id || a.truckId !== alert.truckId));
            }}
          />
        ))}

        {/* Bouton panneau ultra-adaptatif */}
        {!needsMinimalUI && (
          <div style={{
            position: 'fixed',
            top: isMicro ? '2px' : isTiny ? '4px' : isCompact ? '6px' : '8px',
            left: isMicro ? '2px' : isTiny ? '4px' : isCompact ? '6px' : '8px',
            zIndex: 3000
          }}>
            <button
              onClick={() => setIsAsideOpen(!isAsideOpen)}
              style={{
                background: isAsideOpen ?
                  'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' :
                  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: isMicro ? '1px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: `${Math.max(20, uiScale.buttonSize)}px`,
                height: `${Math.max(20, uiScale.buttonSize)}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'white'
              }}
              title={`${isAsideOpen ? 'Masquer' : 'Afficher'} le panneau`}
            >
              <svg
                width={Math.max(8, uiScale.iconSize * 0.7)}
                height={Math.max(8, uiScale.iconSize * 0.7)}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d={isAsideOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          /* Styles ultra-responsifs pour toutes résolutions */

          /* Chat button responsive */
          .chat-toggle-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.6) !important;
          }

          /* Micro écrans (<100px) */
          @media (max-width: 100px), (max-height: 100px) {
            .chat-toggle-btn {
              bottom: 2px !important;
              right: 2px !important;
              width: 20px !important;
              height: 20px !important;
              font-size: 10px !important;
            }
          }

          /* Tiny écrans (100-150px) */
          @media (min-width: 100px) and (max-width: 150px) {
            .chat-toggle-btn {
              bottom: 4px !important;
              right: 4px !important;
              width: 24px !important;
              height: 24px !important;
              font-size: 12px !important;
            }
          }

          /* Compact écrans (150-250px) */
          @media (min-width: 150px) and (max-width: 250px) {
            .chat-toggle-btn {
              bottom: 6px !important;
              right: 6px !important;
              width: 28px !important;
              height: 28px !important;
              font-size: 14px !important;
            }
          }

          /* Mobiles standards */
          @media (min-width: 380px) and (max-width: 768px) {
            .chat-toggle-btn {
              bottom: 15px !important;
              right: 15px !important;
              width: 48px !important;
              height: 48px !important;
              font-size: 18px !important;
            }
          }

          /* Desktop standards */
          @media (min-width: 1366px) and (max-width: 1920px) {
            .chat-toggle-btn {
              bottom: 20px !important;
              right: 20px !important;
              width: 60px !important;
              height: 60px !important;
              font-size: 24px !important;
            }
          }

          /* Large Desktop */
          @media (min-width: 1920px) and (max-width: 2560px) {
            .chat-toggle-btn {
              bottom: 24px !important;
              right: 24px !important;
              width: 72px !important;
              height: 72px !important;
              font-size: 28px !important;
            }
          }

          /* 4K et ultra-haute résolution */
          @media (min-width: 2560px) {
            .chat-toggle-btn {
              bottom: 32px !important;
              right: 32px !important;
              width: 96px !important;
              height: 96px !important;
              font-size: 36px !important;
            }
          }

          /* Optimisations performance pour micro-écrans */
          @media (max-width: 150px) {
            * {
              transform: none !important;
              transition: none !important;
              animation: none !important;
            }

            .transition-all {
              transition: none !important;
            }
          }

          /* Scrollbars ultra-fines pour petits écrans */
          @media (max-width: 250px) {
            ::-webkit-scrollbar {
              width: 2px;
            }

            ::-webkit-scrollbar-track {
              background: rgba(0,0,0,0.1);
            }

            ::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.3);
              border-radius: 2px;
            }
          }

          /* Optimisations pour écrans ultra-larges */
          @media (min-aspect-ratio: 21/10) {
            .aside-panel {
              max-width: 25vw !important;
            }
          }

          /* Mode portrait étroit */
          @media (orientation: portrait) and (max-width: 480px) {
            .panel-overlay {
              backdrop-filter: blur(8px);
              background: rgba(0,0,0,0.3);
            }
          }

          /* Optimisations tactiles pour petits écrans */
          @media (max-width: 380px) {
            button, .clickable {
              min-height: 32px !important;
              min-width: 32px !important;
            }
          }

          /* Haute densité pixel (Retina, etc.) */
          @media (-webkit-min-device-pixel-ratio: 2) {
            .high-dpi-icons {
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Map;
