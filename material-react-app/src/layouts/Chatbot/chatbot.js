import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Fab,
  TextField,
  Paper,
  IconButton,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import "./ChatbotWidget.css";

const ChatbotWidget = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatRef = useRef(null); // ref pour le conteneur

  const toggleChat = () => setOpen(!open);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: "user", text: message };
    console.log("Image utilisateur :", user?.image);

    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const res = await axios.post("http://localhost:8000/chat", { message });
      const botMessage = { sender: "bot", text: res.data.response };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Erreur de connexion au chatbot." },
      ]);
    }

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // Fermer le chat si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          aria-label="chat"
          onClick={toggleChat}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {open && (
        <Paper
          ref={chatRef}
          elevation={4}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 350,
            height: 460,
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1,
              borderBottom: "1px solid #ddd",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                alt="Bot"
                src="/chatbot.jpg"
                sx={{ width: 32, height: 32 }}
              />
              <Typography variant="h6" sx={{ fontSize: "1rem" }}>
                Assistant 
              </Typography>
            </Box>
            <IconButton onClick={toggleChat}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 1,
              backgroundColor: "#f9f9f9",
            }}
          >
            {chatHistory.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Avatar
                  alt={msg.sender === "user" ? "User" : "Bot"}
                  src={
                    msg.sender === "user"
                      ? user?.image
                        ? `http://localhost:8080/uploads/${user.image}`
                        : "/default-user.png"
                      : "/chatbot.jpg"
                  }
                  sx={{ width: 28, height: 28, mx: 1 }}
                />
                <Box
                  sx={{
                    backgroundColor:
                      msg.sender === "user" ? "#1976d2" : "#e0e0e0",
                    color: msg.sender === "user" ? "#fff" : "#000",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "75%",
                    fontSize: "0.875rem",
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              p: 1,
              borderTop: "1px solid #ddd",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Posez votre question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              size="small"
            />
            <IconButton onClick={handleSend} color="primary" sx={{ ml: 1 }}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatbotWidget;
