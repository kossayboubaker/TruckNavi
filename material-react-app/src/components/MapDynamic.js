import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import DeliveryList from '../components/DeliveryList/DeliveryList.js';
import MapCanvas from '../components/MapCanvas/MapCanvas.js';
import AdvancedMapControls from '../components/AdvancedMapControls/AdvancedMapControls.js';
import AlertNotifications from '../components/AlertNotifications/AlertNotifications.js';
import DriverChat from '../components/DriverChat/DriverChat.js';
import BreakNotification from '../components/BreakNotification/BreakNotification.js';
import PreventiveAlert from '../components/PreventiveAlert/PreventiveAlert.js';
import roleManager from '../services/roleManager';
import extendedAlertsService from '../services/extendedAlertsService';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';

// Hook pour gestion responsive
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

  const isUltraCompact = dimensions.width < 90 && dimensions.height < 90;
  const isMobile = dimensions.width < 768;
  const isSmallMobile = dimensions.width < 480;

  return { dimensions, isUltraCompact, isMobile, isSmallMobile };
};

const MapDynamic = () => {
  const { dimensions, isUltraCompact, isMobile, isSmallMobile } = useResponsive();
  
  // États principaux
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isAsideOpen, setIsAsideOpen] = useState(!isUltraCompact);
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
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Initialisation de Socket.IO
  useEffect(() => {
    const socketConnection = io(SOCKET_URL, {
      withCredentials: true,
      query: {
        userId: currentUser.id
      }
    });

    socketConnection.on('connect', () => {
      console.log('✅ Socket connecté:', socketConnection.id);
      setConnectionStatus('connected');
      setSocket(socketConnection);
      
      // Rejoindre la room des mises à jour de camions
      socketConnection.emit('request_trucks_data');
    });

    socketConnection.on('disconnect', () => {
      console.log('❌ Socket déconnecté');
      setConnectionStatus('disconnected');
    });

    socketConnection.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket:', error);
      setConnectionStatus('error');
    });

    // Écouter les mises à jour en temps réel
    socketConnection.on('truck_update', handleTruckUpdate);
    socketConnection.on('route_update', handleRouteUpdate);
    socketConnection.on('trucks_list_update', handleTrucksListUpdate);
    socketConnection.on('truck_alert', handleTruckAlert);

    return () => {
      socketConnection.disconnect();
    };
  }, [currentUser.id]);

  // Gestionnaires des mises à jour Socket.IO
  const handleTruckUpdate = (truckData) => {
    console.log('🚛 Mise à jour camion reçue:', truckData.truck_id);
    
    setVisibleTrucks(prevTrucks => {
      return prevTrucks.map(truck => {
        if (truck.truck_id === truckData.truck_id) {
          return {
            ...truck,
            position: truckData.position || truck.position,
            speed: truckData.speed ?? truck.speed,
            bearing: truckData.bearing ?? truck.bearing,
            route_progress: truckData.route_progress ?? truck.route_progress,
            state: truckData.state || truck.state,
            route: truckData.route || truck.route,
            last_update: new Date().toISOString()
          };
        }
        return truck;
      });
    });
    
    setLastUpdate(new Date());
  };

  const handleRouteUpdate = (routeData) => {
    console.log('🛣️ Mise à jour route reçue:', routeData.truck_id);
    
    setVisibleTrucks(prevTrucks => {
      return prevTrucks.map(truck => {
        if (truck.truck_id === routeData.truck_id) {
          return {
            ...truck,
            route: routeData.route || truck.route,
            destinationCoords: routeData.destination_coords || truck.destinationCoords
          };
        }
        return truck;
      });
    });
  };

  const handleTrucksListUpdate = (data) => {
    console.log('📋 Liste camions mise à jour:', data.count);
    if (data.trucks && Array.isArray(data.trucks)) {
      setVisibleTrucks(data.trucks);
      if (data.trucks.length > 0 && !selectedDelivery) {
        setSelectedDelivery(data.trucks[0]);
      }
    }
    setLastUpdate(new Date());
  };

  const handleTruckAlert = (alert) => {
    console.log('🚨 Alerte reçue:', alert.title);
    setAlerts(prev => [...prev, alert]);
  };

  // Fonction pour récupérer les camions depuis l'API
  const fetchTrucksFromAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Récupération des camions depuis l\'API...');
      
      const response = await axios.get(`${API_BASE_URL}/api/trucks/active-trucks`, {
        withCredentials: true,
        timeout: 10000
      });

      if (response.data.success && response.data.trucks) {
        const trucks = response.data.trucks;
        console.log(`✅ ${trucks.length} camions récupérés`);
        
        setVisibleTrucks(trucks);
        
        if (trucks.length > 0 && !selectedDelivery) {
          setSelectedDelivery(trucks[0]);
        }
        
        setLastUpdate(new Date());
      } else {
        throw new Error('Format de réponse invalide');
      }
      
    } catch (err) {
      console.error('❌ Erreur récupération camions:', err);
      setError(`Erreur de chargement: ${err.message}`);
      
      // Retry après 5 secondes en cas d'erreur
      setTimeout(() => {
        if (visibleTrucks.length === 0) {
          fetchTrucksFromAPI();
        }
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Charger les camions au démarrage
  useEffect(() => {
    fetchTrucksFromAPI();

    // Rafraîchissement périodique (toutes les 30 secondes)
    const interval = setInterval(() => {
      if (connectionStatus !== 'connected') {
        fetchTrucksFromAPI();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Fonction pour ajouter un nouveau camion
  const addNewTruck = async (truckData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/trucks/add-truck`, truckData, {
        withCredentials: true
      });

      if (response.data.success) {
        console.log('✅ Nouveau camion ajouté:', response.data.truck.truckId);
        
        // Rafraîchir la liste
        await fetchTrucksFromAPI();
        
        return response.data.truck;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Erreur ajout camion:', error);
      throw error;
    }
  };

  // Gestionnaires d'événements (identiques à la version originale)
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

  const handleMapStyleChange = (style) => {
    setMapStyle(style);
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
      mapInstance.flyTo(alert.position, 15, {
        animate: true,
        duration: 1.5
      });
      setIsAlertsOpen(false);
      setTimeout(() => {
        mapInstance.eachLayer(layer => {
          if (layer.options && layer.options.alertId === alert.id) {
            layer.openPopup();
          }
        });
      }, 1600);
    }
  };

  const handleCloseAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setDeletedAlerts(prev => [...prev, alertId]);
  };

  const handleToggleAlertPanel = () => {
    setIsAlertsOpen(!isAlertsOpen);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

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

    // S'abonner aux mises à jour de ce camion spécifique
    if (socket && delivery.truck_id) {
      socket.emit('subscribe_truck', delivery.truck_id);
    }
  };

  // Interface de chargement
  if (loading && visibleTrucks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground">Chargement des camions...</h2>
          <p className="text-muted-foreground mt-2">
            Connexion: {connectionStatus}
          </p>
          {error && (
            <p className="text-destructive mt-2 text-sm">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isAsideOpen ? 'bg-background' : 'bg-white'} overflow-hidden`}>
      {/* Indicateur de statut en temps réel */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 3000,
        background: connectionStatus === 'connected' ? '#10b981' : 
                   connectionStatus === 'error' ? '#ef4444' : '#f59e0b',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '700',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        {connectionStatus === 'connected' ? '🟢 EN DIRECT' : 
         connectionStatus === 'error' ? '🔴 ERREUR' : '🟡 CONNEXION...'}
      </div>

      {/* Indicateur de rôle */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '120px',
        zIndex: 3000,
        background: currentRole === 'conducteur' ? '#10b981' :
                   currentRole === 'admin' ? '#3b82f6' : '#8b5cf6',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '700',
        textTransform: 'uppercase',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        🎭 {currentRole}
      </div>

      {/* Compteur de camions */}
      <div style={{
        position: 'fixed',
        top: '50px',
        right: '10px',
        zIndex: 3000,
        background: 'rgba(255,255,255,0.9)',
        color: '#1f2937',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        🚛 {visibleTrucks.length} camion{visibleTrucks.length > 1 ? 's' : ''}
        {lastUpdate && (
          <div style={{ fontSize: '8px', color: '#6b7280', marginTop: '2px' }}>
            Mise à jour: {lastUpdate.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
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

      <div className="flex w-full" style={{
        height: isUltraCompact ? '100vh' : 'calc(100vh - 1px)',
        maxHeight: isUltraCompact ? '100vh' : 'calc(100vh - 1px)',
        overflow: 'hidden'
      }}>
        <aside
          className="transition-all duration-300 bg-background border-r border-border flex-shrink-0 overflow-hidden"
          style={{
            width: isAsideOpen ? (
              isUltraCompact ? '200px' :
              isSmallMobile ? '240px' :
              isMobile ? '280px' :
              '320px'
            ) : '0px',
            display: 'block',
            borderWidth: isUltraCompact ? '2px' : '2px'
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
            onAddTruck={addNewTruck}
          />
        </aside>

        <main className={`flex-1 min-w-0 overflow-hidden ${isAsideOpen ? '' : 'w-full'}`}>
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
            isRealTime={connectionStatus === 'connected'}
          />
        </main>

        {/* Bouton Chat Conducteurs */}
        {currentRole === 'conducteur' && (
          <button
            className="chat-toggle-btn"
            onClick={() => setChatOpen(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              zIndex: 1500,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Ouvrir le chat"
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

        {/* Notifications et alertes */}
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

        {/* Bouton pour basculer le panneau */}
        <div style={{
          position: 'fixed',
          top: isUltraCompact ? '2px' : '8px',
          left: isUltraCompact ? '2px' : '8px',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          gap: isUltraCompact ? '2px' : '4px'
        }}>
          <button
            onClick={() => setIsAsideOpen(!isAsideOpen)}
            style={{
              background: isAsideOpen ?
                'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' :
                'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              width: isUltraCompact ? '20px' : isMobile ? '32px' : '38px',
              height: isUltraCompact ? '20px' : isMobile ? '32px' : '38px',
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
              width={isUltraCompact ? '10' : '14'}
              height={isUltraCompact ? '10' : '14'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={isAsideOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Styles CSS */}
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

          .chat-toggle-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.6) !important;
          }

          @media (max-width: 768px) {
            .chat-toggle-btn {
              bottom: 15px !important;
              right: 15px !important;
              width: 56px !important;
              height: 56px !important;
              font-size: 20px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MapDynamic;
