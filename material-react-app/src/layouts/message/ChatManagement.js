import React, { useEffect, useState } from "react";
import ConversationList from "./ConversationList";
import ChatBox from "./ChatBox";
import NewConversationModal from "./NewConversationModal";
import { Box, IconButton, Typography, Modal } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

const ChatManagement = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get("http://localhost:8080/messenger/currentUser", {
 withCredentials: true      });
      setCurrentUser(res.data);
    };

    const fetchChats = async () => {
      const res = await axios.get(`http://localhost:8080/messenger/chat/${currentUser?._id}`, {
  withCredentials: true }      );
      setConversations(res.data);
    };

    if (token) fetchUser();
    if (currentUser?._id) fetchChats();
  }, [token, currentUser?._id]);

   const handleStartChat = async (user) => {
    const res = await axios.post(
      "http://localhost:8080/messenger/chat",
      { senderId: currentUser._id, receiverId: user._id },
      {   withCredentials: true,  }
    );
    onNewChat({ user, chatId: res.data._id });
    onClose();
  };
  return (
    <Box display="flex" height="100vh">
      <Box width="25%" bgcolor="#f8f9fa" p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Chats</Typography>
          <IconButton onClick={() => setShowModal(true)}>
            <AddIcon />
          </IconButton>
        </Box>
        <ConversationList
          conversations={conversations}
          currentUser={currentUser}
          onSelect={setSelectedChat}
        />
      </Box>

      <Box flexGrow={1}>
        {selectedChat ? (
          <ChatBox chat={selectedChat} currentUser={currentUser} />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="h5" color="textSecondary">
              Sélectionnez une conversation
            </Typography>
          </Box>
        )}
      </Box>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box>
          <NewConversationModal
            currentUser={currentUser}
            onClose={() => setShowModal(false)}
            onNewChat={(newChat) => {
              setConversations((prev) => [...prev, newChat]);
              setSelectedChat(newChat);
            }}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default ChatManagement;
