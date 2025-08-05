let onlineUsers = [];
let connectedClients = new Map(); // Pour suivre les clients connectés

function socketServer(io) {
  io.on("connection", (socket) => {
    console.log("✅ Nouveau client connecté :", socket.id);

    const userId = socket.handshake.query.userId;
    console.log("🔍 Query userId reçu :", userId, typeof userId);

    // Ajouter le client à la room des camions pour recevoir les mises à jour
    socket.join('truck_updates');
    console.log("🚛 Client ajouté à la room truck_updates");

    if (userId) {
      const alreadyConnected = onlineUsers.some((u) => u.userId === userId);
      if (!alreadyConnected) {
        onlineUsers.push({ userId, socketId: socket.id });
        console.log("🔵 Utilisateur ajouté à onlineUsers:", onlineUsers.length);
      } else {
        console.log("ℹ️ Utilisateur déjà connecté :", userId);
      }

      // Ajouter à la map des clients connectés
      connectedClients.set(socket.id, { userId, connectedAt: new Date() });
    } else {
      console.log("⚠️ Aucun userId reçu dans la query.");
    }

    // Événement pour demander la liste des camions
    socket.on('request_trucks_data', () => {
      console.log("📡 Demande de données camions reçue");
      socket.emit('trucks_data_requested');
    });

    // Événement pour s'abonner aux mises à jour d'un camion spécifique
    socket.on('subscribe_truck', (truckId) => {
      socket.join(`truck_${truckId}`);
      console.log(`🚛 Client abonné aux mises à jour du camion ${truckId}`);
    });

    // Événement pour se désabonner des mises à jour d'un camion
    socket.on('unsubscribe_truck', (truckId) => {
      socket.leave(`truck_${truckId}`);
      console.log(`🚛 Client désabonné du camion ${truckId}`);
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
      connectedClients.delete(socket.id);
      console.log("🧹 onlineUsers après déconnexion :", onlineUsers.length);
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
