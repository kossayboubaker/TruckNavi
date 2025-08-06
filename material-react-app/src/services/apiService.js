/**
 * Service API centralisé avec gestion d'erreur robuste
 * Évite les crashes d'application lors d'échecs fetch
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultTimeout = 10000; // 10 secondes
  }

  /**
   * Appel API sécurisé avec gestion d'erreur complète
   */
  async safeFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(options.timeout || this.defaultTimeout),
      ...options
    };

    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      const data = await response.json();
      console.log(`✅ API Success: ${url}`);
      
      return {
        success: true,
        data,
        status: response.status
      };

    } catch (error) {
      return this.handleError(error, url, options.fallback);
    }
  }

  /**
   * Gestion centralisée des erreurs API
   */
  handleError(error, url, fallback = null) {
    let errorMessage = 'Erreur inconnue';
    let errorType = 'unknown';

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      errorMessage = 'Timeout - API non accessible';
      errorType = 'timeout';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Réseau non accessible - Vérifiez votre connexion';
      errorType = 'network';
    } else if (error instanceof APIError) {
      errorMessage = error.message;
      errorType = 'api';
    } else {
      errorMessage = error.message || 'Erreur API inconnue';
      errorType = 'general';
    }

    console.warn(`⚠️ API Error (${errorType}): ${url} - ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      errorType,
      data: fallback,
      url
    };
  }

  /**
   * GET request sécurisé
   */
  async get(endpoint, options = {}) {
    return this.safeFetch(endpoint, { 
      method: 'GET', 
      ...options 
    });
  }

  /**
   * POST request sécurisé
   */
  async post(endpoint, data, options = {}) {
    return this.safeFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * PUT request sécurisé
   */
  async put(endpoint, data, options = {}) {
    return this.safeFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * DELETE request sécurisé
   */
  async delete(endpoint, options = {}) {
    return this.safeFetch(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Vérification de santé de l'API
   */
  async healthCheck() {
    try {
      const result = await this.safeFetch('/health', { 
        timeout: 5000,
        fallback: { status: 'unknown' }
      });
      
      return result.success ? 'healthy' : 'unhealthy';
    } catch {
      return 'unhealthy';
    }
  }

  /**
   * Endpoints spécifiques avec fallbacks
   */
  
  // Récupération coordonnées camion
  async getTruckCoordinates(truckId) {
    return this.get(`/api/trucks/coordinates/${truckId}`, {
      fallback: {
        success: false,
        startCoord: [36.8, 10.18], // Tunis par défaut
        endCoord: [36.8, 10.18],
        source: 'fallback'
      },
      timeout: 5000
    });
  }

  // Récupération waypoints camion  
  async getTruckWaypoints(truckId) {
    return this.get(`/api/trucks/waypoints/${truckId}`, {
      fallback: {
        success: false,
        waypoints: [],
        count: 0,
        source: 'fallback'
      },
      timeout: 5000
    });
  }

  // Récupération notifications
  async getNotifications() {
    return this.get('/user/notifications', {
      fallback: [],
      timeout: 8000
    });
  }

  // Auto-login
  async autoLogin() {
    return this.get('/user/auto-login', {
      fallback: null,
      timeout: 8000
    });
  }

  // Camions actifs
  async getActiveTrucks() {
    return this.get('/api/trucks/active-trucks', {
      fallback: {
        success: false,
        trucks: [],
        count: 0
      },
      timeout: 10000
    });
  }
}

/**
 * Classe d'erreur API personnalisée
 */
class APIError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.url = url;
  }
}

// Instance singleton
const apiService = new APIService();

export default apiService;
