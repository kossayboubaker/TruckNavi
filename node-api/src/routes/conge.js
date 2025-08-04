import express from "express";
import { Conge } from "../model/conge.js";
import { User } from "../model/user.js";
import { Trip } from "../model/trip.js";
import { Notification } from "../model/notification.js";
import { authenticate } from "../auth/middelware.js";
import nodemailer from "nodemailer";
import multer from "multer";
import { io } from "../index.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const leaveTokens = new Map(); // token -> { congeId, userId }

const router = express.Router();

export const isManager = (user) => {
  return user.role === "manager";
};

export const isSuperAdmin = (user) => {
  return user.role === "super_admin";
};

export const isDriver = (user) => {
  return user.role === "driver";
};

// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: "ipact2021@gmail.com",
    pass: "xvrlclpmqdqdjnwg",
  },
});


// ✅ Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/justificatifs/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PDF, JPEG et PNG sont autorisés."));
    }
  },
});

// ✅ Ajouter une demande de congé avec justificatif
router.post("/add", authenticate, upload.single("justificatif"), async (req, res) => {
  try {
    const allowedRoles = ["manager", "driver"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Seuls les managers ou chauffeurs peuvent faire une demande de congé." });
    }

    const { startDate, endDate, typeConge, reason } = req.body;

    if (endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "La date de fin ne peut pas être antérieure à la date de début." });
    }

    let calculatedPeriod = "1 jour";
    if (endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffInDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      calculatedPeriod = diffInDays <= 1 ? "1 jour" : `${diffInDays} jours`;
    }

    const conge = new Conge({
      user: req.user._id,
      startDate,
      endDate,
      typeConge,
      reason,
      periode: calculatedPeriod,
      justificatif: req.file ? req.file.path : undefined,
    });

    await conge.save();

    const token = uuidv4();
    leaveTokens.set(token, { congeId: conge._id, userId: req.user._id });

    let recipientUser;
    console.log("🟡 createdBy du demandeur:", req.user.createdBy);

    // ✅ Vérifie si createdBy est défini
    if (req.user.createdBy) {
      const creator = await User.findById(req.user.createdBy);
      console.log("🟢 Utilisateur créateur trouvé:", creator?.email_user);
      if (creator && creator.email_user) {
        recipientUser = creator;
      }
    }

    // ❗Si createdBy n'est pas défini ou invalide → fallback vers super_admin
    if (!recipientUser) {
      console.log("🔴 Aucune valeur valide pour createdBy, on utilise le super_admin");
      const superAdmin = await User.findOne({ role: "super_admin" });
      if (!superAdmin || !superAdmin.email_user) {
        return res.status(400).json({ message: "Email du super administrateur non défini." });
      }
      recipientUser = superAdmin;
    }
    console.log("📬 Notification envoyée à:", recipientUser.email_user);

    // 📧 Envoi de l'email
    await transporter.sendMail({
      from: '"ExypnoTech" <ipact2021@gmail.com>',
      to: recipientUser.email_user,
      subject: "Nouvelle demande de congé",
      html: `
        <p>Une nouvelle demande de congé a été soumise par ${req.user.FirstName} ${req.user.LastName}.</p>
        <p>
          <a href="http://localhost:8080/conge/validate/${token}/accept" style="padding: 10px 15px; background-color: green; color: white; text-decoration: none;">Accepter</a>
          &nbsp;
          <a href="http://localhost:8080/conge/validate/${token}/reject" style="padding: 10px 15px; background-color: red; color: white; text-decoration: none;">Refuser</a>
        </p>
      `,
    });

    // 🔔 Créer une notification
    const notif = await Notification.create({
      recipient: recipientUser._id,
      sender: req.user._id,
      type: "leave_request",
      title: "Nouvelle demande de congé",
      message: `${req.user.FirstName} ${req.user.LastName} a soumis une demande de congé.`,
      relatedEntity: conge._id,
      entityType: "Leave",
      token,
    });

    // 🔊 Émettre la notification en temps réel
    io.to(recipientUser._id.toString()).emit("leave_request", notif);

    res.status(201).json({ message: "Demande de congé envoyée avec justificatif", conge });

  } catch (err) {
    console.error("Erreur : ", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});



// ✅ Accepter une demande
router.get("/validate/:token/accept", async (req, res) => {
  const { token } = req.params;
  const data = leaveTokens.get(token);
  if (!data) return res.status(400).send("Lien invalide ou expiré.");

  const conge = await Conge.findById(data.congeId).populate("user");
  if (!conge) return res.status(404).send("Demande introuvable.");

  conge.status = "approved";
  conge.validatedBy = data.userId;
  await conge.save();
  leaveTokens.delete(token);

  await transporter.sendMail({
    from: '"ExypnoTech" <ipact2021@gmail.com>',
    to: conge.user.email_user,
    subject: "Demande de congé acceptée",
    text: "Votre demande de congé a été acceptée.",
  });

  // ✅ Notification vers le demandeur
  const notif = await Notification.create({
    recipient: conge.user._id,
    sender: data.userId,
    type: "leave_request",
    title: "Demande de congé acceptée",
    message: `Votre demande de congé du ${conge.startDate.toDateString()} a été acceptée.`,
    relatedEntity: conge._id,
    entityType: "Leave",
  });

  io.to(conge.user._id.toString()).emit("leave_request", notif);

  return res.send("Demande acceptée.");
});

// ✅ Refuser une demande
router.get("/validate/:token/reject", async (req, res) => {
  const { token } = req.params;
  const data = leaveTokens.get(token);
  if (!data) return res.status(400).send("Lien invalide ou expiré.");

  const conge = await Conge.findById(data.congeId).populate("user");
  if (!conge) return res.status(404).send("Demande introuvable.");

   await Conge.findByIdAndDelete(conge._id);
  leaveTokens.delete(token);

  await transporter.sendMail({
    from: '"ExypnoTech" <ipact2021@gmail.com>',
    to: conge.user.email_user,
    subject: "Demande de congé refusée",
    text: "Votre demande de congé a été refusée.",
  });

  // ✅ Notification vers le demandeur
  const notif = await Notification.create({
    recipient: conge.user._id,
    sender: data.userId,
    type: "leave_request",
    title: "Demande de congé refusée",
    message: `Votre demande de congé du ${conge.startDate.toDateString()} a été refusée.`,
    relatedEntity: conge._id,
    entityType: "Leave",
  });

  io.to(conge.user._id.toString()).emit("leave_request", notif);

  return res.send("Demande refusée.");
});


// ✅ Route : Afficher toutes les demandes (Manager ou SuperAdmin)
router.get("/", authenticate, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && !isManager(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const conges = await Conge.find().populate("user validatedBy");
    res.json(conges);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ✅ Route : Afficher les demandes du user connecté
router.get("/my", authenticate, async (req, res) => {
  try {
    const conges = await Conge.find({ user: req.user._id });
    res.json(conges);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ✅ Route : Modifier une demande (tant qu'elle est "pending")
router.put("/edit/:id", authenticate, async (req, res) => {
  try {
    const conge = await Conge.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "pending",
    });

    if (!conge) {
      return res.status(404).json({ message: "Demande non trouvée ou déjà traitée" });
    }

    Object.assign(conge, req.body);
    await conge.save();

    res.json({ message: "Demande modifiée", conge });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});



// ✅ Route : Supprimer une demande (si pending)
router.delete("/delete/:id", authenticate, async (req, res) => {
  try {
    const conge = await Conge.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      status: "pending",
    });

    if (!conge) {
      return res.status(404).json({ message: "Demande non trouvée ou déjà traitée" });
    }

    res.json({ message: "Demande supprimée", conge });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});



router.get("/global/overview", authenticate, async (req, res) => {
  try {
    const role = req.user.role;

    // Autorisé uniquement pour les SuperAdmin ou Manager
    if (!isSuperAdmin(req.user) && !isManager(req.user)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const [trips, conges] = await Promise.all([
      Trip.find()
        .populate("driver", "FirstName LastName email_user")
        .populate("truck", "brand registration"),
      Conge.find()
        .populate("user", "FirstName LastName email_user")
        .populate("validatedBy", "FirstName LastName email_user")
    ]);

    res.json({
      success: true,
      data: {
        trips,
        conges
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});
router.get("/user/conges-infos-by-name/:name", authenticate, async (req, res) => {
  try {
    const { name } = req.params;

    // Nettoyage du nom complet
   const cleanedFullName = name.replace(/\s+/g, " ").trim(); // "wrida    khriji " → "wrida khriji"
const [FirstName, ...lastParts] = cleanedFullName.split(" ");
const LastName = lastParts.join(" ").trim();

// Recherche flexible, insensible aux majuscules et espaces parasites
const user = await User.findOne({
  FirstName: { $regex: `^${FirstName}$`, $options: "i" },
  LastName: { $regex: `^${LastName}$`, $options: "i" },
});


    console.log("Recherche utilisateur avec prénom :", FirstName, "et nom :", LastName);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (isManager(user)) {
      const conges = await Conge.find({ user: user._id })
        .populate("validatedBy", "FirstName LastName email_user");

      return res.json({
        role: "manager",
        user: {
          FirstName: user.FirstName,
          LastName: user.LastName,
          email: user.email_user,
        },
        conges,
      });
    }

    if (isDriver(user)) {
       const [trips, conges] = await Promise.all([
      Trip.find({ user: user._id })
        .populate("driver", "FirstName LastName email_user")
        .populate("truck", "brand registration"),
      Conge.find({ user: user._id })
        .populate("user", "FirstName LastName email_user")
        .populate("validatedBy", "FirstName LastName email_user")
    ]);
console.log("Trajets trouvés pour le chauffeur :", trips);
console.log("Congés trouvés pour le chauffeur :", conges);


      return res.json({
        role: "driver",
        user: {
          FirstName: user.FirstName,
          LastName: user.LastName,
          email: user.email_user,
        },
        conges,
        trips,
      });
    }

    return res.status(403).json({ message: "Accès réservé aux managers et chauffeurs." });

  } catch (err) {
    console.error("Erreur :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});



export default router;
