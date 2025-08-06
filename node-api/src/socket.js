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
      console.log("❌ D��connexion du client :", socket.id);
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      console.log("🧹 onlineUsers après déconnexion :", onlineUsers);
    });
  });

  return {
    getOnlineUsers: () => {
      console.log("📡 Récupération des onlineUsers :", onlineUsers);
      return onlineUsers;
    },
  };
}

export default socketServer;
