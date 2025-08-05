import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

// Liste des localisations avec leurs coordonnées
const LOCATIONS = {
  "Tunis": [10.18, 36.8],
  "Ariana": [10.11, 36.86],
  "Ben Arous": [10.23, 36.77],
  "Manouba": [10.09, 36.8],
  "Nabeul": [11.02, 36.45],
  "Zaghouan": [10.14, 36.4],
  "Bizerte": [9.87, 37.27],
  "Beja": [9.19, 36.73],
  "Jendouba": [8.79, 36.5],
  "Kef": [8.71, 36.18],
  "Siliana": [9.37, 36.08],
  "Sousse": [10.62, 35.83],
  "Monastir": [10.8, 35.77],
  "Mahdia": [11.06, 35.5],
  "Kairouan": [10.1, 35.67],
  "Kasserine": [8.75, 35.17],
  "Sidi Bouzid": [9.5, 35.03],
  "Sfax": [10.76, 34.74],
  "Gafsa": [8.78, 34.42],
  "Tozeur": [8.13, 33.92],
  "Kebili": [8.97, 33.7],
  "Gabes": [10.1, 33.88],
  "Medenine": [10.5, 33.35],
  "Tataouine": [10.45, 32.93]
};

const Map = ({ socket }) => {
  const { dimensions, isUltraCompact, isMobile, isSmallMobile } = useResponsive();
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

  // Fonction pour valider et formater les coordonnées
  const validateAndFormatCoordinates = (coords) => {
    if (!coords) return [10.18, 36.8]; // Default to Tunis

    // Si c'est un objet {lat, lng} ou {lat, lon}
    if (typeof coords === 'object' && !Array.isArray(coords)) {
      if ('lat' in coords && 'lng' in coords) {
        return [coords.lng, coords.lat];
      }
      if ('lat' in coords && 'lon' in coords) {
        return [coords.lon, coords.lat];
      }
    }

    // Si c'est un tableau [lat, lng] ou [lng, lat]
    if (Array.isArray(coords)) {
      // Vérifier si c'est [lat, lng] ou [lng, lat]
      if (Math.abs(coords[0]) <= 90 && Math.abs(coords[1]) <= 180) {
        return [coords[1], coords[0]]; // Convertir [lat, lng] en [lng, lat]
      }
      return coords; // Déjà au format [lng, lat]
    }

    return [10.18, 36.8]; // Fallback
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
  };
  // Récupérer les données des camions depuis l'API backend
  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/trip/details", {
        withCredentials: true,
      });

      const trucksData = await Promise.all(response.data.map(async (trip) => {
        const position = validateAndFormatCoordinates(trip.position);
        const destinationCoords = trip.destination
          ? LOCATIONS[trip.destination] || [10.18, 36.8]
          : [10.18, 36.8];

        const pickupCoords = trip.startPoint
          ? LOCATIONS[trip.startPoint] || [10.18, 36.8]
          : [10.18, 36.8];

        // Récupérer l'itinéraire complet depuis l'API backend
        let route = [];
        if (trip.startPoint && trip.destination) {
          const start = LOCATIONS[trip.startPoint];
          const end = LOCATIONS[trip.destination];
          if (start && end) {
            try {
              const routeResponse = await axios.get(
                `http://localhost:8080/trip/route?start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`
              );
              route = routeResponse.data.route || [];
            } catch (error) {
              console.error("Erreur lors de la récupération de l'itinéraire:", error);
            }
          }
        }

        return {
          id: trip.id,
          truck_id: trip.truck_id,
          position: position,
          speed: trip.speed || 50,
          fuelConsumption: trip.fuelConsumption || 0,
          state: trip.status || 'En Route',
          ecoMode: trip.ecoMode || false,
          vehicle: trip.vehicle || 'Camion',
          cargo: trip.cargo || 'Marchandises',
          status: trip.status || 'in_progress',
          weight: trip.weight || 0,
          route_progress: trip.routeProgress || 0,
          bearing: trip.bearing || 0,
          route: route.length > 0 ? route : [], // Utiliser l'itinéraire récupéré
          pickup: {
            address: trip.startPoint || 'Départ',
            city: trip.startPoint || 'Ville de départ',
            coordinates: pickupCoords,
          },
          destination: trip.destination || 'Destination',
          destinationCoords: destinationCoords,
          driver: {
            id: trip.driver?.id || 'driver_default',
            name: trip.driver?.name || 'Chauffeur',
            company: trip.driver?.company || 'Transport',
            contact: trip.driver?.contact || '+216 00 000 000',
            avatar: trip.driver?.avatar || '👨‍💼',
          },
          last_update: trip.last_update || new Date().toISOString(),
          estimatedArrival: trip.estimatedArrival || new Date(Date.now() + 2 * 3600000).toISOString(),
          fuel_level: trip.fuel_level || 100,
          temperature: trip.temperature || 20,
          alerts: trip.alerts || [],
        };
      }));

      setVisibleTrucks(trucksData);
      if (trucksData.length > 0 && !selectedDelivery) {
        setSelectedDelivery(trucksData[0]);
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Erreur de chargement des camions:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Écouter les mises à jour en temps réel via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleTruckUpdate = (data) => {
      setVisibleTrucks(prevTrucks => {
        return prevTrucks.map(truck => {
          if (truck.truck_id === data.id) {
            const position = validateAndFormatCoordinates(data.position);

            return {
              ...truck,
              position: position,
              speed: data.speed || truck.speed,
              state: data.state || truck.state,
              route_progress: data.route_progress || truck.route_progress,
              bearing: data.bearing || truck.bearing,
              route: data.route ? data.route.map(validateAndFormatCoordinates) : truck.route,
              last_update: new Date().toISOString()
            };
          }
          return truck;
        });
      });
    };

    const handleRouteUpdate = (data) => {
      setVisibleTrucks(prevTrucks => {
        return prevTrucks.map(truck => {
          if (truck.truck_id === data.truck_id) {
            const route = data.route.map(validateAndFormatCoordinates);
            return {
              ...truck,
              route: route,
              destinationCoords: route.length > 0 ? route[route.length - 1] : truck.destinationCoords
            };
          }
          return truck;
        });
      });
    };

    socket.on('truckUpdate', handleTruckUpdate);
    socket.on('truckRouteUpdate', handleRouteUpdate);

    return () => {
      socket.off('truckUpdate', handleTruckUpdate);
      socket.off('truckRouteUpdate', handleRouteUpdate);
    };
  }, [socket]);

  // Charger les camions à l'initialisation
  useEffect(() => {
    fetchTrucks();

    const interval = setInterval(() => {
      fetchTrucks();
    }, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen ${isAsideOpen ? 'bg-background' : 'bg-white'} overflow-hidden`}>
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
            useDynamicRoutes={true} // Nouvelle prop pour utiliser les routes dynamiques
          />
        </main>

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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
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

        {breakNotifications.map((notification) => (
          <BreakNotification
            key={notification.id}
            notification={notification}
            onClose={() => {
              routeGenerator.resumeTruck(notification.truckId);
              setBreakNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
            onStartBreak={(breakInfo) => {
              console.log(`🚦 Pause commencée pour ${breakInfo.truckId}`);
              const truck = visibleTrucks.find(t => t.truck_id === breakInfo.truckId);
              if (truck) {
                routeGenerator.pauseTruck(breakInfo.truckId, truck.route_progress, truck.position);
              }
            }}
            onBreakEnd={(truckId) => {
              console.log(`▶️ Pause terminée pour ${truckId} - reprise automatique`);
              routeGenerator.resumeTruck(truckId);
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
      </div>
    </div>
  );
};

export default Map;
