import React, { useState, useEffect } from 'react';
// import Header from './components/Header/Header.js';
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


const mockTrucks = [
  {
    id: 'EV-201700346',
    truck_id: 'TN-001',
    position: [36.770032, 10.23034], // Ben Arous (vraie position de départ)
    speed: 65,
    state: 'En Route',
    ecoMode: true,
    vehicle: 'Ford F-150',
    cargo: 'Food Materials',
    cargo_type: 'Perishable Goods',
    status: 'in-progress',
    weight: 15000,
    route_progress: 0, // Commencer à 0%
    bearing: 45,
    route: [
      { latitude: 36.770032, longitude: 10.23034 },
      { latitude: 36.4, longitude: 10.2 },
      { latitude: 35.6, longitude: 10.4 }
    ],
    pickup: {
      address: 'Ben Arous Centre',
      city: 'Ben Arous, Tunisia',
      coordinates: [36.770032, 10.23034]
    },
    destination: 'Manouba Centre',
    destinationCoords: [36.8098, 10.1085], // Manouba Centre (vraie destination)
    driver: {
      id: 'driver_001',
      name: 'Ahmed Ben Ali',
      company: 'TransTunisia, LTD',
      contact: '+216 12 345 678',
      avatar: '👨‍💼'
    },
    last_update: new Date().toISOString(),
    estimatedArrival: new Date(Date.now() + 3600000 * 5).toISOString(),
    fuel_level: 78,
    temperature: 4,
    alerts: []
  },
  {
    id: 'EV-201700323',
    truck_id: 'TN-002',
    position: [36.8065, 10.1815], // Tunis Centre (départ)
    speed: 52,
    state: 'En Route',
    ecoMode: false,
    vehicle: 'MAN TGX 440',
    cargo: 'Food Materials',
    cargo_type: 'Dry Goods',
    status: 'in-progress',
    weight: 12000,
    route_progress: 25, // En cours de route
    bearing: 1,
    route: [
      { latitude: 36.8065, longitude: 10.1815 }, 
      { latitude: 35.8256, longitude: 10.6369 }
    ],
    pickup: {
      address: 'Tunis Centre',
      city: 'Tunis, Tunisia',
      coordinates: [36.8065, 10.1815]
    },
    destination: 'Sousse Port',
    destinationCoords: [35.8256, 10.6369],
    driver: {
      id: 'driver_002',
      name: 'Mohamed Trabelsi',
      company: 'Coastal Logistics',
      contact: '+216 98 765 432',
      avatar: '👨‍🔧'
    },
    last_update: new Date().toISOString(),
    estimatedArrival: new Date().toISOString(),
    fuel_level: 45,
    temperature: 18,
    alerts: []
  },
  {
    id: 'EV-201700321',
    truck_id: 'TN-003',
    position: [36.4098, 10.1398], // Ariana
    speed: 52,
    state: 'En Route',
    ecoMode: true,
    vehicle: 'Volvo FH16',
    cargo: 'Electronics',
    cargo_type: 'Fragile',
    status: 'in-progress',
    weight: 8500,
    route_progress: 0, // Commencer à 0%
    bearing: 180,
    route: [
      { latitude: 36.4098, longitude: 10.1398 },
      { latitude: 36.1, longitude: 10.1 },
      { latitude: 35.6, longitude: 9.8 }
    ],
    pickup: {
      address: 'Zone Industrielle Ariana',
      city: 'Ariana, Tunisia',
      coordinates: [36.4098, 10.1398]
    },
    destination: 'route hammamet',
    destinationCoords: [35.6786, 10.0963],
    driver: {
      id: 'driver_003',
      name: 'Sami Mansouri',
      company: 'TechTransport',
      contact: '+216 55 123 456',
      avatar: '👨‍💻'
    },
    last_update: new Date().toISOString(),
    estimatedArrival: new Date(Date.now() + 3600000 * 3).toISOString(),
    fuel_level: 92,
    temperature: -2,
    alerts: []
  },
  {
    id: 'EV-201700322',
    truck_id: 'TN-004',
    position: [36.7538, 10.2286], // La Goulette
    speed: 28,
    state: 'En Route',
    ecoMode: false,
    vehicle: 'Mercedes Actros',
    cargo: 'Construction Materials',
    cargo_type: 'Heavy Load',
    status: 'in-progress',
    weight: 22000,
    route_progress: 0, // Commencer à 0%
    bearing: 90,
    route: [
      { latitude: 36.7538, longitude: 10.2286 },
      { latitude: 36.8, longitude: 10.6 },
      { latitude: 36.4, longitude: 11.1 }
    ],
    pickup: {
      address: 'Port de la Goulette',
      city: 'La Goulette, Tunisia',
      coordinates: [36.7538, 10.2286]
    },
    destination: 'Nabeul Industrial',
    destinationCoords: [36.4561, 10.7376],
    driver: {
      id: 'driver_004',
      name: 'Karim Bouazizi',
      company: 'Heavy Cargo TN',
      contact: '+216 71 987 654',
      avatar: '👷‍♂️'
    },
    last_update: new Date().toISOString(),
    estimatedArrival: new Date(Date.now() + 3600000 * 6).toISOString(),
    fuel_level: 67,
    temperature: 25,
    alerts: []
  },
  {
    id: 'EV-201700325',
    truck_id: 'TN-005',
    position: [34.7406, 10.7603], // Sfax (départ)
    speed: 35,
    state: 'En Route',
    ecoMode: false,
    vehicle: 'Iveco Stralis',
    cargo: 'Medical Supplies',
    cargo_type: 'Urgent',
    status: 'in-progress',
    weight: 5500,
    route_progress: 0, // Commencer à 0%
    bearing: 0,
    route: [
      { latitude: 34.7406, longitude: 10.7603 },
      { latitude: 34.0, longitude: 10.5 },
      { latitude: 33.8869, longitude: 10.0982 }
    ],
    pickup: {
      address: 'Hôpital Sfax',
      city: 'Sfax, Tunisia',
      coordinates: [34.7406, 10.7603]
    },
    destination: 'Hôpital Gabes',
    destinationCoords: [33.8869, 10.0982],
    driver: {
      id: 'driver_005',
      name: 'Fatma Gharbi',
      company: 'MediTransport',
      contact: '+216 75 456 789',
      avatar: '👩‍⚕️'
    },
    last_update: new Date().toISOString(),
    estimatedArrival: new Date(Date.now() + 3600000 * 2).toISOString(),
    fuel_level: 23,
    temperature: 8,
    alerts: []
  }
];

// Système d'alertes intelligent
const mockAlerts = extendedAlertsService.generateAlertBatch(10); // Plus d'alertes pour tous les camions

// Anciennes alertes commentées
const oldMockAlerts = [
  // {
  //   id: 'alert-001',
  //   type: 'weather',
  //   title: 'Pluie forte sur A1',
  //   description: 'Conditions météo dangereuses détectées',
  //   severity: 'warning',
  //   position: [36.6, 10.2],
  //   affectedRoutes: ['TN-001', 'TN-003'],
  //   timestamp: new Date().toISOString(),
  //   delay: 15,
  //   icon: '🌧️',
  //   location: 'Autoroute A1 - Tunis'
  // },
  // {
  //   id: 'alert-002',
  //   type: 'traffic',
  //   title: 'Embouteillage Sousse',
  //   description: 'Trafic dense, ralentissements importants',
  //   severity: 'warning',
  //   position: [35.8256, 10.6369],
  //   affectedRoutes: ['TN-002'],
  //   timestamp: new Date().toISOString(),
  //   delay: 25,
  //   icon: '🚦',
  //   location: 'Centre-ville Sousse'
  // },
  // {
  //   id: 'alert-003',
  //   type: 'maintenance',
  //   title: 'Maintenance requise TN-005',
  //   description: 'Niveau de carburant critique',
  //   severity: 'danger',
  //   position: [33.8869, 10.0982],
  //   affectedRoutes: ['TN-005'],
  //   timestamp: new Date().toISOString(),
  //   delay: 45,
  //   icon: '⛽',
  //   location: 'Gabes - Station service'
  // },
  // {
  //   id: 'alert-004',
  //   type: 'construction',
  //   title: 'Travaux Route GP1',
  //   description: 'Circulation alternée, ralentissements',
  //   severity: 'info',
  //   position: [36.4, 10.6],
  //   affectedRoutes: ['TN-004'],
  //   timestamp: new Date().toISOString(),
  //   delay: 12,
  //   icon: '��',
  //   location: 'Route GP1 vers Nabeul'
  // }
];

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

const Map = () => {
  const { dimensions, isUltraCompact, isMobile, isSmallMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(mockTrucks[0]);
  const [isAsideOpen, setIsAsideOpen] = useState(!isUltraCompact); // Fermé par défaut en ultra-compact
  const [mapStyle, setMapStyle] = useState('standard');
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [allAlerts, setAllAlerts] = useState([]); // Toutes les alertes (statiques + générées)
  const [deletedAlerts, setDeletedAlerts] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [followTruck, setFollowTruck] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(roleManager.getCurrentRole());
  const [visibleTrucks, setVisibleTrucks] = useState(mockTrucks);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(
    currentRole === 'conducteur'
      ? { id: 'driver_current', name: 'Conducteur Actuel' }
      : { id: 'current_user', name: 'Gestionnaire' }
  );
  const [breakNotifications, setBreakNotifications] = useState([]);
  const [preventiveAlerts, setPreventiveAlerts] = useState([]);

  // Gestion des changements de rôle
  useEffect(() => {
    const handleRoleChange = (event) => {
      setCurrentRole(event.detail.role);
      const filteredTrucks = roleManager.filterTrucks(mockTrucks);
      setVisibleTrucks(filteredTrucks);

      // Mettre à jour currentUser selon le rôle
      if (event.detail.role === 'conducteur') {
        setCurrentUser({ id: 'driver_current', name: 'Conducteur Actuel' });
      } else {
        setCurrentUser({ id: 'current_user', name: 'Gestionnaire' });
      }

      console.log(`🎭 Rôle changé: ${event.detail.role} - ${filteredTrucks.length} camions visibles`);
    };

    // Gestion des notifications de pause
    const handleBreakRequired = (event) => {
      const notification = event.detail;
      setBreakNotifications(prev => {
        // Éviter les doublons
        const exists = prev.find(n => n.truckId === notification.truckId);
        if (exists) return prev;
        return [...prev, notification];
      });
    };

    // Gestion des alertes préventives
    const handlePreventiveAlert = (event) => {
      const alert = event.detail;
      setPreventiveAlerts(prev => {
        // Éviter les doublons
        const exists = prev.find(a => a.id === alert.id && a.truckId === alert.truckId);
        if (exists) return prev;
        return [...prev, alert];
      });
    };

    window.addEventListener('roleChanged', handleRoleChange);
    window.addEventListener('breakRequired', handleBreakRequired);
    window.addEventListener('preventiveAlert', handlePreventiveAlert);

    // Initialiser avec le rôle par défaut
    setVisibleTrucks(roleManager.filterTrucks(mockTrucks));

    return () => {
      window.removeEventListener('roleChanged', handleRoleChange);
      window.removeEventListener('breakRequired', handleBreakRequired);
      window.removeEventListener('preventiveAlert', handlePreventiveAlert);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 100 && isAsideOpen) {
        setIsAsideOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Appliquer au chargement initial
    return () => window.removeEventListener('resize', handleResize);
  }, [isAsideOpen]);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleDeliverySelect = (delivery) => {
    setSelectedDelivery(delivery);

    // Focus sur le camion sélectionné dans la carte avec zoom approprié
    if (mapInstance && delivery && delivery.position) {
      mapInstance.flyTo(delivery.position, Math.max(mapInstance.getZoom(), 14), {
        animate: true,
        duration: 1.8
      });

      // Fermer le panneau latéral sur mobile pour voir la carte
      if (window.innerWidth < 768) {
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
      // Zoomer et centrer sur l'alerte avec animation fluide
      mapInstance.flyTo(alert.position, 15, {
        animate: true,
        duration: 1.5
      });

      // Fermer le panneau d'alertes pour voir la carte
      setIsAlertsOpen(false);

      // Optionnel: ouvrir la popup de l'alerte après navigation
      setTimeout(() => {
        // Trouver le marqueur d'alerte et ouvrir sa popup
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

  // Callback pour recevoir toutes les alertes générées par les APIs améliorées
  const handleAlertsUpdate = (generatedAlerts) => {
    // Filtrer et combiner alertes avec priorité aux temps réel
    const realTimeAlerts = generatedAlerts.filter(alert => alert.realEvent === true);
    const standardAlerts = generatedAlerts.filter(alert => alert.realEvent !== true);

    // Combiner avec priorité: temps réel > API standard > statiques
    const combinedAlerts = [...realTimeAlerts, ...standardAlerts, ...alerts];

    // Supprimer doublons par localisation et type
    const uniqueAlerts = combinedAlerts.filter((alert, index, self) =>
      index === self.findIndex(a =>
        a.location === alert.location &&
        a.type === alert.type
      )
    );

    setAllAlerts(uniqueAlerts);

    // Log détaillé pour debug compteur
    console.log(`🎯 Compteur alertes mis à jour: ${uniqueAlerts.length} total (${realTimeAlerts.length} temps réel + ${standardAlerts.length} standard + ${alerts.length} statiques)`);
  };

  // Simuler des mises à jour d'alertes en temps réel avec service étendu
  useEffect(() => {
    const realTimeInterval = extendedAlertsService.startRealTimeAlertSimulation(
      (newAlert) => {
        console.log(`🚨 Nouvelle alerte temps réel: ${newAlert.title} - ${newAlert.location}`);
        setAlerts(prev => {
          // Éviter les doublons
          const exists = prev.find(a => a.id === newAlert.id);
          if (exists) return prev;
          return [...prev, newAlert];
        });
      },
      30000 // Nouvelle alerte toutes les 30 secondes
    );

    return () => {
      if (realTimeInterval) {
        clearInterval(realTimeInterval);
      }
    };
  }, []);

  return (
    <div className={`min-h-screen ${isAsideOpen ? 'bg-background' : 'bg-white'} overflow-hidden`}>
      {/* <Header /> */}

      {/* Indicateur de rôle (coin supérieur droit) */}
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

      {/* AdvancedMapControls selon votre image */}
      <AdvancedMapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMapStyleChange={handleMapStyleChange}
        mapStyle={mapStyle}
        alertsCount={allAlerts.length} // Compteur basé sur toutes les alertes réelles
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

      {/* Nouveau système AlertNotifications intelligent */}
      <AlertNotifications
        alerts={alerts}
        trucks={visibleTrucks}
        onAlertClick={handleAlertClick}
        onCloseAlert={handleCloseAlert}
        onAlertsUpdate={handleAlertsUpdate}
        isOpen={isAlertsOpen}
        onToggle={handleToggleAlertPanel}
      />

      <div className="flex w-full" style={{
        height: isUltraCompact ? '100vh' : 'calc(100vh - 1px)',
        maxHeight: isUltraCompact ? '100vh' : 'calc(100vh - 1px)',
        overflow: 'hidden'
      }}>
        <aside
         className={`transition-all duration-300 bg-background border-r border-border flex-shrink-0 overflow-hidden`}
  style={{
    width: isAsideOpen ? (
      isUltraCompact ? '200px' :    // Mode ultra-compact
      isSmallMobile ? '240px' :     // Petit mobile
      isMobile ? '280px' :          // Mobile standard
      '320px'                       // Desktop
    ) : '0px',                     // Fermé
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
        <main
          className={`flex-1 min-w-0 overflow-hidden ${isAsideOpen ? '' : 'w-full'}`}
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
          />
        </main>

        {/* Bouton Chat Conducteurs - Seulement pour les conducteurs */}
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
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
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

        {/* Notifications de pause */}
        {breakNotifications.map((notification, index) => (
          <BreakNotification
            key={notification.id}
            notification={notification}
            onClose={() => {
              // Reprendre le camion depuis sa position d'arrêt
              routeGenerator.resumeTruck(notification.truckId);
              setBreakNotifications(prev =>
                prev.filter(n => n.id !== notification.id)
              );
            }}
            onStartBreak={(breakInfo) => {
              console.log(`🚦 Pause commencée pour ${breakInfo.truckId}`);
              // Mettre le camion en pause avec sa position actuelle
              const truck = visibleTrucks.find(t => t.truck_id === breakInfo.truckId);
              if (truck) {
                routeGenerator.pauseTruck(
                  breakInfo.truckId,
                  truck.route_progress,
                  truck.position
                );
              }
            }}
            onBreakEnd={(truckId) => {
              console.log(`▶️ Pause terminée pour ${truckId} - reprise automatique`);
              routeGenerator.resumeTruck(truckId);
            }}
          />
        ))}

        {/* Alertes préventives */}
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
        {/* Boutons de contrôle responsive - adaptatifs */}
        <div style={{
          position: 'fixed',
          top: isUltraCompact ? '2px' : '8px',
          left: isUltraCompact ? '2px' : '8px',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          gap: isUltraCompact ? '2px' : '4px'
        }}>
          {/* Bouton Panneau (bleu) */}
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

          /* Responsive styles for chat button */
          @media (max-width: 768px) {
            .chat-toggle-btn {
              bottom: 15px !important;
              right: 15px !important;
              width: 56px !important;
              height: 56px !important;
              font-size: 20px !important;
            }
          }

          @media (max-width: 480px) {
            .chat-toggle-btn {
              bottom: 12px !important;
              right: 12px !important;
              width: 52px !important;
              height: 52px !important;
              font-size: 18px !important;
            }
          }

          @media (max-width: 320px) {
            .chat-toggle-btn {
              bottom: 10px !important;
              right: 10px !important;
              width: 48px !important;
              height: 48px !important;
              font-size: 16px !important;
            }
          }

          /* Mode ultra-compact pour très petits écrans */
          @media (max-width: 90px) and (max-height: 90px) {
            .chat-toggle-btn {
              bottom: 3px !important;
              right: 3px !important;
              width: 20px !important;
              height: 20px !important;
              font-size: 8px !important;
            }

            /* Interface ultra-compacte */
            .ultra-compact {
              font-size: 6px !important;
              padding: 1px !important;
              margin: 1px !important;
            }

            /* Masquer éléments non essentiels en mode mini */
            .hide-on-mini {
              display: none !important;
            }

            /* Boutons ultra-compacts */
            .compact-button {
              width: 20px !important;
              height: 20px !important;
              font-size: 8px !important;
            }
          }

          /* Mode très petit mobile */
          @media (max-width: 320px) {
            .mobile-compact {
              font-size: 10px !important;
              padding: 2px !important;
            }
          }

          /* Adaptations pour résolution 4K */
          @media (min-width: 3840px) {
            .delivery-card {
              max-width: 300px;
            }

            .statistics-grid {
              grid-template-columns: repeat(6, 1fr);
              gap: 8px;
            }
          }
        `}
      </style>
    </div>
  );
};
export default Map;
