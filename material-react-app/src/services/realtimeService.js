// Service Socket.IO pour la réception de données temps réel
import { io } from 'socket.io-client';
import trucksService from './trucksService';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  }

  // Initialiser la connexion Socket.IO
  connect() {
    if (this.socket) {
      return this.socket;
    }

    try {
      console.log('🔌 Connexion Socket.IO au backend...');

      this.socket = io(this.baseURL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxHttpBufferSize: 1e6,
        pingTimeout: 60000,
        pingInterval: 25000,
        forceNew: false
      });

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      console.error('❌ Erreur création Socket.IO:', error);
      this.isConnected = false;
      return null;
    }
  }

  // Configuration des gestionnaires d'événements
  setupEventHandlers() {
    // Connexion établie
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connecté - ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { status: 'connected', socketId: this.socket.id });
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO déconnecté:', reason);
      this.isConnected = false;
      this.notifyListeners('connection', { status: 'disconnected', reason });
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.IO:', error);
      this.reconnectAttempts++;
      this.notifyListeners('connection', { 
        status: 'error', 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
    });

    // Reconnexion
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnecté après ${attemptNumber} tentatives`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { status: 'reconnected', attempts: attemptNumber });
    });

    // Échec de reconnexion
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Échec reconnexion Socket.IO');
      this.isConnected = false;
      this.notifyListeners('connection', { status: 'failed' });
    });

    // Données des camions en temps réel depuis le simulateur Python
    this.socket.on('truck_positions_update', (data) => {
      console.log('📍 Mise à jour positions camions:', data.trucks?.length || 0);
      this.notifyListeners('truck_positions', data);
      
      // Notifier le service des camions
      trucksService.notifyUpdate({
        type: 'positions_update',
        data: data.trucks || [],
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    // Nouvelles alertes générées
    this.socket.on('new_alert', (alertData) => {
      console.log('🚨 Nouvelle alerte:', alertData.type, alertData.title);
      this.notifyListeners('alerts', alertData);
    });

    // Mises à jour de route depuis OSRM
    this.socket.on('route_update', (routeData) => {
      console.log('🗺️ Mise à jour route:', routeData.truckId);
      this.notifyListeners('routes', routeData);
    });

    // Données météo temps réel
    this.socket.on('weather_update', (weatherData) => {
      console.log('🌤️ Mise à jour météo:', weatherData.locations?.length || 0);
      this.notifyListeners('weather', weatherData);
    });

    // Données de trafic temps réel
    this.socket.on('traffic_update', (trafficData) => {
      console.log('🚦 Mise à jour trafic:', trafficData.incidents?.length || 0);
      this.notifyListeners('traffic', trafficData);
    });

    // Événements de flotte (arrivée, départ, maintenance)
    this.socket.on('fleet_event', (eventData) => {
      console.log('🚛 Événement flotte:', eventData.type, eventData.truckId);
      this.notifyListeners('fleet_events', eventData);
    });

    // Statistiques temps réel
    this.socket.on('statistics_update', (statsData) => {
      console.log('📊 Mise à jour statistiques flotte');
      this.notifyListeners('statistics', statsData);
    });

    // État du simulateur Python
    this.socket.on('simulator_status', (statusData) => {
      console.log('🐍 État simulateur Python:', statusData.status);
      this.notifyListeners('simulator', statusData);
    });

    // Messages du backend Kafka
    this.socket.on('kafka_message', (kafkaData) => {
      console.log('📨 Message Kafka:', kafkaData.topic);
      this.notifyListeners('kafka', kafkaData);
    });

    // Mise à jour de géofencing
    this.socket.on('geofence_event', (geofenceData) => {
      console.log('📍 Événement géofence:', geofenceData.type, geofenceData.truckId);
      this.notifyListeners('geofence', geofenceData);
    });
  }

  // S'abonner à des événements
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Retourner fonction de désabonnement
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Notifier tous les listeners d'un type d'événement
  notifyListeners(eventType, data) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Erreur listener ${eventType}:`, error);
        }
      });
    }
  }

  // Envoyer des commandes au backend
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
      return true;
    } else {
      console.warn(`⚠️ Socket non connecté pour événement: ${eventName}`);
      return false;
    }
  }

  // Rejoindre une room spécifique
  joinRoom(roomName) {
    return this.emit('join_room', { room: roomName });
  }

  // Quitter une room
  leaveRoom(roomName) {
    return this.emit('leave_room', { room: roomName });
  }

  // Demander des données spécifiques
  requestData(dataType, params = {}) {
    return this.emit('request_data', { type: dataType, params });
  }

  // Envoyer commande à un camion
  sendTruckCommand(truckId, command, params = {}) {
    return this.emit('truck_command', {
      truckId,
      command,
      params,
      timestamp: new Date().toISOString()
    });
  }

  // Démarrer le simulateur Python via Socket
  startSimulator(config = {}) {
    return this.emit('start_simulator', config);
  }

  // Arrêter le simulateur Python
  stopSimulator() {
    return this.emit('stop_simulator', {});
  }

  // Obtenir l'état de connexion
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      transport: this.socket?.io?.engine?.transport?.name || null
    };
  }

  // Déconnecter proprement
  disconnect() {
    if (this.socket) {
      console.log('🔌 Déconnexion Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Forcer la reconnexion
  reconnect() {
    if (this.socket) {
      console.log('🔄 Reconnexion forcée Socket.IO...');
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  // Vérifier la latence
  async checkLatency() {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve(-1);
        return;
      }

      const start = Date.now();
      this.socket.emit('ping', start, (timestamp) => {
        const latency = Date.now() - timestamp;
        resolve(latency);
      });
    });
  }
}

// Instance singleton
const realtimeService = new RealtimeService();

export default realtimeService;
