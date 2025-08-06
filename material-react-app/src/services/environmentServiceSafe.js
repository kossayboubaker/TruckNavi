// Version sécurisée de l'EnvironmentService pour la production
// Ne fait AUCUN appel réseau pour éviter les erreurs "Failed to fetch"

class SafeEnvironmentService {
  constructor() {
    this.config = {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      apiUrl: process.env.REACT_APP_API_URL || null,
      timeouts: {
        connection: 5000,
        request: 10000
      }
    };
    
    this.backendStatus = {
      isAvailable: false,
      lastCheck: new Date().toISOString(),
      error: 'PRODUCTION_MODE_NO_CHECKS'
    };
    
    console.log('🛡️ SafeEnvironmentService initialisé pour production');
  }

  // Version sécurisée - ne fait AUCUN appel réseau
  async checkBackendAvailability() {
    console.log('🛡️ checkBackendAvailability: Mode sécurisé - Aucun appel réseau');
    return false;
  }

  // Version sécurisée du diagnostic
  async runDiagnostic() {
    console.log('🛡️ runDiagnostic: Mode sécurisé - Pas de diagnostic réseau');
    return this.getStatus();
  }

  // Pas de vérification périodique
  startPeriodicCheck() {
    console.log('🛡️ startPeriodicCheck: Désactivé en mode sécurisé');
    return null;
  }

  // Messages d'erreur sécurisés
  generateUserErrorMessage() {
    return {
      title: 'Mode Production',
      message: 'Application en mode production sans vérifications backend',
      action: 'Configuration backend via REACT_APP_API_URL si nécessaire',
      technical: 'Mode production sécurisé - vérifications désactivées',
      severity: 'info'
    };
  }

  // Configuration sécurisée
  getRequestConfig() {
    if (!this.config.apiUrl) {
      throw new Error('PRODUCTION_NO_BACKEND: Aucun backend configuré en production');
    }
    
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

  // Status sécurisé
  getStatus() {
    return {
      config: this.config,
      backend: this.backendStatus,
      environment: {
        isDev: this.config.isDevelopment,
        isProd: this.config.isProduction,
        host: window.location.hostname,
        protocol: window.location.protocol,
        mode: 'safe'
      }
    };
  }

  // Vérification d'environnement
  isDevelopmentEnvironment() {
    return this.config.isDevelopment || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
}

// Choisir la version appropriée selon l'environnement
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isDev = process.env.NODE_ENV === 'development';

let environmentService;

if (isLocalhost && isDev) {
  // En développement, utiliser la version complète
  console.log('🔧 Chargement EnvironmentService complet pour développement');
  import('./environmentService').then(module => {
    environmentService = module.default;
  });
} else {
  // En production, utiliser la version sécurisée
  console.log('🛡️ Chargement SafeEnvironmentService pour production');
  environmentService = new SafeEnvironmentService();
}

export default environmentService;
