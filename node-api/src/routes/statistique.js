import express from "express";
import multer from "multer";
import path from "path";
import {Message} from "../model/message.js";
import {User} from "../model/user.js";
import { authenticate } from "../auth/middelware.js";
import { Driver } from "../model/driver.js";
import { Trip} from "../model/trip.js";
import { Camion } from "../model/camion.js";

import  { Chat } from "../model/chat.js";
const router = express.Router();


router.get("/stats/users-by-role", authenticate, async (req, res) => {
      req.body = {};

  try {
    const userCounts = await User.aggregate([
      {
        $match: {
          role: { $in: ["manager", "driver"] }
        }
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {};
    userCounts.forEach(({ _id, count }) => {
      counts[_id] = count;
    });

    res.status(200).json(counts);
  } catch (error) {
    console.error("Erreur lors du comptage des rôles :", error);
    res.status(500).json({ message: "Erreur serveur lors du comptage des utilisateurs." });
  }
});

router.get("/stats/new-accounts-per-manager", authenticate, async (req, res) => {
  try {
    // Début du mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Tous les managers
    const managers = await User.find({ role: "manager" });

    const results = await Promise.all(managers.map(async (manager) => {
      const driversCount = await Driver.countDocuments({
        createdBy: manager._id,
        created_at: { $gte: startOfMonth }
      });

      return {
        managerId: manager._id,
        managerName: `${manager.FirstName} ${manager.LastName}`,
        managerEmail: `${manager.email_user}`,
        newDriversThisMonth: driversCount
      };
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error("Erreur lors du comptage des nouveaux comptes :", error);
    res.status(500).json({ message: "Erreur serveur lors du comptage des nouveaux comptes." });
  }
});
router.get("/stats/trips-per-month-per-manager", authenticate, async (req, res) => {
  try {
    // Trouver tous les managers
    const managers = await User.find({ role: "manager" }).select("_id name email");

    // Pipeline d'agrégation pour compter les trajets par mois et par manager
    const tripsStats = await Trip.aggregate([
      {
        // Ne garder que les trajets où requestedBy est défini
        $match: {
          requestedBy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            managerId: "$requestedBy",
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Organiser les résultats par manager
    // Exemple : { managerId: "abc123", stats: [{ year, month, count }, ...] }
    const statsByManager = managers.map(manager => {
      const statsForManager = tripsStats
        .filter(stat => stat._id.managerId.toString() === manager._id.toString())
        .map(stat => ({
          year: stat._id.year,
          month: stat._id.month,
          count: stat.count
        }));

      return {
        manager: {
          _id: manager._id,
          name: manager.name,
          email: manager.email
        },
        tripsPerMonth: statsForManager
      };
    });

    res.json(statsByManager);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/stats/manager-overview", authenticate, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const managers = await User.find({ role: "manager" }).select("_id FirstName LastName email");

    const overview = await Promise.all(managers.map(async (manager) => {
      // Comptage nouveaux drivers créés ce mois par ce manager
      const newDriversCount = await Driver.countDocuments({
        createdBy: manager._id,
        created_at: { $gte: startOfMonth },
      });

      // Comptage trajets créés ce mois par ce manager (en supposant que `requestedBy` est le manager)
      const tripsCount = await Trip.countDocuments({
        requestedBy: manager._id,
        createdAt: { $gte: startOfMonth },
      });

      return {
        managerId: manager._id,
        managerName: `${manager.FirstName} ${manager.LastName}`,
        email: manager.email,
        newDriversThisMonth: newDriversCount,
        tripsThisMonth: tripsCount,
      };
    }));

    res.status(200).json(overview);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'overview :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de l'overview." });
  }
});
router.get("/stats/total-trucks", async (req, res) => {
  try {
    const totalTrucks = await Camion.countDocuments();
    res.status(200).json({ totalTrucks });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du comptage des camions.", error });
  }
});

router.get("/stats/total-trips", async (req, res) => {
  try {
    const totalTrips = await Trip.countDocuments();
    res.status(200).json({ totalTrips });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du comptage des trajets.", error });
  }
});

// GET /api/camions/status
router.get("/camions/status", async (req, res) => {
  const { status } = req.query;

  const validStatuses = ["in_service", "out_of_service", "under_maintenance"];

  try {
    if (status) {
      // Si un statut est spécifié, on vérifie s'il est valide
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }

      const count = await Camion.countDocuments({ status });
      return res.status(200).json({ status, count });
    } else {
      // Sinon, on retourne le nombre de camions par statut
      const counts = await Camion.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
      return res.status(200).json(counts);
    }
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors du comptage", error });
  }
});
router.get("/statistics/trips-consumption", async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 9, 1); // 10 mois en arrière, début du mois

    const stats = await Trip.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "camions", // nom de la collection
          localField: "truck",
          foreignField: "_id",
          as: "truckDetails",
        },
      },
      {
        $unwind: "$truckDetails",
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          tripCount: { $sum: 1 },
          totalConsumption: { $sum: "$truckDetails.consumption" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // Formater les mois manquants avec 0
    const results = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 9 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const match = stats.find(
        (s) => s._id.year === year && s._id.month === month
      );

      results.push({
        year,
        month,
        tripCount: match ? match.tripCount : 0,
        totalConsumption: match ? match.totalConsumption : 0,
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Erreur statistiques:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
  }
});

router.get("/stats/trip-cost-per-month", authenticate, async (req, res) => {
  try {
    const fuelPrice = 2.1; // Prix du litre (peut venir d'une config plus tard)

    const stats = await Trip.aggregate([
      {
        $lookup: {
          from: "camions",
          localField: "truck",
          foreignField: "_id",
          as: "truck"
        }
      },
      { $unwind: "$truck" },
      {
        $match: {
          distance: { $gt: 0 },
          "truck.consumption": { $gt: 0 }
        }
      },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          distance: 1,
          consumption: "$truck.consumption",
          cost: {
            $multiply: [
              { $divide: [{ $multiply: ["$distance", "$truck.consumption"] }, 100] },
              fuelPrice
            ]
          }
        }
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalCost: { $sum: "$cost" },
          totalDistance: { $sum: "$distance" },
          tripCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.status(200).json(stats);
  } catch (err) {
    console.error("Erreur calcul coût trajet :", err);
    res.status(500).json({ message: "Erreur lors du calcul des coûts" });
  }
});

router.get("/stats/trips-by-status-today", authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const stats = await Trip.aggregate([
      {
        $match: {
          departureDate: { $gte: today, $lt: tomorrow } // ✅ CORRECTION ICI
        }
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$departureDate" }, // idem ici
          },
          statusTrip: 1,
        },
      },
      {
        $group: {
          _id: { date: "$date", statusTrip: "$statusTrip" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id.date",
          statusTrip: "$_id.statusTrip",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Erreur stats trajets du jour :", error);
    res.status(500).json({ message: "Erreur serveur lors du comptage des trajets du jour." });
  }
});



//Manager 

router.get("/stats/my-drivers-by-status", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Agrégation pour compter les chauffeurs créés par cet utilisateur, groupés par statut
    const stats = await Driver.aggregate([
      {
        $match: {
                     createdBy: req.user._id // ✅ change ici directement
      }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Formater la réponse
    const formattedStats = {
      available: 0,
      on_route: 0,
      off_duty: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json({
      createdBy: userId,
      stats: formattedStats
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats des chauffeurs :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques." });
  }
});
router.get("/stats/my-trips-per-month", authenticate, async (req, res) => {
  try {
    const managerId = req.user._id;

    const tripsStats = await Trip.aggregate([
      {
        $match: {
          requestedBy: managerId
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          tripCount: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]);

    res.status(200).json(tripsStats);
  } catch (error) {
    console.error("Erreur récupération trajets par mois :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des trajets." });
  }
});
router.get("/stats/my-trips-consumption-cost", authenticate, async (req, res) => {
  try {
    const managerId = req.user._id;
    const fuelPrice = 2.1; // prix par litre

    const stats = await Trip.aggregate([
      {
        $match: {
          requestedBy: managerId,
          distance: { $gt: 0 } // pour éviter division par zéro
        }
      },
      {
        $lookup: {
          from: "camions",
          localField: "truck",
          foreignField: "_id",
          as: "truckDetails"
        }
      },
      {
        $unwind: "$truckDetails"
      },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          distance: 1,
          consumption: "$truckDetails.consumption",
          cost: {
            $multiply: [
              { $divide: [{ $multiply: ["$distance", "$truckDetails.consumption"] }, 100] }, // litres consommés
              fuelPrice
            ]
          }
        }
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalDistance: { $sum: "$distance" },
          totalConsumption: { $sum: { $divide: [{ $multiply: ["$distance", "$consumption"] }, 100] } }, // total litres
          totalCost: { $sum: "$cost" },
          tripCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Erreur récupération consommation et coût :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques." });
  }
});

router.get("/stats/driver-performance-per-month", authenticate, async (req, res) => {
  try {
    const managerId = req.user._id;
const debugTrips = await Trip.find({ requestedBy: managerId });
console.log("🔎 Trips trouvés pour le manager :", debugTrips.length);
console.log(debugTrips.map((t) => ({
  id: t._id,
  distance: t.distance,
  truck: t.truck,
  driver: t.driver,
})));

    const stats = await Trip.aggregate([
      {
        $match: {
          requestedBy: managerId,
          distance: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "camions",
          localField: "truck",
          foreignField: "_id",
          as: "truckDetails",
        },
      },
      { $unwind: "$truckDetails" },
      {
        $lookup: {
          from: "drivers",
          localField: "driver",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      { $unwind: "$driverDetails" },
      {
        $project: {
          driverId: "$driverDetails._id",
          driverName: {
            $concat: ["$driverDetails.firstName", " ", "$driverDetails.lastName"],
          },
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          distance: 1,
          estimatedConsumption: {
            $divide: [{ $multiply: ["$distance", "$truckDetails.consumption"] }, 100],
          },
        },
      },
      {
        $group: {
          _id: {
            driverId: "$driverId",
            driverName: "$driverName",
            year: "$year",
            month: "$month",
          },
          tripCount: { $sum: 1 },
          totalDistance: { $sum: "$distance" },
          totalConsumption: { $sum: "$estimatedConsumption" },
        },
      },
      {
        $sort: { "_id.driverName": 1, "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Erreur stats mensuelles des chauffeurs:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques mensuelles" });
  }
});
//driver 
router.get("/stats/my-weekly-trips", authenticate, async (req, res) => {
  try {
    const driverId = req.user._id;

    // Début et fin de la semaine (lundi -> dimanche)
    const today = new Date();
    const day = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const diffToMonday = (day === 0 ? -6 : 1) - day;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const stats = await Trip.aggregate([
      {
        $match: {
          driver: driverId,
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1 = dimanche, 2 = lundi, ..., 7 = samedi
        },
      },
      {
        $group: {
          _id: "$dayOfWeek",
          tripCount: { $sum: 1 },
        },
      },
    ]);

    // Init tableau avec tous les jours de la semaine (lundi = 1 -> dimanche = 7)
    const result = Array.from({ length: 7 }, (_, i) => ({
      day: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][i],
      tripCount: 0,
    }));

    stats.forEach((s) => {
      const dayIndex = (s._id + 5) % 7; // Convert MongoDB (1=Sun) to (0=Mon)
      result[dayIndex].tripCount = s.tripCount;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur stats hebdo driver :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des trajets" });
  }
});

router.get("/stats/my-weekly-consumption-cost", authenticate, async (req, res) => {
  try {
    const driverId = req.user._id;
    const fuelPrice = 2.1; // Prix par litre

    // Début de la semaine (dimanche)
    const now = new Date();
    const currentDay = now.getDay(); // 0 (Dim) à 6 (Sam)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtenir les trajets de cette semaine pour ce chauffeur
    const stats = await Trip.aggregate([
      {
        $match: {
          driver: driverId,
          createdAt: { $gte: startOfWeek },
          distance: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "camions",
          localField: "truck",
          foreignField: "_id",
          as: "truckDetails",
        },
      },
      { $unwind: "$truckDetails" },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1 (Dim) à 7 (Sam)
          distance: 1,
          consumption: "$truckDetails.consumption",
          fuelUsed: {
            $divide: [{ $multiply: ["$distance", "$truckDetails.consumption"] }, 100],
          },
        },
      },
      {
        $project: {
          dayOfWeek: 1,
          fuelUsed: 1,
          cost: { $multiply: ["$fuelUsed", fuelPrice] },
        },
      },
      {
        $group: {
          _id: "$dayOfWeek",
          totalFuel: { $sum: "$fuelUsed" },
          totalCost: { $sum: "$cost" },
          tripCount: { $sum: 1 },
        },
      },
    ]);

    // Mapper les résultats pour inclure tous les jours de la semaine (1 = Dimanche)
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const result = [];

    for (let i = 1; i <= 7; i++) {
      const stat = stats.find((s) => s._id === i);
      result.push({
        day: dayNames[i - 1],
        tripCount: stat ? stat.tripCount : 0,
        totalFuel: stat ? stat.totalFuel.toFixed(2) : 0,
        totalCost: stat ? stat.totalCost.toFixed(2) : 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Erreur consommation/cout par jour:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
