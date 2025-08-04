// routes/messenger.js
import express from "express";
import multer from "multer";
import path from "path";
import {Message} from "../model/message.js";
import {User} from "../model/user.js";
import { authenticate } from "../auth/middelware.js";
import  { Chat } from "../model/chat.js";
// import io from ".."; 

import fs from "fs/promises";
const router = express.Router();

// --- Multer config for uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("uploads")); // adjust path if needed
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });// ✅ Upload file
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("Aucun fichier téléchargé");
  res.status(200).json({ filename: req.file.filename });
});
router.get("/online", authenticate, (req, res) => {
  const onlineUsers = req.app.get("getOnlineUsers")();
  res.status(200).json(onlineUsers);
});
// PUT /messenger/message/markSeen/:id
router.put("/message/markSeen/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: "Message non trouvé" });
    }

    // Marquer comme vu seulement si c’est un message entrant et pas encore vu
    if (!message.seen && message.senderId.toString() !== userId) {
      message.seen = true;
      await message.save();
    }

    res.status(200).json({ message: "Message marqué comme vu", seen: message.seen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ Create or get chat
router.post("/chat", authenticate, async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    let chat = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
    });
    if (!chat) {
      chat = await Chat.create({ members: [senderId, receiverId] });
    }
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Get all chats of a user
// ✅ Get all chats of a user + populate messages
router.get("/chat/:userId", authenticate, async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.params.userId })
      .lean();

    // Pour chaque chat, ajoute les messages
    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      const messages = await Message.find({ chatId: chat._id })
        .sort({ createdAt: 1 })
        .lean();
      return {
        ...chat,
        messages,
      };
    }));

    res.status(200).json(enrichedChats);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ✅ Get chat between two users
// ✅ Get chat and messages between two users
// ✅ Get full chat between two users with messages + reactions
router.get("/chat/find/:firstId/:secondId", authenticate, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      members: { $all: [req.params.firstId, req.params.secondId] },
    });

    if (!chat) return res.status(200).json(null);

    const messages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .select("senderId text fileUrl reactions createdAt") // Sélectionne les infos importantes
      .lean();

    res.status(200).json({ chat, messages });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la récupération du chat et des messages.",
    });
  }
});




// ✅ Delete chat
router.delete("/chat/:id", authenticate, async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.status(200).send("Chat supprimé");
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Send a message
router.post("/message", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;

    const message = new Message({
      chatId,
      senderId,
      text: text || "",
      reactions: [],
    });

    if (req.file && req.file.path) {
      const fileUrl = `http://localhost:8080/${req.file.path.replace(/\\/g, "/")}`;
      message.fileUrl = fileUrl;
    }

    const savedMessage = await message.save();

    // Trouver les membres du chat
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat non trouvé" });
    const io = req.io;

    // Trouver les destinataires (exclure l’émetteur)
    const recipients = chat.members.filter(id => id.toString() !== senderId);

    // Émettre l'événement aux destinataires
    recipients.forEach((recipientId) => {
      
      // io.to(recipientId.toString()).emit("new_message", savedMessage);
      io.to(recipientId.toString()).emit("new_message", {
        _id: savedMessage._id,
        text: savedMessage.text,
        fileUrl: savedMessage.fileUrl,
        createdAt: savedMessage.createdAt,
        senderId: savedMessage.senderId,
      });
      console.log(`🔁 Message envoyé à ${recipientId}`);

      io.to(recipientId.toString()).emit("new_notification", {
        recipient: recipientId,
        sender: senderId,
        type: "general",
        title: "Nouveau message",
        message: `Vous avez reçu un nouveau message`,
        relatedEntity: chatId,
        entityType: "Chat",
        createdAt: new Date(),
        seen: false,
      });
    });

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("Erreur backend message POST:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});


// ✅ Get messages by chat
router.get("/message/:chatId", authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ React to a message
router.put("/message/:id/reaction", authenticate, async (req, res) => {
  const { userName, reaction } = req.body;
  try {
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { $push: { reactions: { userName, reaction } } },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Remove reaction
router.put("/message/:id/reaction/remove", authenticate, async (req, res) => {
  const { userName } = req.body;
  try {
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { $pull: { reactions: { userName } } },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Get reactions for a message
router.get("/message/:id/reactions", authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).send("Message not found");
    res.status(200).json(message.reactions);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Update a message
router.put("/message/:id", authenticate, async (req, res) => {
  try {
    const updated = await Message.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Delete a message
router.delete("/message/:id", authenticate, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.status(200).send("Message supprimé");
  } catch (err) {
    res.status(500).json(err);
  }
});


router.get('/currentUser', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); // retirer le password
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    const onlineUsers = req.app.get("getOnlineUsers")(); 

    console.log("📥 Utilisateurs en ligne récupérés :", onlineUsers);

    const enrichedUsers = users.map((user) => {
      const isOnline = onlineUsers.some((u) => u.userId === user._id.toString());
      console.log(`👤 Utilisateur ${user._id} est en ligne ? ${isOnline}`);
      return { ...user.toObject(), isOnline };
    });

    console.log("📤 Utilisateurs enrichis envoyés :", enrichedUsers);

    res.json(enrichedUsers);
  } catch (err) {
    console.error("❌ Erreur route /users :", err);
    res.status(500).json({ message: err.message });
  }
});




export default router;
