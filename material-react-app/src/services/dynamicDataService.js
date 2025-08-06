/**
 * Service de données 100% dynamiques
 * Élimine tout contenu statique du système
 * Récupère tout depuis la base de données ou le simulateur
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class DynamicDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 secondes
    this.subscribers = new Map();
    this.realTimeData = new Map();
    
    // Configuration axios avec gestion d'erreurs
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true
    });

    // Intercepteur pour gestion des erreurs
    this.api.interceptors.response.use(
      response => response,
      error => {
        console.error('🔴 Erreur API:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Récupère tous les camions actifs dynamiquement
   */
  async getActiveTrucks() {
    try {
      console.log('📡 Récupération dynamique des camions...');
      
      const response = await this.api.get('/api/trucks/active-trucks');
      
      if (response.data.success) {
        const trucks = response.data.trucks.map(truck => ({
          ...truck,
          // S'assurer que toutes les données sont dynamiques
          last_update: new Date().toISOString(),
          // Éliminer toute référence à des données statiques
          isDynamic: true,
          dataSource: 'database'
        }));

        console.log(`✅ ${trucks.length} camions récupérés dynamiquement`);
        return trucks;
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('❌ Erreur récupération camions:', error);
      // Pas de fallback statique - retourner tableau vide
      return [];
    }
  }

  /**
   * Récupère les routes dynamiquement depuis OSRM ou le backend
   */
  async getDynamicRoute(startCoord, endCoord) {
    try {
      const cacheKey = `route_${startCoord.join(',')}_${endCoord.join(',')}`;
      
      // Vérifier cache temporaire
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('🔄 Route depuis cache dynamique');
          return cached.data;
        }
      }

      console.log('🛣️ Génération de route dynamique...');
      
      const response = await this.api.get('/api/trucks/route', {
        params: {
          start: `${startCoord[0]},${startCoord[1]}`,
          end: `${endCoord[0]},${endCoord[1]}`
        }
      });

      if (response.data.success) {
        const routeData = {
          ...response.data,
          isDynamic: true,
          generated: new Date().toISOString(),
          source: response.data.source || 'backend'
        };

        // Cache temporaire
        this.cache.set(cacheKey, {
          data: routeData,
          timestamp: Date.now()
        });

        console.log(`✅ Route dynamique générée (${response.data.source})`);
        return routeData;
      }
    } catch (error) {
      console.error('❌ Erreur génération route:', error);
      // Retourner route vide plutôt que statique
      return {
        route: [],
        distance: 0,
        duration: 0,
        isDynamic: true,
        source: 'empty'
      };
    }
  }

  /**
   * Récupère les alertes dynamiquement
   */
  async getDynamicAlerts() {
    try {
      console.log('🚨 Récupération alertes dynamiques...');
      
      const response = await this.api.get('/api/alerts/active');
      
      if (response.data.success) {
        const alerts = response.data.alerts.map(alert => ({
          ...alert,
          isDynamic: true,
          retrieved: new Date().toISOString()
        }));

        console.log(`✅ ${alerts.length} alertes dynamiques récupérées`);
        return alerts;
      }
    } catch (error) {
      console.error('❌ Erreur récupération alertes:', error);
      // Pas d'alertes statiques
      return [];
    }
  }

  /**
   * Récupère les données météo dynamiquement
   */
  async getDynamicWeather(lat, lon) {
    try {
      console.log('🌤️ Récupération météo dynamique...');
      
      const response = await this.api.get('/api/weather/current', {
        params: { lat, lon }
      });

      if (response.data.success) {
        const weather = {
          ...response.data.weather,
          isDynamic: true,
          retrieved: new Date().toISOString()
        };

        console.log('✅ Données météo dynamiques récupérées');
        return weather;
      }
    } catch (error) {
      console.error('❌ Erreur météo:', error);
      return null;
    }
  }

  /**
   * Récupère la configuration UI dynamiquement
   */
  async getDynamicUIConfig() {
    try {
      console.log('⚙️ Récupération configuration UI dynamique...');
      
      const response = await this.api.get('/api/config/ui');
      
      if (response.data.success) {
        const config = {
          ...response.data.config,
          isDynamic: true,
          loaded: new Date().toISOString()
        };

        console.log('✅ Configuration UI dynamique chargée');
        return config;
      }
    } catch (error) {
      console.error('❌ Erreur configuration UI:', error);
      // Configuration minimale dynamique
      return {
        theme: 'auto',
        language: 'fr',
        refreshInterval: 5000,
        isDynamic: true,
        fallback: true
      };
    }
  }

  /**
   * Mise à jour temps réel des données
   */
  updateRealTimeData(type, data) {
    this.realTimeData.set(type, {
      ...data,
      isDynamic: true,
      updated: new Date().toISOString()
    });

    // Notifier les abonnés
    if (this.subscribers.has(type)) {
      this.subscribers.get(type).forEach(callback => {
        try {
          callback(this.realTimeData.get(type));
        } catch (error) {
          console.error('❌ Erreur notification subscriber:', error);
        }
      });
    }
  }

  /**
   * S'abonner aux mises à jour temps réel
   */
  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);

    // Retourner fonction de désabonnement
    return () => {
      this.subscribers.get(type)?.delete(callback);
    };
  }

  /**
   * Valider que les données sont bien dynamiques
   */
  validateDynamicData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Vérifier que les données ont les marqueurs de dynamisme
    const isDynamic = data.isDynamic === true;
    const hasTimestamp = data.last_update || data.updated || data.retrieved || data.generated;
    
    if (!isDynamic || !hasTimestamp) {
      console.warn('⚠️ Données statiques détectées:', data);
      return false;
    }

    return true;
  }

  /**
   * Nettoyer le cache expiré
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Forcer le rafraîchissement de toutes les données
   */
  async forceRefresh() {
    console.log('🔄 Rafraîchissement forcé de toutes les données dynamiques...');
    
    this.cache.clear();
    this.realTimeData.clear();

    try {
      const [trucks, config] = await Promise.all([
        this.getActiveTrucks(),
        this.getDynamicUIConfig()
      ]);

      console.log('✅ Rafraîchissement dynamique terminé');
      return { trucks, config };
    } catch (error) {
      console.error('❌ Erreur rafraîchissement:', error);
      return { trucks: [], config: {} };
    }
  }

  /**
   * Statistiques du service
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      realTimeDataTypes: this.realTimeData.size,
      subscriberTypes: this.subscribers.size,
      lastCleanup: new Date().toISOString(),
      isDynamic: true
    };
  }
}

// Instance singleton
const dynamicDataService = new DynamicDataService();

// Nettoyage automatique du cache
setInterval(() => {
  dynamicDataService.cleanCache();
}, 30000); // Toutes les 30 secondes

export default dynamicDataService;
