import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "context"; // Vérifie ce chemin selon ton projet
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?._id) {
      const newSocket = io("http://localhost:8080", {
          transports: ["websocket"],       // Force WebSocket uniquement
          withCredentials: true,           // Si backend gère les cookies/session
          query: { userId: user._id }, // ✅ Ajouter ceci

        });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("🔌 Connecté au serveur WebSocket :", newSocket.id);
        newSocket.emit("join", user._id); // ✅ Join room
      });


      newSocket.on("connect_error", (err) => {
        console.error("❌ Erreur de connexion WebSocket :", err.message);
      });
        // 🔔 Réception de notification
      newSocket.on("notification", (data) => {
        const message = formatNotificationMessage(data?.message || "Nouvelle notification");
        toast.info(message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      });
      return () => {
        newSocket.disconnect();
      };
    }
  },[user?._id]);
  // 🔤 Formatage : première lettre majuscule, le reste minuscule
  const formatNotificationMessage = (message) => {
    const trimmed = message?.trim().toLowerCase();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };
  return (
    <SocketContext.Provider value={socket}>
      <>
        {children}
        <ToastContainer />
      </>
          </SocketContext.Provider>
  );
};
