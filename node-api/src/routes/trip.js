import express from "express";
import moment from "moment";
import nodemailer from "nodemailer";
import { Trip } from "../model/trip.js";
import { Driver } from "../model/driver.js";
import { Camion } from "../model/camion.js";
import { Notification } from "../model/notification.js";
import { authenticate } from "../auth/middelware.js";
import { io } from "../index.js";
import { User } from "../model/user.js";

const router = express.Router();

// ✅ Transporteur mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: "ipact2021@gmail.com",
    pass: "xvrlclpmqdqdjnwg", // 🔐 À stocker dans .env pour la sécurité
  },
});

// ✅ Fonction pour envoyer l'email au chauffeur
const sendDriverAssignmentEmail = async (to, { driverName, startPoint, destination, departureDate, departureTime }) => {
  const subject = "🚚 Nouveau trajet assigné";
  const html = `
    <p>Bonjour ${driverName},</p>
    <p>Vous avez été <strong>assigné à un nouveau trajet</strong>.</p>
    <p><strong>Détails du trajet :</strong></p>
    <ul>
      <li><strong>Départ :</strong> ${startPoint}</li>
      <li><strong>Destination :</strong> ${destination}</li>
      <li><strong>Date :</strong> ${new Date(departureDate).toLocaleDateString()}</li>
      <li><strong>Heure :</strong> ${departureTime}</li>
    </ul>
    <p>Merci de vérifier votre tableau de bord pour plus d'informations.</p>
    <p>Cordialement,<br/>L'équipe ExypnoTech</p>
  `;

  await transporter.sendMail({
    from: '"ExypnoTech" <ipact2021@gmail.com>',
    to,
    subject,
    html,
  });
};

 const sendTripRequestToAdmin = async (to, trip) => {
            const subject = "🛣️ Nouveau trajet proposé par un manager";
            const validationUrl = `${"http://localhost:8080"}/trip/validation/${trip._id}`;

            const html = `
                <p>Bonjour Super Admin,</p>
                <p>Un manager a proposé un nouveau trajet :</p>
                <ul>
                <li><strong>Départ :</strong> ${trip.startPoint}</li>
                <li><strong>Destination :</strong> ${trip.destination}</li>
                <li><strong>Date :</strong> ${new Date(trip.departureDate).toLocaleDateString()}</li>
                <li><strong>Heure :</strong> ${trip.departureTime}</li>
                <li><strong>Chauffeur :</strong> ${trip.driver?.FirstName || ""} ${trip.driver?.LastName || ""}</li>
                </ul>

                <p>Vous pouvez :</p>
                <a href="${validationUrl}?action=accept" style="padding:10px 15px;background:#28a745;color:#fff;text-decoration:none;border-radius:5px;">✅ Accepter</a>
                &nbsp;
                <a href="${validationUrl}?action=refuse" style="padding:10px 15px;background:#dc3545;color:#fff;text-decoration:none;border-radius:5px;">❌ Refuser</a>

                <p>Cordialement,<br/>ExypnoTech</p>
            `;

            await transporter.sendMail({
                from: '"ExypnoTech" <ipact2021@gmail.com>',
                to,
                subject,
                html,
            });
            };

// ✅ Vérifie si utilisateur est super admin
const isSuperAdmin = (user) => user && user.role === "super_admin";
const isManager = (user) => user && user.role === "manager";
// 🚚 Liste des chauffeurs disponibles
router.get("/available-drivers", authenticate, async (req, res) => {
  try {
    const drivers = await Driver.find({ status: "available" });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des chauffeurs", error: err.message });
  }
});
async function sendTripUpdateToDriver(email, { startPoint, destination, departureDate, departureTime }) {
  // utiliser nodemailer ici
  await transporter.sendMail({
    from: '"ExypnoTech" <ipact2021@gmail.com>',
    to: email,
    subject: "🛣️ Modification de votre trajet",
    text: `Votre trajet a été modifié :
- Départ : ${startPoint}
- Destination : ${destination}
- Date : ${new Date(departureDate).toLocaleDateString()}
- Heure : ${departureTime}`
  });
}

async function sendTripCancellationToDriver(email, { startPoint, destination, departureDate, departureTime }) {
  await transporter.sendMail({
    from: '"ExypnoTech" <ipact2021@gmail.com>',
    to: email,
    subject: "🚫 Annulation de trajet",
    text: `Votre trajet a été annulé :
- Départ : ${startPoint}
- Destination : ${destination}
- Date : ${new Date(departureDate).toLocaleDateString()}
- Heure : ${departureTime}`
  });
}

// 🚛 Liste des camions en service
router.get("/available-trucks", authenticate, async (req, res) => {
  try {
    const trucks = await Camion.find({ status: "in_service" });
    res.json(trucks);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des camions", error: err.message });
  }
});

// ➕ Créer un trajet
router.post("/", authenticate, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: "Accès refusé. Réservé au super administrateur." });
    }

    const { truck, driver, startPoint, destination, departureDate, departureTime } = req.body;

    const selectedTruck = await Camion.findById(truck);
    const selectedDriver = await Driver.findById(driver);

    if (!selectedTruck || selectedTruck.status !== "in_service") {
      return res.status(400).json({ message: "Camion non valide ou non disponible." });
    }

    if (!selectedDriver || selectedDriver.status !== "available") {
      return res.status(400).json({ message: "Chauffeur non valide ou non disponible." });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(departureTime)) {
      return res.status(400).json({
        message: "Format de l'heure invalide. Utilisez le format HH:mm (ex: 08:00).",
      });
    }
const today = moment().startOf("day");
    const tripDate = moment(departureDate).startOf("day");

    if (tripDate.isSame(today, "day")) {
      await Camion.findByIdAndUpdate(truck, { status: "in_service" });
      await Driver.findByIdAndUpdate(driver, { status: "on_route" });
    }

    Trip.find()
  .populate("driver", "FirstName LastName")
  .populate("truck", "truckId")
  .exec((err, trips) => {
    // retourner trips avec chauffeur et camion peuplés
  });


    const newTrip = new Trip({
      truck,
      driver,
      startPoint,
      destination,
      departureDate,
      departureTime,
      statusTrip: "in_progress",
    });

    await newTrip.save();

    

    // 🔔 Notification au chauffeur
    const notif = new Notification({
      recipient: driver,
      sender: req.user._id,
      type: "driver_assignment",
      title: "🛣️Nouveau trajet assigné",
      message: `Vous avez été assigné à un trajet de ${startPoint} vers ${destination}.`,
      relatedEntity: newTrip._id,
      entityType: "Trajet",
    });
    await notif.save();
    io.to(driver.toString()).emit("new_notification", notif);
    
    console.log("🚨 Driver complet:", selectedDriver);

    // Avant d'envoyer l'email
  if (!selectedDriver.email_user) {
  return res.status(400).json({ message: "Email du chauffeur non défini. Impossible d'envoyer le mail." });
}
    // 📧 Envoi d'email
    await sendDriverAssignmentEmail(selectedDriver.email_user, {
      driverName: `${selectedDriver.FirstName} ${selectedDriver.LastName}`,
      startPoint,
      destination,
      departureDate,
      departureTime,
    });

    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création du trajet", error: err.message });
  }
});

// 🔄 Modifier un trajet
router.put("/:id", authenticate, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && !isManager(req.user)) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const oldTrip = await Trip.findById(req.params.id).populate("driver");
    if (!oldTrip) return res.status(404).json({ message: "Trajet non trouvé" });

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("driver");

    // ✅ Envoyer email de modification au chauffeur
    if (updatedTrip?.driver?.email_user) {
      await sendTripUpdateToDriver(updatedTrip.driver.email_user, {
        startPoint: updatedTrip.startPoint,
        destination: updatedTrip.destination,
        departureDate: updatedTrip.departureDate,
        departureTime: updatedTrip.departureTime,
      });

      // ✅ Créer notification
      const notif = new Notification({
        recipient: updatedTrip.driver._id,
        sender: req.user._id,
        type: "driver_assignment",
        title: "✏️ Trajet modifié",
        message: `Le trajet de ${updatedTrip.startPoint} vers ${updatedTrip.destination} prévu le ${new Date(updatedTrip.departureDate).toLocaleDateString()} à ${updatedTrip.departureTime} a été modifié.`,
        relatedEntity: updatedTrip._id,
        entityType: "Trajet",
      });

      await notif.save();
      io.to(updatedTrip.driver._id.toString()).emit("driver_assignment", notif);
    }

    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
});

// 📋 Liste des trajets
router.get("/", authenticate, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const trips = await Trip.find()
      .populate("driver", "FirstName LastName email_user")
     // .populate("driver", "name email")
      .populate("truck", "truckType truckId");

    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des trajets", error: err.message });
  }
});

// ❌ Supprimer un trajet
router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && !isManager(req.user)) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const trip = await Trip.findById(req.params.id).populate("driver");
    if (!trip) return res.status(404).json({ message: "Trajet non trouvé" });

    await Trip.findByIdAndDelete(req.params.id);
    await Driver.findByIdAndUpdate(trip.driver._id, { status: "available" });
    await Camion.findByIdAndUpdate(trip.truck, { status: "in_service" });

    // ✅ Envoyer email d’annulation au chauffeur
    if (trip.driver?.email_user) {
      await sendTripCancellationToDriver(trip.driver.email_user, {
        startPoint: trip.startPoint,
        destination: trip.destination,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
      });

      // ✅ Notification d’annulation
      const notif = new Notification({
        recipient: trip.driver._id,
        sender: req.user._id,
        type: "driver_assignment",
        title: "🚫 Trajet annulé",
        message: `Le trajet de ${trip.startPoint} vers ${trip.destination} prévu le ${new Date(trip.departureDate).toLocaleDateString()} à ${trip.departureTime} a été annulé.`,
        relatedEntity: trip._id,
        entityType: "Trajet",
      });

      await notif.save();
      io.to(trip.driver._id.toString()).emit("driver_assignment", notif);
    }

    res.json({ message: "Trajet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
});



// ✅ Ajout de trajet par le manager
router.post("/request", authenticate, async (req, res) => {
  try {
    if (!isManager(req.user)) {
      return res.status(403).json({ message: "Accès refusé. Réservé aux managers." });
    }

    const { truck, driver, startPoint, destination, departureDate, departureTime } = req.body;
    // const token = uuidv4(); // génère un token unique

    const newTrip = new Trip({
      truck,
      driver,
      startPoint,
      destination,
      departureDate,
      departureTime,
      statusTrip: "pending",
      requestedBy: req.user._id,
    });

    await newTrip.save();

    // ✅ Charger les infos chauffeur pour l'email (nom et prénom)
    const driverDetails = await Driver.findById(driver);
    // ✅ Envoyer email au super admin
    const superAdminUser = await User.findOne({ role: "super_admin" });

if (!superAdminUser || !superAdminUser.email_user) {
  return res.status(400).json({ message: "Email du super administrateur non défini." });
}
   // 📧 Envoyer email dynamique au super admin
await sendTripRequestToAdmin(superAdminUser.email_user, {
      ...newTrip.toObject(),
      driver: {
        FirstName: driverDetails?.FirstName,
        LastName: driverDetails?.LastName,
      },
    });
async function getSuperAdminId() {
  const admin = await User.findOne({ role: "super_admin" });
  return admin?._id;
}
const superAdmin=await getSuperAdminId();
    // ✅ Créer une notification pour le super admin
    const notif = new Notification({
      recipient:  superAdmin,  
      sender: req.user._id,
      type: "driver_assignment",
      title: "🛣️Nouveau trajet en attente",
      message: `Un nouveau trajet a été proposé par le manager pour le chauffeur ${driverDetails?.FirstName || ""} ${driverDetails?.LastName || ""}.
        Départ : ${startPoint} - Destination : ${destination} - Date : ${new Date(departureDate).toLocaleDateString()} - Heure : ${departureTime}
        // `,
      relatedEntity: newTrip._id,
      entityType: "Trajet",

    });

    await notif.save();
    io.emit("new_trip_request", notif);
      io.to(superAdmin._id.toString()).emit("driver_assignment", notif);

    res.status(200).json({ message: "Trajet demandé avec succès. En attente d'approbation." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la demande de trajet", error: err.message });
  }
});
  // GET /trip/validation/:id
router.get("/validation/:id",async (req, res) => {
  const { action } = req.query;
  const { id } = req.params;

  try {
    const trip = await Trip.findById(id).populate("driver").populate("requestedBy");

    if (!trip) return res.status(404).send("Trajet introuvable");

    if (action === "accept") {
      trip.statusTrip = "in_progress";
      await trip.save();
      // await Driver.findByIdAndUpdate(trip.driver._id, { status: "on_route" });
      // await Camion.findByIdAndUpdate(trip.truck, { status: "in_service" });
const notifToManager = new Notification({
        recipient: trip.requestedBy._id,
        sender: null,
        type: "driver_assignment",
        title: "Trajet confirmé",
        message: `Le trajet de ${trip.startPoint} vers ${trip.destination} a été confirmé.`,
        relatedEntity: trip._id,
        entityType: "Trajet",
      });
      await notifToManager.save();
      io.to(trip.requestedBy._id.toString()).emit("driver_assignment", notifToManager);

      if (!trip.driver.email_user) {
        return res.status(400).json({ message: "Email du chauffeur non défini. Impossible d'envoyer le mail." });
      }
           


      const notifToDriver = new Notification({
        recipient: trip.driver._id,
        sender: null,
        type: "driver_assignment",
        title: "Nouveau trajet confirmé",
        message: `Vous avez été assigné à un trajet de ${trip.startPoint} vers ${trip.destination}.`,
        relatedEntity: trip._id,
        entityType: "Trajet",
      });
      await notifToDriver.save();
      io.to(trip.driver._id.toString()).emit("new_notification", notifToDriver);

      res.json({ message: "Trajet confirmé et notifications envoyées." });
    } else if (action === "refuse") {
      // await Trip.findByIdAndDelete(id);
      await Trip.findByIdAndDelete(req.params.id);

      const notifToManager = new Notification({
        recipient: trip.requestedBy._id,
        sender: null,
        type: "driver_assignment",
        title: "Trajet refusé",
        message: `Le trajet de ${trip.startPoint} vers ${trip.destination} a été refusé.`,
      });
      await notifToManager.save();
      io.to(trip.requestedBy._id.toString()).emit("driver_assignment", notifToManager);

      res.json({ message: "Trajet refusé et notification envoyée." });

    } else {
      return res.status(400).send("Action invalide");
    }
  } catch (err) {
    return res.status(500).send("Erreur serveur : " + err.message);
  }
});

router.get("/my-trips", authenticate, async (req, res) => {
  try {
    const managerId = req.user._id;

    const trips = await Trip.find({ createdBy: managerId })
      .populate("truck")
      .populate("driver");

    res.json(trips);
  } catch (err) {
    console.error("Erreur lors du chargement des trajets du manager :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


router.get("/driver/trips", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Accès réservé aux chauffeurs." });
    }

    const trips = await Trip.find({ driver: req.user._id })
      .populate("truck", "truckType truckId")
      .sort({ departureDate: 1 });

    res.json(trips);
  } catch (err) {
    console.error("Erreur lors de la récupération des trajets du chauffeur :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

 // GET /trips/manager
router.get("/manager", authenticate, async (req, res) => {
  try {
    // Vérifie que l'utilisateur est un manager
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Accès réservé aux managers." });
    }

    // Cherche les trajets demandés par ce manager
    const trips = await Trip.find({ requestedBy: req.user._id })
      .populate("truck", "truckType truckId")
      .populate("driver", "FirstName LastName email_user")
      .sort({ departureDate: 1 });

    res.json(trips);
  } catch (err) {
    console.error("Erreur lors de la récupération des trajets manager:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// // ✅ Super admin approuve/rejette une demande
// router.post("/validate/:id", authenticate, async (req, res) => {
//   try {
//     if (!isSuperAdmin(req.user)) {
//       return res.status(403).json({ message: "Accès refusé." });
//     }

//     const { action } = req.body; // "accept" ou "refuse"
//     const trip = await Trip.findById(req.params.id).populate("driver").populate("requestedBy");

//     if (!trip) return res.status(404).json({ message: "Trajet non trouvé" });

//     if (action === "accept") {
//       trip.statusTrip = "in_progress";
//       await trip.save();

//       await Driver.findByIdAndUpdate(trip.driver._id, { status: "on_route" });
//       await Camion.findByIdAndUpdate(trip.truck, { status: "in_service" });

      
//     } else {
//       await Trip.findByIdAndDelete(req.params.id);

//       const notifToManager = new Notification({
//         recipient: trip.requestedBy._id,
//         sender: req.user._id,
//         type: "driver_assignment",
//         title: "Trajet refusé",
//         message: `Le trajet de ${trip.startPoint} vers ${trip.destination} a été refusé.`,
//         relatedEntity: trip._id, // AJOUT IMPORTANT

//       });
//       await notifToManager.save();
//       io.to(trip.requestedBy._id.toString()).emit("driver_assignment", notifToManager);

//       res.json({ message: "Trajet refusé et notification envoyée." });
//     }
//   } catch (err) {
//     res.status(500).json({ message: "Erreur lors de la validation du trajet", error: err.message });
//   }
// });
// Autorise Super Admin et Manager
const requireAdminOrManager = (req, res, next) => {
  const allowedRoles = ["super_admin", "manager"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé. Réservé au Super Admin ou Manager." });
  }
  next();
};
router.put('/:id/status', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const { statusTrip, routeProgress, isCompleted } = req.body;
    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, { statusTrip, routeProgress, isCompleted }, { new: true, runValidators: true });
    if (!updatedTrip) return res.status(404).json({ message: "Trip non trouvé" });
    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
});
export default router;
