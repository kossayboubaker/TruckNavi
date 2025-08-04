// components/Chat/NewConversationModal.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  Button,
} from "@mui/material";
import axios from "axios";

const NewConversationModal = ({ currentUser, onClose, onNewChat }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

useEffect(() => {
  const fetchUsers = async () => {
    if (!currentUser?._id) return;
    const res = await axios.get("http://localhost:8080/messenger/users", {
      withCredentials: true,
    });
    setUsers(res.data.filter((u) => u._id !== currentUser._id));
  };
  fetchUsers();
}, [currentUser]);


  const filtered = users.filter((u) =>
    `${u.FirstName} ${u.LastName}`.toLowerCase().includes(search.toLowerCase())
  );

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
    <Box
      p={3}
      bgcolor="white"
      borderRadius={2}
      boxShadow={4}
      width={400}
      mx="auto"
      mt="10%"
    >
      <Typography variant="h6" mb={2}>
        Ajouter une nouvelle conversation
      </Typography>
      <TextField
        fullWidth
        placeholder="Rechercher un utilisateur"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />
      <List>
        {filtered.map((u) => (
          <ListItem key={u._id} button onClick={() => handleStartChat(u)}>
            {u.FirstName} {u.LastName}
          </ListItem>
        ))}
      </List>
      <Button fullWidth variant="outlined" onClick={onClose}>
        Fermer
      </Button>
    </Box>
  );
};

export default NewConversationModal;
