// Routes pour l'intégration dynamique avec le simulateur Python
import express from 'express';
import osrmService from '../services/osrmService.js';
import kafkaService from '../services/kafkaService.js';

const router = express.Router();

// AUCUNE donnée statique - Tout provient de MongoDB
// Import des modèles MongoDB (à adapter selon votre structure)
// import Truck from '../model/truck.js';
// import Alert from '../model/alert.js';
// import Route from '../model/route.js';

// Collections MongoDB (simulées - remplacez par vos vrais modèles)
let trucksData = []; // Sera récupéré depuis MongoDB
let alertsData = []; // Sera récupéré depuis MongoDB
let routesData = {}; // Sera récupéré depuis MongoDB

// Fonction pour récupérer les données depuis MongoDB
const fetchFromMongoDB = async () => {
  try {
    // TODO: Remplacez par vos vraies requêtes MongoDB
    // const trucks = await Truck.find({});
    // const alerts = await Alert.find({});
    // const routes = await Route.find({});

    console.log('🔄 Récupération données depuis MongoDB...');

    // Pour l'instant, on simule que MongoDB est vide
    // Vous devez implémenter vos vraies requêtes ici

    return {
      trucks: [],
      alerts: [],
      routes: {}
    };
  } catch (error) {
    console.error('❌ Erreur récupération MongoDB:', error);
    throw new Error('Échec connexion MongoDB');
  }
};

// Initialiser avec MongoDB au démarrage
(async () => {
  try {
    const data = await fetchFromMongoDB();
    trucksData = data.trucks;
    alertsData = data.alerts;
    routesData = data.routes;
    console.log('✅ Données MongoDB chargées');
  } catch (error) {
    console.error('❌ Impossible de charger MongoDB:', error);
  }
})();

// GET /api/trucks - Récupérer tous les camions depuis MongoDB
router.get('/trucks', async (req, res) => {
  try {
    // TODO: Remplacez par votre vraie requête MongoDB
    // const trucks = await Truck.find({}).populate('driver').populate('route');

    // Pour l'instant, on force la récupération depuis votre API existante
    // Vous devez adapter cette partie selon votre structure

    if (trucksData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun camion trouvé en base de données',
        message: 'La collection trucks de MongoDB est vide',
        source: 'mongodb_required'
      });
    }

    const response = {
      success: true,
      trucks: trucksData,
      total: trucksData.length,
      lastUpdate: new Date().toISOString(),
      source: 'mongodb'
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération camions MongoDB',
      message: error.message
    });
  }
});

// GET /trip/details - Endpoint compatible avec votre API existante
router.get('/trip/details', async (req, res) => {
  try {
    // TODO: Implémentez votre logique de récupération depuis MongoDB
    // const trucks = await Truck.find({}).populate('driver').populate('route');

    if (trucksData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucune donnée de voyage en base',
        message: 'Veuillez ajouter des camions dans MongoDB',
        trucks: []
      });
    }

    res.json({
      success: true,
      trucks: trucksData,
      total: trucksData.length,
      source: 'mongodb'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération détails voyages',
      message: error.message
    });
  }
});

// GET /trip/route - Endpoint pour itinéraires compatibles
router.get('/trip/route', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres start et end requis',
        example: '/trip/route?start=10.1815,36.8065&end=10.23034,36.770032'
      });
    }

    // TODO: Intégrez avec votre service OSRM ou votre API de routes
    const route = await osrmService.calculateRoute(
      start.split(',').map(Number).reverse(), // [lat, lng]
      end.split(',').map(Number).reverse()    // [lat, lng]
    );

    res.json({
      success: true,
      route: route.waypoints || [],
      distance: route.distance || 0,
      duration: route.duration || 0,
      source: 'osrm'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur calcul itinéraire',
      message: error.message
    });
  }
});

// GET /api/trucks/:id - Récupérer un camion spécifique
router.get('/trucks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const truck = trucksData.find(t => t.truck_id === id || t.id === id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Camion non trouvé',
        truckId: id
      });
    }
    
    res.json({
      success: true,
      truck: truck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération camion',
      message: error.message
    });
  }
});

// GET /api/trucks/real-time - Données temps réel du simulateur
router.get('/trucks/real-time', (req, res) => {
  try {
    // Simuler mise à jour des positions (en attendant Python)
    trucksData.forEach(truck => {
      // Simuler petit déplacement
      truck.position[0] += (Math.random() - 0.5) * 0.001;
      truck.position[1] += (Math.random() - 0.5) * 0.001;
      truck.speed = Math.max(0, truck.speed + (Math.random() - 0.5) * 10);
      truck.route_progress = Math.min(100, truck.route_progress + Math.random() * 2);
      truck.last_update = new Date().toISOString();
    });
    
    res.json({
      success: true,
      trucks: trucksData,
      lastUpdate: new Date().toISOString(),
      simulatorStatus: 'active',
      source: 'simulation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur données temps réel',
      message: error.message
    });
  }
});

// GET /api/routes - Récupérer les routes
router.get('/routes', (req, res) => {
  try {
    res.json({
      success: true,
      routes: routesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération routes',
      message: error.message
    });
  }
});

// POST /api/routes/optimize - Optimiser une route via OSRM
router.post('/routes/optimize', async (req, res) => {
  try {
    const { truckId, start, end, waypoints = [], options = {} } = req.body;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Coordonnées de départ et d\'arrivée requises'
      });
    }

    console.log(`🛣️ Optimisation route OSRM pour ${truckId}: ${start} → ${end}`);

    // Calculer la route via OSRM avec profil poids-lourd
    const routeData = await osrmService.calculateRoute(start, end, {
      ...options,
      profile: 'truck', // Forcer le profil poids-lourd
      waypoints: waypoints
    });

    if (!routeData) {
      return res.status(500).json({
        success: false,
        error: 'Impossible de calculer la route'
      });
    }

    // Enrichir avec les données du camion
    const optimizedRoute = {
      truckId,
      ...routeData,
      status: 'optimized',
      created: new Date().toISOString(),
      osrmAvailable: !routeData.isFallback
    };

    // Stocker la route optimisée
    routesData[truckId] = optimizedRoute;

    console.log(`✅ Route OSRM optimisée pour ${truckId}: ${routeData.distance}km, ${routeData.duration}min`);

    res.json({
      success: true,
      route: optimizedRoute,
      osrmStatus: routeData.isFallback ? 'fallback' : 'optimal'
    });
  } catch (error) {
    console.error('❌ Erreur optimisation route OSRM:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur optimisation route',
      message: error.message
    });
  }
});

// GET /api/alerts - Récupérer les alertes
router.get('/alerts', (req, res) => {
  try {
    // Générer quelques alertes dynamiques
    const currentAlerts = [
      {
        id: `alert-${Date.now()}`,
        type: 'traffic',
        title: 'Embouteillage A1',
        description: 'Trafic dense détecté',
        severity: 'warning',
        position: [36.7, 10.2],
        affectedRoutes: ['TN-001'],
        timestamp: new Date().toISOString(),
        location: 'Autoroute A1'
      }
    ];
    
    res.json({
      success: true,
      alerts: currentAlerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération alertes',
      message: error.message
    });
  }
});

// GET /api/weather - Données météo
router.post('/weather', (req, res) => {
  try {
    const { locations } = req.body;
    
    const weatherData = locations.map(location => ({
      location,
      temperature: Math.round(Math.random() * 30 + 10),
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    }));
    
    res.json({
      success: true,
      weather: weatherData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur données météo',
      message: error.message
    });
  }
});

// POST /api/traffic - Données de trafic
router.post('/traffic', (req, res) => {
  try {
    const { routes } = req.body;

    const trafficData = {
      incidents: [
        {
          id: 'traffic-001',
          type: 'congestion',
          location: [36.8, 10.2],
          severity: 'moderate',
          description: 'Ralentissements'
        }
      ],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      traffic: trafficData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur données trafic',
      message: error.message
    });
  }
});

// ** NOUVELLES ROUTES OSRM AVANCÉES **

// POST /api/routes/optimize-multi - Optimiser trajet multi-destinations
router.post('/routes/optimize-multi', async (req, res) => {
  try {
    const { truckId, destinations, options = {} } = req.body;

    if (!destinations || destinations.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Au moins 2 destinations requises'
      });
    }

    console.log(`🔄 Optimisation multi-destinations pour ${truckId}: ${destinations.length} arrêts`);

    const optimizedTrip = await osrmService.optimizeMultipleDestinations(destinations, {
      ...options,
      profile: 'truck',
      roundtrip: options.roundtrip || false
    });

    res.json({
      success: true,
      truckId,
      optimizedTrip,
      destinationsCount: destinations.length,
      savings: {
        // Calculer les économies vs route séquentielle
        estimated: '15-25% temps et carburant économisés'
      }
    });
  } catch (error) {
    console.error('❌ Erreur optimisation multi-destinations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur optimisation multi-destinations',
      message: error.message
    });
  }
});

// POST /api/routes/isochrone - Calculer zone accessible en X temps
router.post('/routes/isochrone', async (req, res) => {
  try {
    const { coordinates, timeMinutes, profile = 'truck' } = req.body;

    if (!coordinates || !timeMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Coordonnées et temps requis'
      });
    }

    const isochrone = await osrmService.calculateIsochrone(coordinates, timeMinutes, { profile });

    res.json({
      success: true,
      isochrone,
      center: coordinates,
      timeMinutes
    });
  } catch (error) {
    console.error('❌ Erreur calcul isochrone:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur calcul isochrone',
      message: error.message
    });
  }
});

// GET /api/osrm/health - Vérifier état OSRM
router.get('/osrm/health', async (req, res) => {
  try {
    const health = await osrmService.checkOSRMHealth();
    res.json({
      success: true,
      osrm: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur vérification OSRM',
      message: error.message
    });
  }
});

// GET /api/osrm/statistics - Statistiques OSRM
router.get('/osrm/statistics', (req, res) => {
  try {
    const stats = osrmService.getStatistics();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur statistiques OSRM',
      message: error.message
    });
  }
});

// GET /api/fleet/statistics - Statistiques de flotte
router.get('/fleet/statistics', (req, res) => {
  try {
    const statistics = {
      totalTrucks: trucksData.length,
      activeTrucks: trucksData.filter(t => t.state === 'En Route').length,
      completedDeliveries: Math.floor(Math.random() * 50),
      averageSpeed: Math.round(trucksData.reduce((acc, t) => acc + t.speed, 0) / trucksData.length),
      fuelConsumption: Math.round(Math.random() * 100 + 200)
    };
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur statistiques',
      message: error.message
    });
  }
});

// POST /api/trucks/:id/command - Envoyer commande à un camion
router.post('/trucks/:id/command', (req, res) => {
  try {
    const { id } = req.params;
    const { command, ...params } = req.body;
    
    const truck = trucksData.find(t => t.truck_id === id || t.id === id);
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Camion non trouvé'
      });
    }
    
    // Traiter la commande
    switch (command) {
      case 'pause':
        truck.state = 'Paused';
        break;
      case 'resume':
        truck.state = 'En Route';
        break;
      case 'start_break':
        truck.state = 'Break';
        break;
      case 'end_break':
        truck.state = 'En Route';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Commande inconnue'
        });
    }
    
    truck.last_update = new Date().toISOString();
    
    res.json({
      success: true,
      message: `Commande ${command} exécutée pour ${id}`,
      truck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur commande camion',
      message: error.message
    });
  }
});

// GET /api/trucks/:id/history - Historique d'un camion
router.get('/trucks/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const { range = '24h' } = req.query;
    
    // Simuler historique
    const history = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 300000).toISOString(), // Toutes les 5 minutes
      position: [36.77 + Math.random() * 0.1, 10.23 + Math.random() * 0.1],
      speed: Math.floor(Math.random() * 80),
      fuel_level: Math.floor(Math.random() * 100)
    }));
    
    res.json({
      success: true,
      truckId: id,
      range,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur historique camion',
      message: error.message
    });
  }
});

// GET /api/simulator/status - État du simulateur
router.get('/simulator/status', (req, res) => {
  res.json({
    success: true,
    connected: true,
    status: 'running',
    trucksCount: trucksData.length,
    lastUpdate: new Date().toISOString()
  });
});

// POST /api/simulator/start - Démarrer simulateur
router.post('/simulator/start', (req, res) => {
  res.json({
    success: true,
    message: 'Simulateur démarré',
    status: 'starting'
  });
});

// POST /api/simulator/stop - Arrêter simulateur
router.post('/simulator/stop', (req, res) => {
  res.json({
    success: true,
    message: 'Simulateur arrêté',
    status: 'stopped'
  });
});

// Routes de santé système
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'online',
      database: 'connected',
      simulator: 'active'
    }
  });
});

router.get('/health/database', (req, res) => {
  res.json({
    success: true,
    connected: true,
    type: 'mongodb',
    status: 'healthy'
  });
});

router.get('/health/kafka', async (req, res) => {
  try {
    const health = await kafkaService.healthCheck();
    const stats = kafkaService.getStatistics();

    res.json({
      success: true,
      kafka: {
        ...health,
        statistics: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur vérification Kafka',
      message: error.message
    });
  }
});

// ** NOUVELLES ROUTES KAFKA **

// POST /api/kafka/publish - Publier message vers Kafka
router.post('/kafka/publish', async (req, res) => {
  try {
    const { topic, message, options = {} } = req.body;

    if (!topic || !message) {
      return res.status(400).json({
        success: false,
        error: 'Topic et message requis'
      });
    }

    const success = await kafkaService.publishMessage(topic, message, options);

    res.json({
      success,
      topic,
      published: success,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur publication Kafka',
      message: error.message
    });
  }
});

// POST /api/kafka/truck-command - Envoyer commande camion via Kafka
router.post('/kafka/truck-command', async (req, res) => {
  try {
    const { truckId, command, params = {} } = req.body;

    if (!truckId || !command) {
      return res.status(400).json({
        success: false,
        error: 'TruckId et commande requis'
      });
    }

    const success = await kafkaService.sendTruckCommand(truckId, command, params);

    res.json({
      success,
      truckId,
      command,
      sent: success,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur commande Kafka',
      message: error.message
    });
  }
});

// POST /api/kafka/alert - Publier alerte via Kafka
router.post('/kafka/alert', async (req, res) => {
  try {
    const alertData = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: 'api',
      ...req.body
    };

    const success = await kafkaService.publishAlert(alertData);

    res.json({
      success,
      alert: alertData,
      published: success
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur publication alerte',
      message: error.message
    });
  }
});

// GET /api/kafka/topics - Lister les topics disponibles
router.get('/kafka/topics', (req, res) => {
  try {
    const topics = kafkaService.TOPICS;
    const stats = kafkaService.getStatistics();

    res.json({
      success: true,
      topics,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération topics',
      message: error.message
    });
  }
});

// POST /api/kafka/create-topics - Créer les topics Kafka
router.post('/kafka/create-topics', async (req, res) => {
  try {
    await kafkaService.createTopics();

    res.json({
      success: true,
      message: 'Topics Kafka créés',
      topics: Object.values(kafkaService.TOPICS)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur création topics',
      message: error.message
    });
  }
});

// Middleware pour mettre à jour les données périodiquement
setInterval(() => {
  // Simuler des mises à jour légères des camions
  trucksData.forEach(truck => {
    if (truck.state === 'En Route') {
      truck.route_progress = Math.min(100, truck.route_progress + Math.random() * 0.5);
      truck.last_update = new Date().toISOString();
    }
  });
}, 10000); // Toutes les 10 secondes

export default router;
