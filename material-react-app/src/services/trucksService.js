// Service API pour camions - 100% dynamique depuis votre backend MongoDB
// Compatible avec vos endpoints existants

import axios from 'axios';

class TrucksService {
  constructor() {
    // Configuration de votre API backend
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    // Configuration axios avec credentials pour votre backend
    this.axiosConfig = {
      withCredentials: true,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    console.log('🚚 TrucksService initialisé - Backend:', this.baseURL);
  }

  // Récupérer tous les camions depuis votre backend MongoDB
  async getAllTrucks() {
    try {
      console.log('🔄 Récupération camions depuis MongoDB...');
      
      // Utilise votre endpoint existant
      const response = await axios.get(`${this.baseURL}/trip/details`, this.axiosConfig);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur API backend');
      }

      const trucks = response.data.trucks || [];
      console.log(`✅ ${trucks.length} camions récupérés depuis MongoDB`);
      
      return trucks;
    } catch (error) {
      console.error('❌ Erreur récupération camions:', error.message);
      
      if (error.response?.status === 404) {
        throw new Error('Aucun camion trouvé en base MongoDB - Ajoutez des données');
      }
      
      throw new Error(`Backend MongoDB inaccessible: ${error.message}`);
    }
  }

  // Récupérer un camion spécifique
  async getTruckById(truckId) {
    try {
      console.log(`🔍 Recherche camion ${truckId} dans MongoDB...`);
      
      const response = await axios.get(`${this.baseURL}/api/trucks/${truckId}`, this.axiosConfig);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Camion non trouvé');
      }

      console.log(`✅ Camion ${truckId} trouvé dans MongoDB`);
      return response.data.truck;
    } catch (error) {
      console.error(`❌ Erreur récupération camion ${truckId}:`, error.message);
      
      if (error.response?.status === 404) {
        return null; // Camion non trouvé
      }
      
      throw error;
    }
  }

  // Récupérer itinéraire complet depuis votre backend
  async getTruckRoute(startCoords, endCoords) {
    try {
      console.log('🗺️ Récupération itinéraire depuis backend...');
      
      // Utilise votre endpoint existant de routes
      const response = await axios.get(
        `${this.baseURL}/trip/route?start=${endCoords[1]},${endCoords[0]}&end=${startCoords[1]},${startCoords[0]}`,
        this.axiosConfig
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur calcul itinéraire');
      }

      console.log('✅ Itinéraire récupéré depuis backend');
      return response.data.route || [];
    } catch (error) {
      console.error('❌ Erreur récupération itinéraire:', error.message);
      throw new Error(`Impossible de récupérer l'itinéraire: ${error.message}`);
    }
  }

  // Récupérer routes optimisées OSRM
  async getOptimizedRoute(truckId, startCoords, endCoords, waypoints = []) {
    try {
      console.log(`🛣️ Optimisation route OSRM pour ${truckId}...`);
      
      const response = await axios.post(`${this.baseURL}/api/routes/optimize`, {
        truckId: truckId,
        start: startCoords,
        end: endCoords,
        waypoints: waypoints,
        options: {
          profile: 'truck',
          steps: true,
          geometries: 'geojson'
        }
      }, this.axiosConfig);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur optimisation OSRM');
      }

      console.log(`✅ Route OSRM optimisée pour ${truckId}`);
      return response.data.route;
    } catch (error) {
      console.error(`❌ Erreur optimisation OSRM ${truckId}:`, error.message);
      throw error;
    }
  }

  // Récupérer routes pour plusieurs camions
  async getTruckRoutes(truckIds = []) {
    try {
      console.log('🗺️ Récupération routes multiples...');
      
      const response = await axios.get(`${this.baseURL}/api/routes`, {
        ...this.axiosConfig,
        params: { trucks: truckIds.join(',') }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur récupération routes');
      }

      console.log(`✅ Routes récupérées pour ${truckIds.length} camions`);
      return response.data.routes || {};
    } catch (error) {
      console.error('❌ Erreur récupération routes multiples:', error.message);
      return {};
    }
  }

  // Récupérer alertes dynamiques depuis MongoDB
  async getDynamicAlerts() {
    try {
      console.log('🚨 Récupération alertes depuis MongoDB...');
      
      const response = await axios.get(`${this.baseURL}/api/alerts`, this.axiosConfig);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur récupération alertes');
      }

      const alerts = response.data.alerts || [];
      console.log(`✅ ${alerts.length} alertes récupérées depuis MongoDB`);
      
      return alerts;
    } catch (error) {
      console.error('❌ Erreur récupération alertes:', error.message);
      throw new Error(`Alertes MongoDB inaccessibles: ${error.message}`);
    }
  }

  // Récupérer données temps réel (positions actuelles)
  async getRealTimeData() {
    try {
      console.log('⚡ Récupération données temps réel...');
      
      const response = await axios.get(`${this.baseURL}/api/trucks/real-time`, this.axiosConfig);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur données temps réel');
      }

      console.log('✅ Données temps réel récupérées');
      return {
        trucks: response.data.trucks || [],
        lastUpdate: response.data.lastUpdate,
        simulatorStatus: response.data.simulatorStatus
      };
    } catch (error) {
      console.error('❌ Erreur données temps réel:', error.message);
      throw error;
    }
  }

  // Envoyer commande à un camion via backend
  async sendTruckCommand(truckId, command, params = {}) {
    try {
      console.log(`📤 Envoi commande ${command} vers ${truckId}...`);
      
      const response = await axios.post(`${this.baseURL}/api/trucks/${truckId}/command`, {
        command: command,
        ...params
      }, this.axiosConfig);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur commande camion');
      }

      console.log(`✅ Commande ${command} envoyée vers ${truckId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur commande ${command} vers ${truckId}:`, error.message);
      throw error;
    }
  }

  // Récupérer historique d'un camion
  async getTruckHistory(truckId, range = '24h') {
    try {
      console.log(`📊 Récupération historique ${truckId}...`);
      
      const response = await axios.get(`${this.baseURL}/api/trucks/${truckId}/history`, {
        ...this.axiosConfig,
        params: { range }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur historique');
      }

      console.log(`✅ Historique ${truckId} récupéré`);
      return response.data.history || [];
    } catch (error) {
      console.error(`❌ Erreur historique ${truckId}:`, error.message);
      throw error;
    }
  }

  // Vérifier l'état du backend MongoDB
  async checkBackendHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/health`, this.axiosConfig);
      
      return {
        healthy: response.data.success || false,
        database: response.data.services?.database || 'unknown',
        api: response.data.services?.api || 'unknown',
        simulator: response.data.services?.simulator || 'unknown'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        url: this.baseURL
      };
    }
  }

  // Vérifier connectivité MongoDB spécifiquement
  async checkMongoConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/health/database`, this.axiosConfig);
      
      return {
        connected: response.data.success || false,
        type: response.data.type || 'unknown',
        status: response.data.status || 'unknown'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Obtenir configuration du service
  getConfiguration() {
    return {
      baseURL: this.baseURL,
      withCredentials: this.axiosConfig.withCredentials,
      timeout: this.axiosConfig.timeout
    };
  }
}

// Instance singleton
const trucksService = new TrucksService();

// Test initial de connexion backend
trucksService.checkBackendHealth().then(health => {
  if (health.healthy) {
    console.log('✅ Backend MongoDB accessible');
  } else {
    console.error('❌ Backend MongoDB inaccessible:', health.error);
  }
});

export default trucksService;
