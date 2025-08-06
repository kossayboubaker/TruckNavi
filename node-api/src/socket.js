import kafkaService from './services/kafkaService.js';

let onlineUsers = [];

function socketServer(io) {
  // Initialiser Kafka au démarrage
  kafkaService.initialize().then(() => {
    console.log('✅ Kafka initialisé avec Socket.IO');
    setupKafkaSocketIntegration(io);
  }).catch(error => {
    console.error('❌ Erreur initialisation Kafka:', error);
  });

  io.on("connection", (socket) => {
    console.log("✅ Nouveau client connecté :", socket.id);

    const userId = socket.handshake.query.userId;
    console.log("🔍 Query userId reçu :", userId, typeof userId);
    if (userId) {
      const alreadyConnected = onlineUsers.some((u) => u.userId === userId);
      if (!alreadyConnected) {
        onlineUsers.push({ userId, socketId: socket.id });
        console.log("🔵 Utilisateur ajouté à onlineUsers:", onlineUsers);
      } else {
        console.log("ℹ️ Utilisateur déjà connecté :", userId);
      }
    } else {
      console.log("⚠️ Aucun userId reçu dans la query.");
    }

    // ** NOUVELLES FONCTIONNALITÉS LOGISTIQUES **

    // Rejoindre room pour un camion spécifique
    socket.on('track_truck', (truckId) => {
      socket.join(`truck_${truckId}`);
      console.log(`🚚 Tracking camion: ${truckId} par ${socket.id}`);

      // Confirmer l'abonnement
      socket.emit('truck_tracking_confirmed', { truckId });
    });

    // Quitter le tracking d'un camion
    socket.on('untrack_truck', (truckId) => {
      socket.leave(`truck_${truckId}`);
      console.log(`🚫 Arrêt tracking camion: ${truckId} par ${socket.id}`);
    });

    // Gérer les commandes de camions depuis le frontend
    socket.on('truck_command', async (data) => {
      try {
        const { truckId, command, params } = data;
        console.log(`🚚 Commande camion reçue: ${truckId} -> ${command}`);

        // Envoyer via Kafka vers le simulateur Python
        const success = await kafkaService.sendTruckCommand(truckId, command, params);

        socket.emit('truck_command_response', {
          success,
          truckId,
          command,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Erreur commande camion:', error);
        socket.emit('truck_command_error', {
          error: error.message,
          truckId: data.truckId,
          command: data.command
        });
      }
    });

    // Rejoindre room pour alertes
    socket.on('subscribe_alerts', (params = {}) => {
      const room = params.severity ? `alerts_${params.severity}` : 'alerts_all';
      socket.join(room);
      console.log(`🚨 Abonnement alertes: ${room} par ${socket.id}`);

      socket.emit('alerts_subscription_confirmed', { room });
    });

    // Demander statut Kafka
    socket.on('kafka_status', () => {
      const stats = kafkaService.getStatistics();
      socket.emit('kafka_status_response', stats);
    });

    // Rejoindre room générale pour données logistiques
    socket.on('join_logistics', () => {
      socket.join('logistics');
      console.log(`📊 Rejoint room logistics: ${socket.id}`);

      socket.emit('logistics_joined', {
        timestamp: new Date().toISOString(),
        kafkaConnected: kafkaService.isConnected
      });
    });
        socket.on("typing", ({ senderId, receiverId }) => {
  console.log(`✏️ ${senderId} est en train d'écrire à ${receiverId}`);
  const receiverSocket = onlineUsers.find((u) => u.userId === receiverId);
  if (receiverSocket) {
console.log("📤 Envoi à", receiverSocket.socketId, "pour receiverId =", receiverId);
    io.to(receiverSocket.socketId).emit("typing", { senderId });
    console.log("📤 [serveur] Emitting 'typing' to", receiverSocket.socketId, "with senderId =", senderId);

    
  }
});

        socket.on("stop_typing", ({ senderId, receiverId }) => {
  const receiverSocket = onlineUsers.find((u) => u.userId === receiverId);
  if (receiverSocket) {
    io.to(receiverSocket.socketId).emit("stop_typing", { senderId });
  }
});


    socket.on("disconnect", () => {
      console.log("❌ Déconnexion du client :", socket.id);
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      console.log("🧹 onlineUsers après déconnexion :", onlineUsers);
    });
  });

  return {
    getOnlineUsers: () => {
      console.log("📡 Récupération des onlineUsers :", onlineUsers);
      return onlineUsers;
    },
    kafkaService: kafkaService, // Exposer Kafka service pour utilisation externe
    publishToKafka: (topic, message) => kafkaService.publishMessage(topic, message)
  };
}

// Configurer l'intégration Kafka → Socket.IO
const setupKafkaSocketIntegration = (io) => {
  console.log('🔗 Configuration intégration Kafka ↔ Socket.IO...');

  // Rediffuser les positions de camions
  kafkaService.onMessage('truck_positions', (data, metadata) => {
    // Diffusion générale
    io.to('logistics').emit('truck_positions', {
      ...data,
      source: 'kafka',
      metadata
    });

    // Diffuser dans les rooms spécifiques aux camions
    if (data.trucks) {
      data.trucks.forEach(truck => {
        io.to(`truck_${truck.truck_id}`).emit('truck_position_update', {
          truck,
          timestamp: metadata.timestamp
        });
      });
    }

    console.log(`📡 Positions diffusées: ${data.trucks?.length || 0} camions`);
  });

  // Rediffuser les routes
  kafkaService.onMessage('routes', (data, metadata) => {
    io.to('logistics').emit('routes', {
      ...data,
      source: 'kafka',
      metadata
    });

    if (data.truckId) {
      io.to(`truck_${data.truckId}`).emit('route_update', {
        ...data,
        timestamp: metadata.timestamp
      });
    }

    console.log(`🗺️ Route diffusée: ${data.truckId || 'N/A'}`);
  });

  // Rediffuser les alertes avec rooms ciblées
  kafkaService.onMessage('alerts', (data, metadata) => {
    // Diffusion générale
    io.to('logistics').emit('alerts', {
      ...data,
      source: 'kafka',
      metadata
    });

    // Diffusion par sévérité
    if (data.severity) {
      io.to(`alerts_${data.severity}`).emit('alert_by_severity', {
        ...data,
        timestamp: metadata.timestamp
      });
    }

    // Diffusion générale des alertes
    io.to('alerts_all').emit('new_alert', {
      ...data,
      timestamp: metadata.timestamp
    });

    // Si alerte critique, notification push spéciale
    if (data.severity === 'critical' || data.severity === 'danger') {
      io.emit('critical_alert', {
        ...data,
        urgent: true,
        timestamp: metadata.timestamp
      });

      console.log(`🚨 ALERTE CRITIQUE diffusée: ${data.title || data.message}`);
    }

    console.log(`🚨 Alerte diffusée: ${data.type || 'unknown'} (${data.severity || 'info'})`);
  });

  // Rediffuser les données de trafic
  kafkaService.onMessage('traffic', (data, metadata) => {
    io.to('logistics').emit('traffic', {
      ...data,
      source: 'kafka',
      metadata
    });

    console.log(`🚦 Données trafic diffusées: ${data.incidents?.length || 0} incidents`);
  });

  // Rediffuser les données météo
  kafkaService.onMessage('weather', (data, metadata) => {
    io.to('logistics').emit('weather', {
      ...data,
      source: 'kafka',
      metadata
    });

    console.log(`🌤️ Données météo diffusées`);
  });

  // Rediffuser les données de pauses obligatoires
  kafkaService.onMessage('mandatory_breaks', (data, metadata) => {
    io.to('logistics').emit('mandatory_breaks', {
      ...data,
      source: 'kafka',
      metadata
    });

    if (data.truckId) {
      io.to(`truck_${data.truckId}`).emit('mandatory_break_update', {
        ...data,
        timestamp: metadata.timestamp
      });
    }

    console.log(`⏸️ Données pauses diffusées: ${data.driverId || 'N/A'}`);
  });

  // Gérer les changements de statut du simulateur
  kafkaService.onMessage('simulator_status', (data, metadata) => {
    io.to('logistics').emit('simulator_status', {
      ...data,
      source: 'kafka',
      metadata
    });

    console.log(`🔄 Statut simulateur diffusé: ${data.status || 'unknown'}`);
  });

  // Gérer les événements de connexion Kafka
  kafkaService.onConnection((status, error) => {
    io.emit('kafka_connection_status', {
      status,
      error,
      timestamp: new Date().toISOString()
    });

    if (status === 'connected') {
      console.log('✅ Kafka connecté - Socket.IO notifié');
    } else if (status === 'error') {
      console.error('❌ Kafka erreur - Socket.IO notifié:', error);
    }
  });

  console.log('✅ Intégration Kafka ↔ Socket.IO configurée');
};

export default socketServer;
