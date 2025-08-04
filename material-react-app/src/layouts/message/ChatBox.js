import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Card,
  Button,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import Picker from "emoji-picker-react";
import axios from "axios";
import moment from "moment";
import { useTranslation } from "react-i18next";

const MESSAGES_BATCH_SIZE = 5;

const ChatBox = ({ currentUser, chat, socket, refreshMessages }) => {
  const {t}=useTranslation();
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const allMessagesRef = useRef([]);
  const [showAll, setShowAll] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const boxRef = useRef(null);

  const receiver = chat?.user;

  const getFullAvatarUrl = (user) => {
    if (!user) return null;
    const img = user.image || user.image_user;
    if (!img) return null;
    return img.startsWith("http") ? img : `http://localhost:8080/uploads/${img}`;
  };

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const chatRes = await axios.get(
          `http://localhost:8080/messenger/chat/find/${currentUser._id}/${receiver._id}`,
          { withCredentials: true }
        );

        let chatData = chatRes.data?.chat;
        let messagesData = chatRes.data?.messages || [];

        if (!chatData) {
          const newChatRes = await axios.post(
            "http://localhost:8080/messenger/chat",
            {
              senderId: currentUser._id,
              receiverId: receiver._id,
            },
            { withCredentials: true }
          );
          chatData = newChatRes.data;
          messagesData = [];
        }

        setAllMessages(messagesData);
        allMessagesRef.current = messagesData;
        setMessages(messagesData.slice(-MESSAGES_BATCH_SIZE));
        chat.chatId = chatData._id;
        refreshMessages({ ...chat, messages: messagesData });
      } catch (err) {
        console.error("Erreur chargement messages :", err);
      }
    };

    if (receiver?._id) fetchChat();
  }, [receiver, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    allMessagesRef.current = allMessages;
  }, [allMessages]);

useEffect(() => {
  if (!socket || !receiver?._id) return;

  console.log("🧲 socket.on('typing') monté avec receiver ID :", receiver._id);

  const handleNewMessage = (data) => {
    const message = {
      text: data.text,
      fileUrl: data.fileUrl,
      createdAt: data.createdAt,
      senderId: data.senderId,
      _id: Date.now(),
    };

    const updatedAll = [...allMessagesRef.current, message];
    setAllMessages(updatedAll);
    setMessages(showAll ? updatedAll : updatedAll.slice(-MESSAGES_BATCH_SIZE));
  };
console.log("📦 ChatBox monté pour :", currentUser._id);
console.log("🆚 Receiver dans cette conversation :", receiver?._id);

 const handleTypingEvent = ({ senderId }) => {
  console.log("[REÇU] ✏️ typing from:", senderId, "Current receiver:", receiver?._id);

  if (senderId?.toString() !== currentUser._id.toString()) {
    setTypingUser(senderId);
    console.log("✅ Typing user set:", senderId);
  }
};



  const handleStopTyping = ({ senderId }) => {
    if (!receiver?._id) return;

    if (senderId?.toString() === receiver._id.toString()) {
      console.log("🛑 Stop typing reçu de :", senderId);
      setTypingUser(null);
    }
  };

  socket.on("new_message", handleNewMessage);
  socket.on("typing", handleTypingEvent);
  socket.on("stop_typing", handleStopTyping);

  return () => {
    socket.off("new_message", handleNewMessage);
    socket.off("typing", handleTypingEvent);       // ✅ maintenant les refs correspondent
    socket.off("stop_typing", handleStopTyping);
  };
}, [socket, showAll, receiver?._id]);




  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("chatId", chat.chatId);
      formData.append("senderId", currentUser._id);
      if (newMessage) formData.append("text", newMessage);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await axios.post("http://localhost:8080/messenger/message", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const message = res.data;
      const updatedAll = [...allMessagesRef.current, message];
      setAllMessages(updatedAll);
      setMessages(showAll ? updatedAll : updatedAll.slice(-MESSAGES_BATCH_SIZE));
      setNewMessage("");
      setSelectedFile(null);
      scrollToBottom();

      if (receiver?._id) {
        socket.emit("sendMessage", {
          senderId: currentUser._id,
          receiverId: receiver._id,
          text: message.text,
          fileUrl: message.fileUrl,
          createdAt: message.createdAt,
        });
  socket.emit("message_sent", {
  chatId: chat.chatId,
  message,
});

        socket.emit("stop_typing", {
          senderId: currentUser._id,
          receiverId: receiver._id,
        });
      }
    } catch (err) {
      console.error("Erreur envoi message :", err);
    }
  };

 const handleInputTyping = (e) => {
  setNewMessage(e.target.value);
  if (!receiver?._id) return;
  console.log("⌨️ En train d’écrire... Envoi de l’événement typing");
  socket.emit("typing", {
    senderId: currentUser._id,
    receiverId: receiver._id,
  });
  console.log("📤 Émission typing", {
  senderId: currentUser._id,
  receiverId: receiver._id,
});


  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("stop_typing", {
      senderId: currentUser._id,
      receiverId: receiver._id,
    });
  }, 1500);
};


  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleShowMore = () => {
    setShowAll(true);
    setMessages(allMessages);
    setTimeout(() => (boxRef.current.scrollTop = 0), 100);
  };

  const getFullFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    return fileUrl.startsWith("http") ? fileUrl : `http://localhost:8080/uploads/${fileUrl}`;
  };
console.log("💬 Affichage typing ?", typingUser, "==", receiver?._id);

  return (
    <Card sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Badge
          color="success"
          variant="dot"
          overlap="circular"
          invisible={!receiver?.isOnline}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{ mr: 2 }}
        >
          <Avatar src={getFullAvatarUrl(receiver)}>
            {!getFullAvatarUrl(receiver) && receiver?.FirstName?.[0]}
          </Avatar>
        </Badge>
        <Box>
          <Typography variant="h6">
            {receiver?.FirstName} {receiver?.LastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {receiver?.role}
          </Typography>
        </Box>
      </Box>

      <Box
        ref={boxRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 2,
          pr: 1,
          display: "flex",
          flexDirection: "column",
          maxHeight: "500px",
        }}
      >
        {!showAll && allMessages.length > MESSAGES_BATCH_SIZE && (
          <Button onClick={handleShowMore} variant="text" size="small">
            {t("showMore")}
          </Button>
        )}

        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUser._id;

          return (
            <Box
              key={msg._id}
              display="flex"
              flexDirection={isCurrentUser ? "row-reverse" : "row"}
              alignItems="flex-end"
              mb={1}
              maxWidth="70%"
              alignSelf={isCurrentUser ? "flex-end" : "flex-start"}
            >
              {!isCurrentUser && (
                <Avatar
                  src={getFullAvatarUrl(receiver)}
                  sx={{ width: 32, height: 32, mr: 1 }}
                >
                  {!getFullAvatarUrl(receiver) && receiver?.FirstName?.[0]}
                </Avatar>
              )}

              <Box
                bgcolor={isCurrentUser ? "primary.main" : "grey.300"}
                color={isCurrentUser ? "white" : "black"}
                px={2}
                py={1}
                borderRadius={2}
              >
                {msg.text && <Typography>{msg.text}</Typography>}
                {msg.fileUrl &&
                  (/\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrl) ? (
                    <img
                      src={getFullFileUrl(msg.fileUrl)}
                      alt="image"
                      style={{
                        maxWidth: "100%",
                        marginTop: "0.5rem",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <a href={getFullFileUrl(msg.fileUrl)} target="_blank" rel="noopener noreferrer">
                      {t("file")}
                    </a>
                  ))}
                <Typography variant="caption" display="block" textAlign="right" mt={0.5}>
                  {moment(msg.createdAt).format("HH:mm")}
                </Typography>
              </Box>
            </Box>
          );
        })}

    




        <div ref={messagesEndRef} />
      </Box>

      <Box display="flex" gap={1} alignItems="center">
        <IconButton onClick={() => setShowEmoji((prev) => !prev)}>
          <EmojiEmotionsIcon />
        </IconButton>

        <input
          accept="image/*,application/pdf"
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <label htmlFor="file-upload">
          <IconButton component="span">
            <AttachFileIcon />
          </IconButton>
        </label>

       <TextField
  fullWidth
  placeholder={
    typingUser?.toString() === receiver?._id?.toString()
              ? t("typing", { name: receiver?.FirstName })
              : t("writeMessage")
  }
  value={newMessage}
  onChange={handleInputTyping}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }}
/>


        <IconButton color="primary" onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Box>

      {showEmoji && (
        <Box mt={1} sx={{ position: "absolute", bottom: 100, zIndex: 10 }}>
          <Picker onEmojiClick={onEmojiClick} disableAutoFocus native />
        </Box>
      )}
    </Card>
  );
};

export default ChatBox;
