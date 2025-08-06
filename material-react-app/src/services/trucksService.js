// Service pour récupérer les données de camions depuis le backend Node.js
import axios from 'axios';

class TrucksService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.socket = null;
    this.updateCallbacks = [];
  }

  // Configuration axios avec intercepteurs
  getAxiosConfig() {
    return {
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    };
  }

  // Récupérer tous les camions depuis la base de données
  async getAllTrucks() {
    try {
      const response = await axios.get('/api/trucks', this.getAxiosConfig());
      return response.data.trucks || [];
    } catch (error) {
      console.error('❌ Erreur récupération camions:', error);

      // Vérifier si c'est une erreur de réseau
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('⚠️ Backend non accessible - mode hors ligne');
      }

      // Rejeter l'erreur pour permettre la gestion par le hook
      throw new Error('Backend non accessible');
    }
  }

  // Récupérer un camion spécifique par ID
  async getTruckById(truckId) {
    try {
      const response = await axios.get(`/api/trucks/${truckId}`, this.getAxiosConfig());
      return response.data.truck || null;
    } catch (error) {
      console.error(`❌ Erreur récupération camion ${truckId}:`, error);
      return null;
    }
  }

  // Récupérer les données temps réel du simulateur Python
  async getRealTimeData() {
    try {
      const response = await axios.get('/api/trucks/real-time', this.getAxiosConfig());
      return response.data;
    } catch (error) {
      console.error('❌ Erreur données temps réel:', error);
      return {
        trucks: [],
        lastUpdate: new Date().toISOString(),
        simulatorStatus: 'disconnected'
      };
    }
  }

  // Récupérer les routes dynamiques depuis OSRM/Backend
  async getTruckRoutes(truckIds = []) {
    try {
      const params = truckIds.length > 0 ? { trucks: truckIds.join(',') } : {};
      const response = await axios.get('/api/routes', {
        ...this.getAxiosConfig(),
        params
      });
      return response.data.routes || {};
    } catch (error) {
      console.error('❌ Erreur récupération routes:', error);
      return {};
    }
  }

  // Récupérer route optimisée pour un camion spécifique
  async getOptimizedRoute(truckId, startCoords, endCoords, waypoints = []) {
    try {
      const response = await axios.post('/api/routes/optimize', {
        truckId,
        start: startCoords,
        end: endCoords,
        waypoints
      }, this.getAxiosConfig());
      
      return response.data.route || null;
    } catch (error) {
      console.error(`❌ Erreur route optimisée ${truckId}:`, error);
      return null;
    }
  }

  // Récupérer les alertes dynamiques
  async getDynamicAlerts(filters = {}) {
    try {
      const response = await axios.get('/api/alerts', {
        ...this.getAxiosConfig(),
        params: filters
      });
      return response.data.alerts || [];
    } catch (error) {
      console.error('❌ Erreur récupération alertes:', error);
      throw new Error('API alertes non accessible');
    }
  }

  // Récupérer les données météo temps réel
  async getWeatherData(coordinates = []) {
    try {
      const response = await axios.post('/api/weather', {
        locations: coordinates
      }, this.getAxiosConfig());
      return response.data.weather || [];
    } catch (error) {
      console.error('❌ Erreur données météo:', error);
      return [];
    }
  }

  // Récupérer les informations de trafic
  async getTrafficData(routes = []) {
    try {
      const response = await axios.post('/api/traffic', {
        routes
      }, this.getAxiosConfig());
      return response.data.traffic || [];
    } catch (error) {
      console.error('❌ Erreur données trafic:', error);
      return [];
    }
  }

  // Récupérer les statistiques de flotte
  async getFleetStatistics() {
    try {
      const response = await axios.get('/api/fleet/statistics', this.getAxiosConfig());
      return response.data.statistics || {
        totalTrucks: 0,
        activeTrucks: 0,
        completedDeliveries: 0,
        averageSpeed: 0,
        fuelConsumption: 0
      };
    } catch (error) {
      console.error('❌ Erreur statistiques flotte:', error);
      return {
        totalTrucks: 0,
        activeTrucks: 0,
        completedDeliveries: 0,
        averageSpeed: 0,
        fuelConsumption: 0
      };
    }
  }

  // Enregistrer callback pour mises à jour temps réel
  onTrucksUpdate(callback) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notifier les callbacks des mises à jour
  notifyUpdate(data) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur callback mise à jour:', error);
      }
    });
  }

  // Vérifier la connexion au simulateur Python
  async checkSimulatorConnection() {
    try {
      const response = await axios.get('/api/simulator/status', this.getAxiosConfig());
      return response.data.connected || false;
    } catch (error) {
      console.error('❌ Erreur vérification simulateur:', error);
      return false;
    }
  }

  // Démarrer le simulateur Python
  async startSimulator() {
    try {
      const response = await axios.post('/api/simulator/start', {}, this.getAxiosConfig());
      return response.data.success || false;
    } catch (error) {
      console.error('❌ Erreur démarrage simulateur:', error);
      return false;
    }
  }

  // Arrêter le simulateur Python
  async stopSimulator() {
    try {
      const response = await axios.post('/api/simulator/stop', {}, this.getAxiosConfig());
      return response.data.success || false;
    } catch (error) {
      console.error('❌ Erreur arrêt simulateur:', error);
      return false;
    }
  }

  // Récupérer l'historique des positions
  async getTruckHistory(truckId, timeRange = '24h') {
    try {
      const response = await axios.get(`/api/trucks/${truckId}/history`, {
        ...this.getAxiosConfig(),
        params: { range: timeRange }
      });
      return response.data.history || [];
    } catch (error) {
      console.error(`❌ Erreur historique ${truckId}:`, error);
      return [];
    }
  }

  // Effectuer une commande au camion (pause, reprise, etc.)
  async sendTruckCommand(truckId, command, params = {}) {
    try {
      const response = await axios.post(`/api/trucks/${truckId}/command`, {
        command,
        ...params
      }, this.getAxiosConfig());
      return response.data.success || false;
    } catch (error) {
      console.error(`❌ Erreur commande ${command} pour ${truckId}:`, error);
      return false;
    }
  }
}

// Instance singleton
const trucksService = new TrucksService();

export default trucksService;
