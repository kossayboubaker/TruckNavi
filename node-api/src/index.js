import express from "express";
 import http from "http";
 import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import "./passport.js";
import passport from 'passport';
import  session  from'express-session';
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { dbConnect } from "./mongo/index.js";
//import { meRoutes, authRoutes } from "./routes";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import ReseedAction from './mongo/ReseedAction.js'
import cookieParser from 'cookie-parser';

// Import routes with 'import'
//import userRoutes from './routes/auth/user.js';
//import adminRoutes from './routes/auth/admin.js';
import userRoutes  from "./routes/users/user.js";
import camionRoutes from "./routes/camion.js";
import tripRoutes from "./routes/trip.js";
import congeRoutes from "./routes/conge.js";
import messengerRoutes from"./routes/messenger.js";
import statisticRoutes from "./routes/statistique.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import socketServer from "./socket.js"; // ton fichier serveur socket
import  runConsumer  from "./kafka/consumer.js";
// Détermination du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
//socket 
const server = http.createServer(app);


//const server = http.createServer(app); // Crée un vrai serveur HTTP pour socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // ton front React
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.use((req, res, next) => {
  req.io = io;
  next();
});
runConsumer(io);
io.on("connection", (socket) => {
  console.log("Client connecté :", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId); // 👈 ajoute le socket dans la room de l'utilisateur
    console.log(`✅ User with ID ${userId} joined their room`);
  }

  socket.on("join", (userId) => {
    socket.join(userId); // Rejoindre une room spécifique à l'utilisateur
    console.log(`User with ID ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Client déconnecté :", socket.id);
  });
});

export { io };

const socketControl = socketServer(io);
app.set("getOnlineUsers", socketControl.getOnlineUsers);

app.use(cookieParser());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// CORS setup: Allow only specific origins (client URLs) for added security
const whitelist = [process.env.APP_URL_CLIENT || "http://localhost:3000"]; // Default to localhost if not in .env
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
};
dbConnect()
// Use CORS middleware
app.use(cors({
  origin: "http://localhost:3000", // l'adresse de ton frontend
  credentials: true // IMPORTANT
}));
// Database connection
//dbConnect();
// Session middleware
app.use(session({
  secret: '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', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookies:{
    secure: false,
    maxAge: 1000 * 60 * 60 *24 
  }
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());
// Body parser middleware
app.use(express.json());

// Serve landing page (if applicable)
app.get("/", function (req, res) {
  const __dirname = fs.realpathSync(".");
  res.sendFile(path.join(__dirname, "/src/landing/index.html"));
});

// Use imported routes
//app.use("/me", meRoutes);
app.use('/user', userRoutes);
app.use('/camion',camionRoutes);
app.use('/trip',tripRoutes);
app.use('/conge',congeRoutes);
app.use('/messenger', messengerRoutes);
app.use('/statistic',statisticRoutes);

//app.use('/admin', adminRoutes);

// Schedule Cron job for reseeding action
if (process.env.SCHEDULE_HOUR) {
  cron.schedule(`0 */${process.env.SCHEDULE_HOUR} * * *`, () => {
    ReseedAction();
  });
}
runConsumer(io).catch(console.error);

// Start the server
server.listen(PORT, () => console.log(`✅ Server and Socket.IO listening on port ${PORT}`));
