import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  Avatar,
  Typography,
  ListItemAvatar,
  Badge,
} from "@mui/material";
import axios from "axios";

const ConversationList = ({ currentUser, users, onSelect, conversations, refreshConversations ,updateConversationMessages,}) => {
  const getLastMessageForUser = (userId) => {
    if (!Array.isArray(conversations)) return null;

    const conv = conversations.find((c) => {
      if (!c?.members || !Array.isArray(c.members)) return false;

      const membersSet = new Set(c.members.map(String));
      return (
        membersSet.has(String(userId)) &&
        membersSet.has(String(currentUser._id))
      );
    });

    if (conv?.messages?.length > 0) {
      return conv.messages[conv.messages.length - 1]; // renvoie le message complet
    }

    return null;
  };

const handleSelect = async (user, lastMessage) => {
  if (
    lastMessage &&
    lastMessage.senderId !== currentUser._id &&
    lastMessage.seenBy !== currentUser._id
  ) {
    try {
      await axios.put(`/messenger/message/markSeen/${lastMessage._id}`, {
        userId: currentUser._id,
      });
      // ✅ Attendre que refreshConversations termine
      await refreshConversations();
    } catch (err) {
      console.error("Erreur marquage comme lu :", err);
    }
  }

  // ✅ Déplacer ici après mise à jour des données
  onSelect(user);
};


  return (
    <List>
      {users
        .filter((u) => u._id !== currentUser?._id)
        .map((user) => {
          const lastMessage = getLastMessageForUser(user._id);
          const isUnread =
            lastMessage &&
            lastMessage.senderId !== currentUser._id &&
            !lastMessage.seen;

          const lastMessageText = lastMessage
            ? lastMessage.text
              ? lastMessage.text.length > 30
                ? lastMessage.text.slice(0, 30) + "..."
                : lastMessage.text
              : "[Fichier envoyé]"
            : "Aucun message";

          const avatarUrl =
            user.image || user.image_user
              ? `http://localhost:8080/uploads/${user.image || user.image_user}`
              : null;

          return (
            <ListItem
              key={user._id}
              button
              alignItems="flex-start"
              onClick={() => handleSelect(user, lastMessage)}
            >
              <ListItemAvatar>
                <Badge
                  color="success"
                  variant="dot"
                  overlap="circular"
                  invisible={!user.isOnline}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  sx={{
                    "& .MuiBadge-badge": {
                      border: "2px solid white",
                      height: "12px",
                      minWidth: "12px",
                      borderRadius: "50%",
                    },
                  }}
                >
                  <Avatar src={avatarUrl}>
                    {!avatarUrl && user.FirstName?.[0]}
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <>
                    {user.FirstName} {user.LastName}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      ({user.role})
                    </Typography>
                  </>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                      fontWeight: isUnread ? "bold" : "normal",
                    }}
                    noWrap
                  >
                    {lastMessageText}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
    </List>
  );
};

export default ConversationList;
