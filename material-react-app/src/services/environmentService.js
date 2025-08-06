// Service de détection automatique de l'environnement et configuration
class EnvironmentService {
  constructor() {
    this.config = {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      apiUrl: this.detectAPIUrl(),
      timeouts: {
        connection: 5000,
        request: 10000
      }
    };
    
    this.backendStatus = {
      isAvailable: false,
      lastCheck: null,
      error: null
    };
    
    console.log('🔧 EnvironmentService initialisé:', this.config);
  }

  // Détection automatique de l'URL API
  detectAPIUrl() {
    // Priorité aux variables d'environnement
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // Détection basée sur l'URL actuelle
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    // Si on est sur localhost, essayer le backend local
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    
    // Si on est en production, essayer le même domaine
    const protocol = window.location.protocol;
    return `${protocol}//${currentHost}:8080`;
  }

  // Vérifier si le backend est accessible
  async checkBackendAvailability() {
    try {
      console.log('🔍 Vérification disponibilité backend...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeouts.connection);
      
      // Test simple avec fetch natif
      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      const isAvailable = response.ok;
      this.backendStatus = {
        isAvailable,
        lastCheck: new Date().toISOString(),
        error: isAvailable ? null : `HTTP ${response.status}`
      };
      
      if (isAvailable) {
        console.log('✅ Backend accessible:', this.config.apiUrl);
      } else {
        console.warn('⚠️ Backend répond mais avec erreur:', response.status);
      }
      
      return isAvailable;
    } catch (error) {
      this.backendStatus = {
        isAvailable: false,
        lastCheck: new Date().toISOString(),
        error: this.categorizeError(error)
      };
      
      console.warn('❌ Backend non accessible:', error.message);
      return false;
    }
  }

  // Catégoriser les erreurs pour un diagnostic plus précis
  categorizeError(error) {
    if (error.name === 'AbortError') {
      return 'TIMEOUT - Serveur ne répond pas dans les 5 secondes';
    }
    
    if (error.message.includes('fetch')) {
      return 'NETWORK_ERROR - Impossible de joindre le serveur';
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return 'CONNECTION_REFUSED - Serveur non démarré';
    }
    
    if (error.message.includes('CORS')) {
      return 'CORS_ERROR - Configuration CORS incorrecte';
    }
    
    return `UNKNOWN_ERROR - ${error.message}`;
  }

  // Obtenir la configuration optimale pour les requêtes
  getRequestConfig() {
    return {
      baseURL: this.config.apiUrl,
      timeout: this.config.timeouts.request,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }

  // Générer un message d'erreur utilisateur-friendly
  generateUserErrorMessage() {
    if (!this.backendStatus.error) {
      return 'Backend accessible';
    }
    
    const { error } = this.backendStatus;
    
    if (error.includes('TIMEOUT')) {
      return {
        title: 'Serveur Lent',
        message: 'Le serveur backend met trop de temps à répondre',
        action: 'Vérifiez la performance du serveur',
        technical: error
      };
    }
    
    if (error.includes('NETWORK_ERROR')) {
      return {
        title: 'Serveur Non Accessible',
        message: 'Impossible de se connecter au serveur backend',
        action: 'Vérifiez que le serveur est démarré sur ' + this.config.apiUrl,
        technical: error
      };
    }
    
    if (error.includes('CONNECTION_REFUSED')) {
      return {
        title: 'Serveur Non Démarré',
        message: 'Le serveur backend n\'est pas en cours d\'exécution',
        action: 'Démarrez votre serveur Node.js/Express',
        technical: error
      };
    }
    
    if (error.includes('CORS')) {
      return {
        title: 'Erreur de Configuration',
        message: 'Problème de configuration CORS côté serveur',
        action: 'Vérifiez la configuration CORS de votre backend',
        technical: error
      };
    }
    
    return {
      title: 'Erreur Backend',
      message: 'Problème avec le serveur backend',
      action: 'Consultez les logs du serveur',
      technical: error
    };
  }

  // Vérification périodique du backend
  startPeriodicCheck(interval = 30000) {
    console.log('🔄 Démarrage vérification périodique backend...');
    
    // Vérification immédiate
    this.checkBackendAvailability();
    
    // Puis vérification périodique
    return setInterval(() => {
      this.checkBackendAvailability();
    }, interval);
  }

  // Obtenir le statut actuel
  getStatus() {
    return {
      config: this.config,
      backend: this.backendStatus,
      environment: {
        isDev: this.config.isDevelopment,
        isProd: this.config.isProduction,
        host: window.location.hostname,
        protocol: window.location.protocol
      }
    };
  }

  // Mode diagnostic pour debugging
  async runDiagnostic() {
    console.log('🔧 === DIAGNOSTIC ENVIRONNEMENT ===');
    
    const status = this.getStatus();
    console.log('Configuration:', status.config);
    console.log('Environnement:', status.environment);
    
    // Test de connectivité
    const isAvailable = await this.checkBackendAvailability();
    console.log('Backend disponible:', isAvailable);
    
    if (!isAvailable) {
      const errorMessage = this.generateUserErrorMessage();
      console.log('Erreur détaillée:', errorMessage);
    }
    
    // Test endpoints spécifiques
    if (isAvailable) {
      await this.testSpecificEndpoints();
    }
    
    console.log('🔧 === FIN DIAGNOSTIC ===');
    
    return status;
  }

  // Test des endpoints spécifiques
  async testSpecificEndpoints() {
    const endpoints = [
      '/trip/details',
      '/trip/route',
      '/api/trucks',
      '/api/health'
    ];
    
    console.log('🧪 Test endpoints spécifiques...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`${endpoint}: ${response.ok ? '✅' : '❌'} (${response.status})`);
      } catch (error) {
        console.log(`${endpoint}: ❌ (${error.message})`);
      }
    }
  }
}

// Instance singleton
const environmentService = new EnvironmentService();

// Démarrage automatique de la vérification
if (typeof window !== 'undefined') {
  environmentService.startPeriodicCheck();
  
  // Diagnostic initial en mode développement
  if (environmentService.config.isDevelopment) {
    setTimeout(() => {
      environmentService.runDiagnostic();
    }, 1000);
  }
}

export default environmentService;
