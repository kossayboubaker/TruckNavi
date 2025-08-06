// Service Kafka pour intégration Simulateur Python → Kafka → Node.js → Socket.IO → Frontend
import { Kafka } from 'kafkajs';
import { createProxyMiddleware } from 'http-proxy-middleware';

class KafkaService {
  constructor() {
    // Configuration Kafka
    this.kafkaConfig = {
      clientId: 'logistics-backend',
      brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
      retry: {
        retries: 8,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    };

    // Topics Kafka utilisés
    this.TOPICS = {
      TRUCK_POSITIONS: 'truck_positions',
      ROUTES: 'routes',
      ALERTS: 'alerts', 
      TRAFFIC: 'traffic',
      WEATHER: 'weather',
      MANDATORY_BREAKS: 'mandatory_breaks',
      TRUCK_COMMANDS: 'truck_commands',
      SIMULATOR_STATUS: 'simulator_status'
    };

    // Instance Kafka
    this.kafka = null;
    this.producer = null;
    this.consumer = null;
    this.isConnected = false;
    
    // Callbacks pour les données reçues
    this.messageHandlers = new Map();
    this.connectionHandlers = [];
    
    // Configuration du consumer
    this.consumerConfig = {
      groupId: 'logistics-backend-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      allowAutoTopicCreation: true
    };
  }

  // Initialiser la connexion Kafka
  async initialize() {
    try {
      console.log('🔄 Initialisation connexion Kafka...');
      
      this.kafka = new Kafka(this.kafkaConfig);
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000
      });
      this.consumer = this.kafka.consumer(this.consumerConfig);

      // Connecter le producer
      await this.producer.connect();
      console.log('✅ Kafka Producer connecté');

      // Connecter le consumer
      await this.consumer.connect();
      console.log('✅ Kafka Consumer connecté');

      // S'abonner aux topics
      await this.subscribeToTopics();
      
      // Démarrer la consommation des messages
      await this.startConsuming();
      
      this.isConnected = true;
      console.log('✅ Service Kafka initialisé avec succès');
      
      this.notifyConnectionHandlers('connected');
      
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation Kafka:', error);
      this.isConnected = false;
      this.notifyConnectionHandlers('error', error.message);
      
      // Retry automatique après délai
      setTimeout(() => {
        console.log('🔄 Tentative de reconnexion Kafka...');
        this.initialize();
      }, 10000);
      
      return false;
    }
  }

  // S'abonner aux topics nécessaires
  async subscribeToTopics() {
    const topics = Object.values(this.TOPICS);
    
    for (const topic of topics) {
      await this.consumer.subscribe({ 
        topic, 
        fromBeginning: false // Seulement les nouveaux messages
      });
      console.log(`📡 Abonné au topic: ${topic}`);
    }
  }

  // Démarrer la consommation des messages
  async startConsuming() {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;

          const data = JSON.parse(value);
          const timestamp = new Date().toISOString();
          
          console.log(`📨 Message Kafka reçu [${topic}]:`, data);
          
          // Traiter selon le topic
          await this.handleMessage(topic, data, { partition, timestamp });
          
        } catch (error) {
          console.error(`❌ Erreur traitement message Kafka [${topic}]:`, error);
        }
      },
    });
  }

  // Traiter les messages selon leur topic
  async handleMessage(topic, data, metadata) {
    try {
      switch (topic) {
        case this.TOPICS.TRUCK_POSITIONS:
          await this.handleTruckPositions(data, metadata);
          break;
          
        case this.TOPICS.ROUTES:
          await this.handleRoutes(data, metadata);
          break;
          
        case this.TOPICS.ALERTS:
          await this.handleAlerts(data, metadata);
          break;
          
        case this.TOPICS.TRAFFIC:
          await this.handleTraffic(data, metadata);
          break;
          
        case this.TOPICS.WEATHER:
          await this.handleWeather(data, metadata);
          break;
          
        case this.TOPICS.MANDATORY_BREAKS:
          await this.handleMandatoryBreaks(data, metadata);
          break;
          
        case this.TOPICS.SIMULATOR_STATUS:
          await this.handleSimulatorStatus(data, metadata);
          break;
          
        default:
          console.warn(`⚠️ Topic non reconnu: ${topic}`);
      }
      
      // Notifier les handlers enregistrés
      this.notifyMessageHandlers(topic, data, metadata);
      
    } catch (error) {
      console.error(`❌ Erreur handling message ${topic}:`, error);
    }
  }

  // Handlers spécifiques pour chaque type de message

  async handleTruckPositions(data, metadata) {
    console.log(`🚚 Positions camions reçues: ${data.trucks?.length || 0} camions`);
    
    // Enrichir avec timestamp de réception
    if (data.trucks) {
      data.trucks.forEach(truck => {
        truck.received_at = metadata.timestamp;
        truck.kafka_partition = metadata.partition;
      });
    }
    
    // Ici vous pouvez ajouter la logique pour:
    // - Mettre à jour la base de données
    // - Diffuser via Socket.IO
    // - Déclencher des alertes si nécessaire
  }

  async handleRoutes(data, metadata) {
    console.log(`🗺️ Route reçue: ${data.truckId || 'N/A'}`);
    
    // Traitement spécifique aux routes
    if (data.truckId && data.waypoints) {
      // Valider et enrichir la route
      data.processed_at = metadata.timestamp;
      data.kafka_source = true;
    }
  }

  async handleAlerts(data, metadata) {
    console.log(`🚨 Alerte reçue: ${data.type || 'unknown'} - ${data.severity || 'info'}`);
    
    // Traitement spécifique aux alertes
    data.received_at = metadata.timestamp;
    
    // Déclencher actions selon la sévérité
    if (data.severity === 'critical' || data.severity === 'danger') {
      console.log(`🚨 ALERTE CRITIQUE: ${data.title || data.message}`);
      // Notifier immédiatement tous les clients connectés
    }
  }

  async handleTraffic(data, metadata) {
    console.log(`🚦 Données trafic reçues: ${data.incidents?.length || 0} incidents`);
    
    // Enrichir avec métadonnées
    if (data.incidents) {
      data.incidents.forEach(incident => {
        incident.received_at = metadata.timestamp;
      });
    }
  }

  async handleWeather(data, metadata) {
    console.log(`🌤️ Données météo reçues: ${data.locations?.length || 1} locations`);
    
    data.processed_at = metadata.timestamp;
  }

  async handleMandatoryBreaks(data, metadata) {
    console.log(`⏸️ Données pauses obligatoires: ${data.driverId || 'N/A'}`);
    
    // Intégrer avec le service des pauses obligatoires
    data.kafka_received = true;
    data.processed_at = metadata.timestamp;
  }

  async handleSimulatorStatus(data, metadata) {
    console.log(`🔄 Statut simulateur: ${data.status || 'unknown'}`);
    
    // Traiter les changements d'état du simulateur Python
    if (data.status === 'stopped') {
      console.log('⚠️ Simulateur Python arrêté');
    } else if (data.status === 'started') {
      console.log('✅ Simulateur Python démarré');
    }
  }

  // Publier un message vers Kafka
  async publishMessage(topic, message, options = {}) {
    try {
      if (!this.isConnected || !this.producer) {
        console.warn('⚠️ Kafka non connecté, message ignoré');
        return false;
      }

      const messageData = {
        topic,
        messages: [{
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
            source: 'nodejs-backend'
          }),
          ...options
        }]
      };

      await this.producer.send(messageData);
      console.log(`📤 Message publié vers ${topic}:`, message);
      
      return true;
    } catch (error) {
      console.error(`❌ Erreur publication message ${topic}:`, error);
      return false;
    }
  }

  // Publier commande vers un camion (via simulateur Python)
  async sendTruckCommand(truckId, command, params = {}) {
    return this.publishMessage(this.TOPICS.TRUCK_COMMANDS, {
      truckId,
      command,
      params,
      commandId: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  // Publier données de routes optimisées
  async publishOptimizedRoute(truckId, routeData) {
    return this.publishMessage(this.TOPICS.ROUTES, {
      truckId,
      ...routeData,
      optimized: true
    });
  }

  // Publier alertes
  async publishAlert(alertData) {
    return this.publishMessage(this.TOPICS.ALERTS, alertData);
  }

  // Enregistrer handler pour un topic spécifique
  onMessage(topic, handler) {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, []);
    }
    this.messageHandlers.get(topic).push(handler);
    
    return () => {
      const handlers = this.messageHandlers.get(topic);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Notifier les handlers enregistrés
  notifyMessageHandlers(topic, data, metadata) {
    const handlers = this.messageHandlers.get(topic) || [];
    handlers.forEach(handler => {
      try {
        handler(data, metadata);
      } catch (error) {
        console.error(`❌ Erreur handler ${topic}:`, error);
      }
    });
  }

  // Enregistrer handler pour les événements de connexion
  onConnection(handler) {
    this.connectionHandlers.push(handler);
    
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  notifyConnectionHandlers(status, error = null) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status, error);
      } catch (error) {
        console.error('❌ Erreur handler connexion:', error);
      }
    });
  }

  // Créer les topics s'ils n'existent pas
  async createTopics() {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
      const topics = Object.values(this.TOPICS).map(topic => ({
        topic,
        numPartitions: 3, // 3 partitions pour performance
        replicationFactor: 1 // À adapter selon votre cluster
      }));
      
      await admin.createTopics({
        topics,
        waitForLeaderElection: true
      });
      
      console.log('✅ Topics Kafka créés');
      await admin.disconnect();
      
    } catch (error) {
      console.error('❌ Erreur création topics:', error);
    }
  }

  // Obtenir les statistiques Kafka
  getStatistics() {
    return {
      isConnected: this.isConnected,
      topics: this.TOPICS,
      handlersCount: Array.from(this.messageHandlers.entries()).reduce((acc, [topic, handlers]) => {
        acc[topic] = handlers.length;
        return acc;
      }, {}),
      connectionHandlers: this.connectionHandlers.length,
      brokers: this.kafkaConfig.brokers
    };
  }

  // Vérifier la santé de Kafka
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { healthy: false, error: 'Not connected' };
      }
      
      const admin = this.kafka.admin();
      await admin.connect();
      const metadata = await admin.fetchTopicMetadata({ topics: Object.values(this.TOPICS) });
      await admin.disconnect();
      
      return {
        healthy: true,
        topics: metadata.topics?.length || 0,
        brokers: this.kafkaConfig.brokers
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Déconnexion propre
  async disconnect() {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        console.log('✅ Kafka Consumer déconnecté');
      }
      
      if (this.producer) {
        await this.producer.disconnect();
        console.log('✅ Kafka Producer déconnecté');
      }
      
      this.isConnected = false;
      this.notifyConnectionHandlers('disconnected');
      
    } catch (error) {
      console.error('❌ Erreur déconnexion Kafka:', error);
    }
  }
}

// Instance singleton
const kafkaService = new KafkaService();

export default kafkaService;
