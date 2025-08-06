// Script de test pour l'intégration complète du système dynamique
const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';
const PYTHON_SIMULATOR_URL = process.env.REACT_APP_PYTHON_SIMULATOR_URL || 'http://localhost:5000';

class IntegrationTester {
  constructor() {
    this.results = {
      backend: false,
      simulator: false,
      socket: false,
      database: false,
      kafka: false,
      apis: {
        trucks: false,
        routes: false,
        alerts: false,
        realtime: false
      }
    };
    this.socket = null;
  }

  // Test de connexion au backend Node.js
  async testBackendConnection() {
    try {
      console.log('🔍 Test connexion backend Node.js...');
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('✅ Backend Node.js: CONNECTÉ');
        this.results.backend = true;
        return true;
      }
    } catch (error) {
      console.log('❌ Backend Node.js: DÉCONNECTÉ');
      console.log(`   Erreur: ${error.message}`);
      return false;
    }
  }

  // Test de connexion au simulateur Python
  async testPythonSimulator() {
    try {
      console.log('🔍 Test connexion simulateur Python...');
      const response = await axios.get(`${PYTHON_SIMULATOR_URL}/status`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('✅ Simulateur Python: ACTIF');
        this.results.simulator = true;
        return true;
      }
    } catch (error) {
      console.log('❌ Simulateur Python: INACTIF');
      console.log(`   Erreur: ${error.message}`);
      return false;
    }
  }

  // Test de connexion Socket.IO
  async testSocketConnection() {
    return new Promise((resolve) => {
      console.log('🔍 Test connexion Socket.IO...');
      
      this.socket = io(SOCKET_URL, {
        timeout: 5000,
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO: CONNECTÉ');
        this.results.socket = true;
        resolve(true);
      });

      this.socket.on('connect_error', (error) => {
        console.log('❌ Socket.IO: ERREUR DE CONNEXION');
        console.log(`   Erreur: ${error.message}`);
        resolve(false);
      });

      setTimeout(() => {
        if (!this.results.socket) {
          console.log('❌ Socket.IO: TIMEOUT');
          resolve(false);
        }
      }, 5000);
    });
  }

  // Test des APIs REST
  async testAPIs() {
    console.log('🔍 Test des APIs REST...');

    // Test API Camions
    try {
      const trucksResponse = await axios.get(`${BASE_URL}/api/trucks`, { timeout: 5000 });
      if (trucksResponse.status === 200) {
        console.log(`✅ API Camions: ${trucksResponse.data.trucks?.length || 0} camions trouvés`);
        this.results.apis.trucks = true;
      }
    } catch (error) {
      console.log('❌ API Camions: ERREUR');
      console.log(`   ${error.response?.status}: ${error.response?.statusText || error.message}`);
    }

    // Test API Routes
    try {
      const routesResponse = await axios.get(`${BASE_URL}/api/routes`, { timeout: 5000 });
      if (routesResponse.status === 200) {
        console.log(`✅ API Routes: ${Object.keys(routesResponse.data.routes || {}).length} routes disponibles`);
        this.results.apis.routes = true;
      }
    } catch (error) {
      console.log('❌ API Routes: ERREUR');
      console.log(`   ${error.response?.status}: ${error.response?.statusText || error.message}`);
    }

    // Test API Alertes
    try {
      const alertsResponse = await axios.get(`${BASE_URL}/api/alerts`, { timeout: 5000 });
      if (alertsResponse.status === 200) {
        console.log(`✅ API Alertes: ${alertsResponse.data.alerts?.length || 0} alertes actives`);
        this.results.apis.alerts = true;
      }
    } catch (error) {
      console.log('❌ API Alertes: ERREUR');
      console.log(`   ${error.response?.status}: ${error.response?.statusText || error.message}`);
    }

    // Test API Temps Réel
    try {
      const realtimeResponse = await axios.get(`${BASE_URL}/api/trucks/real-time`, { timeout: 5000 });
      if (realtimeResponse.status === 200) {
        console.log(`✅ API Temps Réel: Données simulateur disponibles`);
        this.results.apis.realtime = true;
      }
    } catch (error) {
      console.log('❌ API Temps Réel: ERREUR');
      console.log(`   ${error.response?.status}: ${error.response?.statusText || error.message}`);
    }
  }

  // Test des données temps réel via Socket.IO
  async testRealtimeData() {
    if (!this.socket || !this.results.socket) {
      console.log('❌ Test temps réel: Socket.IO non connecté');
      return false;
    }

    return new Promise((resolve) => {
      console.log('🔍 Test réception données temps réel...');
      
      let dataReceived = false;
      
      // Écouter les mises à jour de positions
      this.socket.on('truck_positions_update', (data) => {
        console.log(`✅ Données temps réel reçues: ${data.trucks?.length || 0} camions`);
        dataReceived = true;
        resolve(true);
      });

      // Demander des données de test
      this.socket.emit('request_data', { type: 'truck_positions' });

      // Timeout après 10 secondes
      setTimeout(() => {
        if (!dataReceived) {
          console.log('❌ Test temps réel: Aucune donnée reçue');
          resolve(false);
        }
      }, 10000);
    });
  }

  // Test de base de données (via API)
  async testDatabase() {
    try {
      console.log('🔍 Test connexion base de données...');
      const response = await axios.get(`${BASE_URL}/api/health/database`, { timeout: 5000 });
      
      if (response.status === 200 && response.data.connected) {
        console.log('✅ Base de données: CONNECTÉE');
        this.results.database = true;
        return true;
      } else {
        console.log('❌ Base de données: DÉCONNECTÉE');
        return false;
      }
    } catch (error) {
      console.log('❌ Base de données: ERREUR');
      console.log(`   ${error.response?.status}: ${error.response?.statusText || error.message}`);
      return false;
    }
  }

  // Test Kafka (via API)
  async testKafka() {
    try {
      console.log('🔍 Test connexion Kafka...');
      const response = await axios.get(`${BASE_URL}/api/health/kafka`, { timeout: 5000 });
      
      if (response.status === 200 && response.data.connected) {
        console.log('✅ Kafka: CONNECTÉ');
        this.results.kafka = true;
        return true;
      } else {
        console.log('❌ Kafka: DÉCONNECTÉ');
        return false;
      }
    } catch (error) {
      console.log('❌ Kafka: ERREUR');
      console.log(`   ${error.response?.status}: ${error.response?.statusText || error.message}`);
      return false;
    }
  }

  // Générer rapport de test
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE TEST INTÉGRATION COMPLÈTE');
    console.log('='.repeat(60));

    const totalTests = 8;
    let passedTests = 0;

    // Infrastructure
    console.log('\n🏗️ INFRASTRUCTURE:');
    if (this.results.backend) {
      console.log('   ✅ Backend Node.js');
      passedTests++;
    } else {
      console.log('   ❌ Backend Node.js');
    }

    if (this.results.simulator) {
      console.log('   ✅ Simulateur Python');
      passedTests++;
    } else {
      console.log('   ❌ Simulateur Python');
    }

    if (this.results.socket) {
      console.log('   ✅ Socket.IO');
      passedTests++;
    } else {
      console.log('   ❌ Socket.IO');
    }

    if (this.results.database) {
      console.log('   ✅ Base de données');
      passedTests++;
    } else {
      console.log('   ❌ Base de données');
    }

    if (this.results.kafka) {
      console.log('   ✅ Kafka');
      passedTests++;
    } else {
      console.log('   ❌ Kafka');
    }

    // APIs
    console.log('\n🔌 APIs REST:');
    if (this.results.apis.trucks) {
      console.log('   ✅ API Camions');
      passedTests++;
    } else {
      console.log('   ❌ API Camions');
    }

    if (this.results.apis.routes) {
      console.log('   ✅ API Routes');
      passedTests++;
    } else {
      console.log('   ❌ API Routes');
    }

    if (this.results.apis.realtime) {
      console.log('   ✅ API Temps Réel');
      passedTests++;
    } else {
      console.log('   ❌ API Temps Réel');
    }

    // Score final
    const score = Math.round((passedTests / totalTests) * 100);
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 SCORE FINAL: ${passedTests}/${totalTests} (${score}%)`);
    
    if (score >= 100) {
      console.log('🚀 SYSTÈME 100% OPÉRATIONNEL !');
    } else if (score >= 75) {
      console.log('⚠️  Système partiellement fonctionnel');
    } else {
      console.log('❌ Système nécessite des corrections');
    }
    console.log('='.repeat(60));

    return score;
  }

  // Instructions de démarrage
  printStartupInstructions() {
    console.log('\n📋 INSTRUCTIONS DE DÉMARRAGE:');
    console.log('\n1. Backend Node.js:');
    console.log('   cd node-api');
    console.log('   npm install');
    console.log('   npm run start:dev');
    
    console.log('\n2. Simulateur Python:');
    console.log('   cd simulator');
    console.log('   pip install -r requirements.txt');
    console.log('   python simulate_truck.py');
    
    console.log('\n3. Frontend React:');
    console.log('   cd material-react-app');
    console.log('   npm install --legacy-peer-deps');
    console.log('   npm start');
    
    console.log('\n📁 Configuration:');
    console.log('   cp .env.example .env');
    console.log('   # Modifier les URLs si nécessaire');
  }

  // Nettoyer les connexions
  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🧹 Connexions fermées');
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('🚀 DÉMARRAGE TESTS INTÉGRATION SYSTÈME DYNAMIQUE\n');

    await this.testBackendConnection();
    await this.testPythonSimulator();
    await this.testSocketConnection();
    await this.testDatabase();
    await this.testKafka();
    await this.testAPIs();
    
    if (this.results.socket) {
      await this.testRealtimeData();
    }

    const score = this.generateReport();
    
    if (score < 100) {
      this.printStartupInstructions();
    }

    this.cleanup();
    return score;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests()
    .then((score) => {
      process.exit(score >= 75 ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Erreur durant les tests:', error);
      process.exit(1);
    });
}

module.exports = IntegrationTester;
