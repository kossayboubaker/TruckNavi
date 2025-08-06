// Hook React personnalisé pour la gestion des données temps réel
import { useState, useEffect, useCallback, useRef } from 'react';
import realtimeService from '../services/realtimeService';
import trucksService from '../services/trucksService';
import dynamicRoutesService from '../services/dynamicRoutesService';

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

      // Connexion Socket.IO
      realtimeService.connect();
      
      // Initialiser le service de routes dynamiques
      dynamicRoutesService.initialize();

      // Charger les données initiales
      await loadInitialData();

      // Configurer les abonnements temps réel
      setupRealtimeSubscriptions();

      // Démarrer les mises à jour périodiques
      if (updateInterval > 0) {
        startPeriodicUpdates();
      }

      console.log('✅ Connexion temps réel initialisée');
    } catch (err) {
      console.error('❌ Erreur initialisation temps réel:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateInterval]);

  // Charger les données initiales depuis l'API
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
      
      // Traiter les résultats
      let resultIndex = 0;
      
      if (enableTrucks && results[resultIndex]?.status === 'fulfilled') {
        const trucksData = results[resultIndex].value;
        setTrucks(trucksData);
        
        // Générer les routes pour ces camions
        if (enableRoutes && trucksData.length > 0) {
          const routesData = await dynamicRoutesService.generateAllRoutes(trucksData);
          setRoutes(routesData);
        }
      }
      resultIndex++;
      
      if (enableAlerts && results[resultIndex]?.status === 'fulfilled') {
        setAlerts(results[resultIndex].value);
      }

      setLastUpdate(new Date().toISOString());
      console.log('✅ Données initiales chargées');
    } catch (err) {
      console.error('❌ Erreur chargement données initiales:', err);
      setError(err.message);
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
        // Vérifier la connexion
        const status = realtimeService.getConnectionStatus();
        if (!status.connected) {
          console.log('🔄 Reconnexion Socket.IO...');
          realtimeService.reconnect();
          return;
        }

        // Mise à jour périodique des données critiques
        if (enableTrucks) {
          const realTimeData = await trucksService.getRealTimeData();
          if (realTimeData.trucks) {
            setTrucks(realTimeData.trucks);
            setLastUpdate(realTimeData.lastUpdate);
          }
        }
        
        // Nettoyage du cache des routes
        dynamicRoutesService.clearExpiredCache();
        
      } catch (err) {
        console.error('❌ Erreur mise à jour périodique:', err);
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
