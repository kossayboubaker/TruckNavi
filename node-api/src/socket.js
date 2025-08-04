let onlineUsers = [];

function socketServer(io) {
  io.on("connection", (socket) => {
    console.log("✅ Nouveau client connecté :", socket.id);

    const userId = socket.handshake.query.userId;
   console.log("✅ Nouveau client connecté :", socket.id);
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
  };
}

export default socketServer;
