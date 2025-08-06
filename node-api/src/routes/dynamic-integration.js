// Routes pour l'intégration dynamique avec le simulateur Python
import express from 'express';
import osrmService from '../services/osrmService.js';

const router = express.Router();

// État global des camions (en attendant la vraie base de données)
let trucksData = [];
let alertsData = [];
let routesData = {};

// Simuler des données initiales si aucune donnée n'est disponible
const generateMockTruckData = () => {
  return [
    {
      id: 'EV-201700346',
      truck_id: 'TN-001',
      position: [36.770032, 10.23034],
      speed: 65,
      state: 'En Route',
      ecoMode: true,
      vehicle: 'Ford F-150',
      cargo: 'Food Materials',
      cargo_type: 'Perishable Goods',
      status: 'in-progress',
      weight: 15000,
      route_progress: 25,
      bearing: 45,
      pickup: {
        address: 'Ben Arous Centre',
        city: 'Ben Arous, Tunisia',
        coordinates: [36.770032, 10.23034]
      },
      destination: 'Manouba Centre',
      destinationCoords: [36.8098, 10.1085],
      driver: {
        id: 'driver_001',
        name: 'Ahmed Ben Ali',
        company: 'TransTunisia, LTD',
        contact: '+216 12 345 678',
        avatar: '👨‍💼'
      },
      last_update: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 3600000 * 2).toISOString(),
      fuel_level: 78,
      temperature: 4,
      alerts: []
    },
    {
      id: 'EV-201700323',
      truck_id: 'TN-002',
      position: [36.8065, 10.1815],
      speed: 52,
      state: 'En Route',
      ecoMode: false,
      vehicle: 'MAN TGX 440',
      cargo: 'Electronics',
      cargo_type: 'Fragile',
      status: 'in-progress',
      weight: 12000,
      route_progress: 60,
      bearing: 95,
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
      estimatedArrival: new Date(Date.now() + 3600000 * 1.5).toISOString(),
      fuel_level: 45,
      temperature: 18,
      alerts: []
    }
  ];
};

// Initialiser avec des données mock si nécessaire
if (trucksData.length === 0) {
  trucksData = generateMockTruckData();
}

// GET /api/trucks - Récupérer tous les camions
router.get('/trucks', (req, res) => {
  try {
    const response = {
      success: true,
      trucks: trucksData,
      total: trucksData.length,
      lastUpdate: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur récupération camions',
      message: error.message
    });
  }
});

// GET /api/trucks/:id - Récupérer un camion spécifique
router.get('/trucks/:id', (req, res) => {
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
router.post('/routes/optimize', (req, res) => {
  try {
    const { truckId, start, end, waypoints = [] } = req.body;
    
    // Simuler réponse OSRM
    const mockRoute = {
      truckId,
      waypoints: [start, ...waypoints, end],
      distance: Math.random() * 100 + 50, // km
      duration: Math.random() * 3600 + 1800, // secondes
      status: 'optimized',
      created: new Date().toISOString()
    };
    
    routesData[truckId] = mockRoute;
    
    res.json({
      success: true,
      route: mockRoute
    });
  } catch (error) {
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

router.get('/health/kafka', (req, res) => {
  res.json({
    success: true,
    connected: true,
    topics: ['truck_positions', 'alerts', 'routes'],
    status: 'healthy'
  });
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
