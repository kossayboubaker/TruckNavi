import React, { useEffect, useState } from "react";
import { Grid, Card, TextField } from "@mui/material";
import ConversationList from "../message/ConversationList";
import ChatBox from "../message/ChatBox";
import socket from "../../socket";
import axios from "axios";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";
import { useTranslation } from "react-i18next";

const ChatPage = () => {
  const {t}=useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:8080/messenger/currentUser", {
          withCredentials: true,
        });
        setCurrentUser(res.data);
        console.log("✅ Utilisateur courant :", res.data);
      } catch (err) {
        console.error("❌ Erreur fetch currentUser:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:8080/messenger/users", {
          withCredentials: true,
        });

        // Marquer isOnline sur les users selon onlineUsers (que l'on mettra à jour avec socket)
        // Ici on doit fusionner les données, on le fera après socket init

        setUsers(res.data);
        console.log("✅ Liste utilisateurs :", res.data);
      } catch (err) {
        console.error("❌ Erreur fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser?._id) return;
      
      try {
        const res = await axios.get(`http://localhost:8080/messenger/chat/${currentUser._id}`, {
          withCredentials: true,
        });
        setConversations(res.data);
        console.log("✅ Conversations récupérées :", res.data);
      } catch (err) {
        console.error("❌ Erreur fetch chats:", err);
      }
    };
    fetchChats();
  }, [currentUser]);

useEffect(() => {
  if (!currentUser?._id) return;

  socket.auth = { userId: currentUser._id };
  socket.connect();
  socket.emit("join", currentUser._id);
  socket.emit("new-user-add", currentUser._id);

  socket.off("get-users");
  socket.on("get-users", (usersOnline) => {
    setOnlineUsers(usersOnline);
    setUsers((prevUsers) =>
      prevUsers.map((user) => ({
        ...user,
        isOnline: usersOnline.some((u) => u.userId === user._id),
      }))
    );
  });

  // 🔁 Écoute l’arrivée d’un message pour rafraîchir la dernière ligne de conversation
  socket.off("message_sent");
  socket.on("message_sent", ({ chatId, message }) => {
    setConversations((prevConvs) =>
      prevConvs.map((conv) =>
        conv._id === chatId
          ? { ...conv, messages: [...(conv.messages || []), message] }
          : conv
      )
    );
  });

  return () => {
    socket.off("get-users");
    socket.off("message_sent");
    socket.disconnect();
  };
}, [currentUser]);




  const filtered = users.filter((u) =>
    `${u.FirstName} ${u.LastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = (user) => {
    console.log("👤 Utilisateur sélectionné :", user);

    const existingChat = conversations.find(
      (conv) =>
        (conv?.user?._id === user._id) ||
        (conv.members && conv.members.includes(user._id))
    );

    if (existingChat) {
      console.log("✅ Chat existant trouvé :", existingChat);

      if (!existingChat.user) {
        const otherUserId = existingChat.members?.find((id) => id !== currentUser._id);
        const otherUser = users.find((u) => u._id === otherUserId);
        existingChat.user = otherUser || user;
      }

      setSelectedChat(existingChat);
    } else {
      const newChat = {
        members: [currentUser._id, user._id],
        user: user,
        messages: [],
      };
      console.log("🆕 Nouveau chat créé :", newChat);
      setConversations((prev) => [...prev, newChat]);
      setSelectedChat(newChat);
    }
  };

  console.log("📦 selectedChat :", selectedChat);
const refreshConversations = async () => {
  if (!currentUser?._id) return;
  try {
    const res = await axios.get(`http://localhost:8080/messenger/chat/${currentUser._id}`, {
      withCredentials: true,
    });
    setConversations(res.data);
  } catch (err) {
    console.error("Erreur lors de la mise à jour des conversations :", err);
  }
};
const updateConversationMessages = (chatId, updatedMessages) => {
  setConversations((prevConvs) =>
    prevConvs.map((conv) =>
      conv._id === chatId ? { ...conv, messages: updatedMessages } : conv
    )
  );
};

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      <Grid container spacing={2} p={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder={t("searchUser")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
            />

            <ConversationList
  currentUser={currentUser}
  users={filtered}
  onSelect={handleSelectUser}
  conversations={conversations}
  refreshConversations={refreshConversations}           // ✅ Ajouter ceci
  updateConversationMessages={updateConversationMessages} // ✅ Et ceci aussi
/>

          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedChat && selectedChat.user ? (
            <ChatBox
              currentUser={currentUser}
              chat={selectedChat}
              socket={socket}
              refreshMessages={(updatedChat) => {
                console.log("🔁 Chat mis à jour depuis ChatBox :", updatedChat);
                setSelectedChat(updatedChat);
              }}
            />
          ) : (
            <Card sx={{ height: "100%", p: 4, textAlign: "center" }}>
              {t("selectConversation")}
            </Card>
          )}
        </Grid>
      </Grid>
      {/* <Footer /> */}
    </DashboardLayout>
  );
};

export default ChatPage;
