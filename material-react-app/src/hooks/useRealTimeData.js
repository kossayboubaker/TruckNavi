// Hook React personnalisé pour la gestion des données temps réel
import { useState, useEffect, useCallback, useRef } from 'react';
import realtimeService from '../services/realtimeService';
import trucksService from '../services/trucksService';
import dynamicRoutesService from '../services/dynamicRoutesService';
import mandatoryBreaksService from '../services/mandatoryBreaksService';

export const useRealTimeData = (options = {}) => {
  const {
    autoConnect = true,
    enableTrucks = true,
    enableRoutes = true,
    enableAlerts = true,
    enableWeather = false,
    enableTraffic = false,
    updateInterval = 5000 // 5 secondes par défaut
  } = options;

  // États des données
  const [trucks, setTrucks] = useState([]);
  const [routes, setRoutes] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [weather, setWeather] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [mandatoryBreaks, setMandatoryBreaks] = useState({});
  
  // États de connexion
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Références pour éviter les effets de bord
  const unsubscribersRef = useRef([]);
  const intervalRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Initialiser la connexion
  useEffect(() => {
    if (autoConnect && !isInitializedRef.current) {
      initializeConnection();
      isInitializedRef.current = true;
    }

    return () => {
      cleanup();
    };
  }, [autoConnect]);

  // Initialiser tous les services
  const initializeConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Connexion Socket.IO (non bloquante)
      try {
        realtimeService.connect();
      } catch (socketError) {
        console.warn('⚠️ Socket.IO non disponible:', socketError.message);
      }

      // Initialiser le service de routes dynamiques
      try {
        dynamicRoutesService.initialize();
      } catch (routesError) {
        console.warn('⚠️ Service routes non disponible:', routesError.message);
      }

      // Charger les données initiales (avec fallback intégré)
      await loadInitialData();

      // Configurer les abonnements temps réel (si socket disponible)
      setupRealtimeSubscriptions();

      // Démarrer les mises à jour périodiques
      if (updateInterval > 0) {
        startPeriodicUpdates();
      }

      console.log('✅ Connexion temps réel initialisée');
    } catch (err) {
      console.error('❌ Erreur initialisation temps réel:', err);

      // Ne pas échouer complètement, utiliser mode dégradé
      const fallbackData = getFallbackData();
      setTrucks(fallbackData.trucks);
      setAlerts(fallbackData.alerts);
      setError('Mode démo - Backend non accessible');
    } finally {
      setIsLoading(false);
    }
  }, [updateInterval, loadInitialData]);

  // Données de fallback en cas d'erreur backend
  const getFallbackData = () => ({
    trucks: [
      {
        id: 'demo-001',
        truck_id: 'DEMO-001',
        position: [36.8065, 10.1815],
        speed: 45,
        state: 'En Route',
        vehicle: 'Demo Truck',
        cargo: 'Demo Cargo',
        status: 'demo-mode',
        route_progress: 35,
        driver: { name: 'Demo Driver' },
        last_update: new Date().toISOString(),
        fuel_level: 75
      }
    ],
    alerts: [
      {
        id: 'demo-alert',
        type: 'info',
        title: 'Mode Démo',
        description: 'Backend non connecté - données de démonstration',
        severity: 'info',
        position: [36.8065, 10.1815],
        timestamp: new Date().toISOString()
      }
    ]
  });

  // Charger les données initiales depuis l'API avec fallback
  const loadInitialData = useCallback(async () => {
    try {
      const promises = [];

      if (enableTrucks) {
        promises.push(trucksService.getAllTrucks());
      }

      if (enableAlerts) {
        promises.push(trucksService.getDynamicAlerts());
      }

      const results = await Promise.allSettled(promises);

      // Vérifier si au moins une API fonctionne
      const hasSuccessfulCall = results.some(result => result.status === 'fulfilled');

      if (!hasSuccessfulCall) {
        console.warn('⚠️ Aucune API accessible - utilisation des données de fallback');
        const fallbackData = getFallbackData();
        setTrucks(fallbackData.trucks);
        setAlerts(fallbackData.alerts);
        setError('Backend non accessible - mode démo activé');
        setLastUpdate(new Date().toISOString());
        return;
      }

      // Traiter les résultats
      let resultIndex = 0;

      if (enableTrucks) {
        if (results[resultIndex]?.status === 'fulfilled') {
          const trucksData = results[resultIndex].value;
          setTrucks(trucksData);

          // Générer les routes pour ces camions
          if (enableRoutes && trucksData.length > 0) {
            try {
              const routesData = await dynamicRoutesService.generateAllRoutes(trucksData);
              setRoutes(routesData);
            } catch (routeError) {
              console.warn('⚠️ Erreur génération routes:', routeError);
              setRoutes({});
            }
          }
        } else {
          console.warn('⚠️ API camions échouée, utilisation fallback');
          setTrucks(getFallbackData().trucks);
        }
        resultIndex++;
      }

      if (enableAlerts) {
        if (results[resultIndex]?.status === 'fulfilled') {
          setAlerts(results[resultIndex].value);
        } else {
          console.warn('⚠️ API alertes échouée, utilisation fallback');
          setAlerts(getFallbackData().alerts);
        }
      }

      setLastUpdate(new Date().toISOString());
      setError(null); // Réinitialiser l'erreur si succès
      console.log('✅ Données initiales chargées');
    } catch (err) {
      console.error('❌ Erreur chargement données initiales:', err);

      // Utiliser les données de fallback en cas d'erreur globale
      const fallbackData = getFallbackData();
      setTrucks(fallbackData.trucks);
      setAlerts(fallbackData.alerts);
      setError('Connexion backend impossible - mode démo');
    }
  }, [enableTrucks, enableRoutes, enableAlerts]);

  // Configurer les abonnements temps réel
  const setupRealtimeSubscriptions = useCallback(() => {
    // État de connexion
    const connectionUnsub = realtimeService.subscribe('connection', (data) => {
      setConnectionStatus(data.status);
      if (data.status === 'error') {
        setError(data.error || 'Erreur de connexion');
      } else if (data.status === 'connected' || data.status === 'reconnected') {
        setError(null);
      }
    });
    unsubscribersRef.current.push(connectionUnsub);

    // Positions des camions
    if (enableTrucks) {
      const trucksUnsub = realtimeService.subscribe('truck_positions', (data) => {
        if (data.trucks) {
          setTrucks(prevTrucks => {
            // Fusionner avec les données existantes
            const updatedTrucks = [...prevTrucks];
            
            data.trucks.forEach(updatedTruck => {
              const index = updatedTrucks.findIndex(t => t.truck_id === updatedTruck.truck_id);
              if (index >= 0) {
                // Mettre à jour le camion existant
                updatedTrucks[index] = { ...updatedTrucks[index], ...updatedTruck };
              } else {
                // Ajouter nouveau camion
                updatedTrucks.push(updatedTruck);
              }
            });
            
            return updatedTrucks;
          });
          
          setLastUpdate(data.timestamp || new Date().toISOString());
        }
      });
      unsubscribersRef.current.push(trucksUnsub);
    }

    // Mises à jour de routes
    if (enableRoutes) {
      const routesUnsub = realtimeService.subscribe('routes', (routeData) => {
        setRoutes(prevRoutes => ({
          ...prevRoutes,
          [routeData.truckId]: {
            ...prevRoutes[routeData.truckId],
            ...routeData
          }
        }));
      });
      unsubscribersRef.current.push(routesUnsub);
    }

    // Nouvelles alertes
    if (enableAlerts) {
      const alertsUnsub = realtimeService.subscribe('alerts', (alertData) => {
        setAlerts(prevAlerts => {
          // Éviter les doublons
          const exists = prevAlerts.find(a => a.id === alertData.id);
          if (exists) return prevAlerts;
          
          return [alertData, ...prevAlerts].slice(0, 50); // Limiter à 50 alertes
        });
      });
      unsubscribersRef.current.push(alertsUnsub);
    }

    // Données météo
    if (enableWeather) {
      const weatherUnsub = realtimeService.subscribe('weather', (weatherData) => {
        setWeather(weatherData.weather || []);
      });
      unsubscribersRef.current.push(weatherUnsub);
    }

    // Données de trafic
    if (enableTraffic) {
      const trafficUnsub = realtimeService.subscribe('traffic', (trafficData) => {
        setTraffic(trafficData.incidents || []);
      });
      unsubscribersRef.current.push(trafficUnsub);
    }

    // Statistiques
    const statsUnsub = realtimeService.subscribe('statistics', (statsData) => {
      setStatistics(statsData.statistics || {});
    });
    unsubscribersRef.current.push(statsUnsub);

    console.log('✅ Abonnements temps réel configurés');
  }, [enableTrucks, enableRoutes, enableAlerts, enableWeather, enableTraffic]);

  // Mises à jour périodiques (fallback)
  const startPeriodicUpdates = useCallback(() => {
    intervalRef.current = setInterval(async () => {
      try {
        // Vérifier la connexion Socket.IO
        const status = realtimeService.getConnectionStatus();
        if (!status.connected) {
          console.log('🔄 Tentative reconnexion Socket.IO...');
          try {
            realtimeService.reconnect();
          } catch (reconnectError) {
            console.warn('⚠️ Reconnexion Socket.IO échouée');
          }
        }

        // Mise à jour périodique des données critiques (si backend accessible)
        if (enableTrucks) {
          try {
            const realTimeData = await trucksService.getRealTimeData();
            if (realTimeData.trucks) {
              setTrucks(realTimeData.trucks);
              setLastUpdate(realTimeData.lastUpdate);

              // Réinitialiser l'erreur si succès
              setError(null);
            }
          } catch (updateError) {
            console.warn('⚠️ Mise à jour données échouée:', updateError.message);
            // Ne pas changer l'état d'erreur si on est déjà en mode dégradé
          }
        }

        // Nettoyage du cache des routes
        try {
          dynamicRoutesService.clearExpiredCache();
        } catch (cacheError) {
          console.warn('⚠️ Nettoyage cache échoué');
        }

      } catch (err) {
        console.error('❌ Erreur mise à jour périodique:', err);
        // Ne pas bloquer l'application, continuer en mode dégradé
      }
    }, updateInterval);
  }, [updateInterval, enableTrucks]);

  // Nettoyage
  const cleanup = useCallback(() => {
    // Désabonner tous les listeners
    unsubscribersRef.current.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        console.error('❌ Erreur désabonnement:', error);
      }
    });
    unsubscribersRef.current = [];

    // Arrêter les mises à jour périodiques
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Déconnecter Socket.IO
    realtimeService.disconnect();
    
    isInitializedRef.current = false;
    console.log('🧹 Nettoyage connexion temps réel terminé');
  }, []);

  // Actions pour composants
  const actions = {
    // Forcer une mise à jour
    refresh: useCallback(async () => {
      setIsLoading(true);
      try {
        await loadInitialData();
      } finally {
        setIsLoading(false);
      }
    }, [loadInitialData]),

    // Reconnexion manuelle
    reconnect: useCallback(() => {
      realtimeService.reconnect();
    }, []),

    // Envoyer commande à un camion
    sendTruckCommand: useCallback(async (truckId, command, params = {}) => {
      return realtimeService.sendTruckCommand(truckId, command, params);
    }, []),

    // Démarrer le simulateur
    startSimulator: useCallback(async (config = {}) => {
      return realtimeService.startSimulator(config);
    }, []),

    // Arrêter le simulateur
    stopSimulator: useCallback(async () => {
      return realtimeService.stopSimulator();
    }, []),

    // Vérifier latence
    checkLatency: useCallback(async () => {
      return realtimeService.checkLatency();
    }, []),

    // Rejoindre une room
    joinRoom: useCallback((roomName) => {
      return realtimeService.joinRoom(roomName);
    }, []),

    // Quitter une room
    leaveRoom: useCallback((roomName) => {
      return realtimeService.leaveRoom(roomName);
    }, []),

    // ** NOUVEAU : Actions pour les pauses obligatoires **
    startMandatoryBreak: useCallback(async (truckId, breakId) => {
      return dynamicRoutesService.startMandatoryBreak(truckId, breakId);
    }, []),

    endMandatoryBreak: useCallback(async (truckId, breakId) => {
      return dynamicRoutesService.endMandatoryBreak(truckId, breakId);
    }, []),

    checkBreakRequirement: useCallback((truckId) => {
      return dynamicRoutesService.checkBreakRequirement(truckId);
    }, []),

    getBreakStatistics: useCallback((driverId = null) => {
      return mandatoryBreaksService.getBreakStatistics(driverId);
    }, []),

    getScheduledBreaks: useCallback((truckId) => {
      return mandatoryBreaksService.getScheduledBreaks(truckId);
    }, [])
  };

  // États dérivés
  const derivedData = {
    activeTrucks: trucks.filter(truck => truck.state === 'En Route' || truck.state === 'in-progress'),
    pausedTrucks: trucks.filter(truck => truck.state === 'Paused' || truck.state === 'Break'),
    completedTrucks: trucks.filter(truck => truck.state === 'At Destination' || truck.state === 'completed'),
    activeAlerts: alerts.filter(alert => alert.severity === 'warning' || alert.severity === 'danger'),
    isConnected: connectionStatus === 'connected',
    hasError: !!error,
    dataFreshness: lastUpdate ? Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000) : null
  };

  return {
    // Données
    trucks,
    routes,
    alerts,
    weather,
    traffic,
    statistics,
    
    // États
    connectionStatus,
    lastUpdate,
    isLoading,
    error,
    
    // Actions
    ...actions,
    
    // Données dérivées
    ...derivedData
  };
};

// Hook spécialisé pour un camion spécifique
export const useRealTimeTruck = (truckId) => {
  const [truck, setTruck] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!truckId) return;

    let unsubscribers = [];

    const loadTruckData = async () => {
      try {
        setIsLoading(true);
        const truckData = await trucksService.getTruckById(truckId);
        setTruck(truckData);

        if (truckData) {
          const routeData = await dynamicRoutesService.generateRouteWithProgress(
            truckId, 
            truckData.route_progress || 0
          );
          setRoute(routeData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Charger données initiales
    loadTruckData();

    // Abonnements temps réel
    const trucksUnsub = realtimeService.subscribe('truck_positions', (data) => {
      if (data.trucks) {
        const updatedTruck = data.trucks.find(t => t.truck_id === truckId);
        if (updatedTruck) {
          setTruck(updatedTruck);
        }
      }
    });
    unsubscribers.push(trucksUnsub);

    const routesUnsub = realtimeService.subscribe('routes', (routeData) => {
      if (routeData.truckId === truckId) {
        setRoute(prevRoute => ({ ...prevRoute, ...routeData }));
      }
    });
    unsubscribers.push(routesUnsub);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [truckId]);

  return {
    truck,
    route,
    isLoading,
    error,
    refresh: () => loadTruckData()
  };
};

export default useRealTimeData;
