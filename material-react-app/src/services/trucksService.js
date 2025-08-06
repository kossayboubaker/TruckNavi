// Service API pour camions - 100% dynamique depuis votre backend MongoDB
// Compatible avec vos endpoints existants

import axios from 'axios';
import environmentService from './environmentService';

class TrucksService {
  constructor() {
    // Configuration dynamique via environmentService
    this.environmentService = environmentService;
    this.baseURL = environmentService.config.apiUrl;

    // Configuration axios optimisée
    this.axiosConfig = {
      ...environmentService.getRequestConfig(),
      timeout: 15000 // Timeout réduit pour une détection plus rapide
    };

    console.log('🚚 TrucksService initialisé - Backend:', this.baseURL);

    // Vérification immédiate du backend
    this.initializeConnection();
  }

  // Initialisation avec vérification
  async initializeConnection() {
    // En mode sécurisé, ne pas faire de vérifications
    if (this.environmentService.safeMode) {
      console.log('🛡️ TrucksService en mode sécurisé - Vérifications désactivées');
      return;
    }

    // Ne pas tenter de connexion si pas de backend configuré
    if (!this.baseURL) {
      console.log('ℹ️ TrucksService en mode frontend seul - Pas de backend configuré');
      return;
    }

    try {
      const isAvailable = await this.environmentService.checkBackendAvailability();
      if (isAvailable) {
        console.log('✅ Backend MongoDB accessible au démarrage');
      } else {
        console.log('ℹ️ Backend MongoDB non accessible au démarrage');
      }
    } catch (error) {
      // Ne pas logger comme erreur en production
      if (this.environmentService.isDevelopmentEnvironment()) {
        console.warn('⚠️ Erreur vérification backend:', error.message);
      }
    }
  }

  // Récupérer tous les camions depuis votre backend MongoDB
  async getAllTrucks() {
    // Vérifier si backend configuré
    if (!this.baseURL) {
      throw new Error('NO_BACKEND_CONFIGURED: Mode frontend seul - Configurez REACT_APP_API_URL');
    }

    try {
      console.log('🔄 Récupération camions depuis MongoDB...');

      // Vérification préalable de la disponibilité
      const isBackendAvailable = await this.environmentService.checkBackendAvailability();
      if (!isBackendAvailable) {
        const errorInfo = this.environmentService.generateUserErrorMessage();
        throw new Error(errorInfo.technical || 'Backend non accessible');
      }

      // Utilise votre endpoint existant avec gestion d'erreur améliorée
      const response = await axios.get(`${this.baseURL}/trip/details`, {
        ...this.axiosConfig,
        validateStatus: (status) => status < 500 // Accepter les 4xx pour gestion fine
      });

      // Gestion des différents codes de réponse
      if (response.status === 404) {
        throw new Error('ENDPOINT_NOT_FOUND: /trip/details non configuré sur le serveur');
      }

      if (response.status === 400) {
        throw new Error('BAD_REQUEST: Paramètres de requête incorrects');
      }

      if (!response.data?.success && response.status === 200) {
        throw new Error(response.data?.message || 'API backend retourne success: false');
      }

      const trucks = response.data?.trucks || [];
      console.log(`✅ ${trucks.length} camions récupérés depuis MongoDB`);

      return trucks;
    } catch (error) {
      console.error('❌ Erreur récupération camions:', error);

      // Catégorisation détaillée des erreurs
      return this.handleAPIError(error, 'getAllTrucks');
    }
  }

  // Gestion centralisée des erreurs API
  handleAPIError(error, methodName) {
    // Erreurs réseau (fetch failed, timeout, etc.)
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      throw new Error('BACKEND_DOWN: Serveur backend non démarré sur ' + this.baseURL);
    }

    if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
      throw new Error('DNS_ERROR: Impossible de résoudre l\'adresse ' + this.baseURL);
    }

    if (error.message.includes('timeout')) {
      throw new Error('TIMEOUT: Serveur backend trop lent à répondre');
    }

    if (error.message.includes('Network Error')) {
      throw new Error('NETWORK_ERROR: Problème de connectivité réseau');
    }

    // Erreurs HTTP spécifiques
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || 'unknown';

      switch (status) {
        case 404:
          throw new Error(`ENDPOINT_404: ${url} non trouvé sur le serveur`);
        case 500:
          throw new Error(`SERVER_ERROR: Erreur interne du serveur (vérifiez les logs MongoDB)`);
        case 503:
          throw new Error(`SERVICE_UNAVAILABLE: Serveur temporairement indisponible`);
        default:
          throw new Error(`HTTP_${status}: ${error.response.data?.message || 'Erreur serveur'}`);
      }
    }

    // Erreurs de parsing ou autres
    if (error.message.includes('ENDPOINT_NOT_FOUND')) {
      throw new Error('CONFIG_ERROR: Endpoint /trip/details non configuré dans votre backend');
    }

    // Erreur générique
    throw new Error(`API_ERROR: ${error.message} (méthode: ${methodName})`);
  }

  // Test de connectivité backend
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: Backend ne répond pas dans les 5 secondes');
      }

      if (error.message.includes('fetch')) {
        throw new Error('NETWORK_ERROR: Impossible de joindre le backend');
      }

      throw error;
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
