import express from "express";
import { Camion } from "../model/camion.js";
import { authenticate } from "../auth/middelware.js";

const router = express.Router();

// Autorise Super Admin et Manager
const requireAdminOrManager = (req, res, next) => {
  const allowedRoles = ["super_admin", "manager"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé. Réservé au Super Admin ou Manager." });
  }
  next();
};

// ➕ Ajouter un camion
router.post("/", authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const {
      truckId,
      truckType,
      weight,
      height,
      width,
      length,
      axleCount,
      fuelType,
      fuelConsumption,
      emissionRate,
      ecoMode,
      hazardousCargo,
      maxAllowedSpeed,
      status,
    } = req.body;

    // Validation simple
    if (!truckId || !truckType || !weight || !height || !width || !length || !axleCount || !fuelType) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
    }

    const newTruck = new Camion({
      truckId,
      truckType,
      weight,
      height,
      width,
      length,
      axleCount,
      fuelType,
      fuelConsumption,
      emissionRate,
      ecoMode,
      hazardousCargo,
      maxAllowedSpeed,
      status: status || "out_of_service", // valeur par défaut
    });

    await newTruck.save();
    res.status(201).json(newTruck);
  } catch (err) {
    console.error("Erreur ajout camion:", err);
    res.status(400).json({ message: "Erreur lors de l'ajout", error: err.message });
  }
});

// 🔄 Modifier un camion
router.put("/:id", authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const updatedTruck = await Camion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTruck) {
      return res.status(404).json({ message: "Camion non trouvé" });
    }
    res.json(updatedTruck);
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
});

// 📄 Liste de tous les camions
router.get("/", authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const camions = await Camion.find();
    res.json(camions);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: err.message });
  }
});

// ❌ Supprimer un camion
router.delete("/:id", authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const deletedTruck = await Camion.findByIdAndDelete(req.params.id);
    if (!deletedTruck) {
      return res.status(404).json({ message: "Camion non trouvé" });
    }
    res.json({ message: "Camion supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
});

// 📍 Récupérer tous les camions
router.get('/', async (req, res) => {
  try {
    const camions = await Camion.find().sort({ updatedAt: -1 });
    res.json(camions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📍 Récupérer un camion par ID
router.get('/:id', async (req, res) => {
  try {
    const camion = await Camion.findOne({ truckId: req.params.id });
    if (!camion) return res.status(404).json({ error: 'Not found' });
    res.json(camion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
