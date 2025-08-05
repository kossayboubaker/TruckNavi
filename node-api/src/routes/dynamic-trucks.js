import express from "express";
import { Camion } from "../model/camion.js";
import { Trip } from "../model/trip.js";
import { authenticate } from "../auth/middelware.js";

const router = express.Router();

// Positions réelles des villes tunisiennes
const LOCATIONS = {
  "Tunis": [36.8, 10.18],
  "Ariana": [36.86, 10.11],
  "Ben Arous": [36.77, 10.23],
  "Manouba": [36.8, 10.09],
  "Nabeul": [36.45, 11.02],
  "Zaghouan": [36.4, 10.14],
  "Bizerte": [37.27, 9.87],
  "Beja": [36.73, 9.19],
  "Jendouba": [36.5, 8.79],
  "Kef": [36.18, 8.71],
  "Siliana": [36.08, 9.37],
  "Sousse": [35.83, 10.62],
  "Monastir": [35.77, 10.8],
  "Mahdia": [35.5, 11.06],
  "Kairouan": [35.67, 10.1],
  "Kasserine": [35.17, 8.75],
  "Sidi Bouzid": [35.03, 9.5],
  "Sfax": [34.74, 10.76],
  "Gafsa": [34.42, 8.78],
  "Tozeur": [33.92, 8.13],
  "Kebili": [33.7, 8.97],
  "Gabes": [33.88, 10.1],
  "Medenine": [33.35, 10.5],
  "Tataouine": [32.93, 10.45]
};

// 📍 Récupérer tous les camions actifs avec leurs trajets
router.get("/active-trucks", authenticate, async (req, res) => {
  try {
    // Récupérer tous les camions en service
    const trucks = await Camion.find({ 
      status: "in_service" 
    }).lean();

    // Récupérer les trajets actifs pour chaque camion
    const trucksWithTrips = await Promise.all(trucks.map(async (truck) => {
      try {
        // Trouver le trajet actif pour ce camion
        const activeTrip = await Trip.findOne({
          truck: truck._id,
          statusTrip: "in_progress",
          isCompleted: false
        }).populate("driver", "FirstName LastName email_user")
          .populate("truck", "truckId truckType weight")
          .lean();

        // Position par défaut si pas de location
        let position = [36.8, 10.18]; // Tunis par défaut
        if (truck.location && truck.location.lat && truck.location.lon) {
          position = [truck.location.lat, truck.location.lon];
        }

        // Coordonnées de départ et destination
        const startCoords = activeTrip?.startPoint ? 
          LOCATIONS[activeTrip.startPoint] || [36.8, 10.18] : 
          position;
        const destCoords = activeTrip?.destination ? 
          LOCATIONS[activeTrip.destination] || [36.8, 10.18] : 
          position;

        return {
          id: truck._id.toString(),
          truck_id: truck.truckId,
          position: position,
          speed: truck.speed || 0,
          bearing: truck.bearing || 0,
          state: truck.status === "in_service" ? "En Route" : "Arrêté",
          ecoMode: truck.ecoMode || false,
          vehicle: truck.truckType || "Camion Standard",
          cargo: activeTrip?.cargo || "Marchandises",
          cargo_type: activeTrip?.cargo_type || "Standard",
          status: activeTrip?.statusTrip || "idle",
          weight: truck.weight || 0,
          route_progress: truck.routeProgress || 0,
          route: truck.route || [],
          pickup: {
            address: activeTrip?.startPoint || "Position actuelle",
            city: activeTrip?.startPoint || "Ville",
            coordinates: startCoords
          },
          destination: activeTrip?.destination || "Destination",
          destinationCoords: destCoords,
          driver: {
            id: activeTrip?.driver?._id || "default",
            name: activeTrip?.driver ? 
              `${activeTrip.driver.FirstName} ${activeTrip.driver.LastName}` : 
              "Chauffeur",
            company: "Transport TN",
            contact: activeTrip?.driver?.email_user || "contact@transport.tn",
            avatar: "👨‍💼"
          },
          last_update: truck.lastUpdate || new Date().toISOString(),
          estimatedArrival: activeTrip?.estimatedArrival || new Date(Date.now() + 2 * 3600000).toISOString(),
          fuel_level: truck.fuelLevel || 100,
          temperature: truck.engineTemp || 20,
          alerts: [],
          // Informations détaillées du trajet
          trip: activeTrip ? {
            id: activeTrip._id,
            startPoint: activeTrip.startPoint,
            destination: activeTrip.destination,
            departureDate: activeTrip.departureDate,
            estimatedDuration: activeTrip.estimatedDuration,
            status: activeTrip.statusTrip
          } : null
        };
      } catch (error) {
        console.error(`Erreur pour camion ${truck.truckId}:`, error);
        return null;
      }
    }));

    // Filtrer les camions valides
    const validTrucks = trucksWithTrips.filter(truck => truck !== null);

    res.json({
      success: true,
      count: validTrucks.length,
      trucks: validTrucks
    });

  } catch (error) {
    console.error("Erreur récupération camions actifs:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des camions",
      error: error.message
    });
  }
});

// 📍 Récupérer un camion spécifique par ID
router.get("/truck/:truckId", authenticate, async (req, res) => {
  try {
    const { truckId } = req.params;
    
    const truck = await Camion.findOne({ truckId: truckId }).lean();
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Camion non trouvé"
      });
    }

    // Récupérer le trajet actif
    const activeTrip = await Trip.findOne({
      truck: truck._id,
      statusTrip: "in_progress"
    }).populate("driver").populate("truck").lean();

    // Position actuelle
    let position = [36.8, 10.18];
    if (truck.location && truck.location.lat && truck.location.lon) {
      position = [truck.location.lat, truck.location.lon];
    }

    const truckData = {
      id: truck._id.toString(),
      truck_id: truck.truckId,
      position: position,
      speed: truck.speed || 0,
      bearing: truck.bearing || 0,
      state: truck.status === "in_service" ? "En Route" : "Arrêté",
      route_progress: truck.routeProgress || 0,
      route: truck.route || [],
      trip: activeTrip,
      last_update: truck.lastUpdate || new Date().toISOString()
    };

    res.json({
      success: true,
      truck: truckData
    });

  } catch (error) {
    console.error(`Erreur récupération camion ${req.params.truckId}:`, error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

// 🛣️ Générer route entre deux points (OSRM ou fallback)
router.get("/route", async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Paramètres start et end requis (format: lat,lon)"
      });
    }

    const [startLat, startLon] = start.split(',').map(Number);
    const [endLat, endLon] = end.split(',').map(Number);

    // Essayer OSRM d'abord
    try {
      const osrmUrl = `http://osrm:5000/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
      const osrmResponse = await fetch(osrmUrl);
      
      if (osrmResponse.ok) {
        const osrmData = await osrmResponse.json();
        if (osrmData.routes && osrmData.routes[0]) {
          const coordinates = osrmData.routes[0].geometry.coordinates;
          const route = coordinates.map(coord => [coord[1], coord[0]]); // Convertir [lon,lat] vers [lat,lon]
          
          return res.json({
            success: true,
            source: "osrm",
            route: route,
            distance: osrmData.routes[0].distance,
            duration: osrmData.routes[0].duration
          });
        }
      }
    } catch (osrmError) {
      console.warn("OSRM indisponible, utilisation du fallback");
    }

    // Fallback: route simple avec interpolation
    const fallbackRoute = generateFallbackRoute([startLat, startLon], [endLat, endLon]);
    
    res.json({
      success: true,
      source: "fallback",
      route: fallbackRoute,
      distance: calculateDistance([startLat, startLon], [endLat, endLon]) * 1000, // en mètres
      duration: calculateDistance([startLat, startLon], [endLat, endLon]) * 45 // estimation 45s/km
    });

  } catch (error) {
    console.error("Erreur génération route:", error);
    res.status(500).json({
      success: false,
      message: "Erreur génération route",
      error: error.message
    });
  }
});

// 📊 Mettre à jour position camion
router.post("/update-position", authenticate, async (req, res) => {
  try {
    const { truckId, position, speed, bearing, routeProgress, status } = req.body;

    if (!truckId || !position) {
      return res.status(400).json({
        success: false,
        message: "truckId et position requis"
      });
    }

    const updateData = {
      location: {
        lat: position[0],
        lon: position[1]
      },
      lastUpdate: new Date()
    };

    if (speed !== undefined) updateData.speed = speed;
    if (bearing !== undefined) updateData.bearing = bearing;
    if (routeProgress !== undefined) updateData.routeProgress = routeProgress;
    if (status !== undefined) updateData.status = status;

    const updatedTruck = await Camion.findOneAndUpdate(
      { truckId: truckId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedTruck) {
      return res.status(404).json({
        success: false,
        message: "Camion non trouvé"
      });
    }

    res.json({
      success: true,
      message: "Position mise à jour",
      truck: updatedTruck
    });

  } catch (error) {
    console.error("Erreur mise à jour position:", error);
    res.status(500).json({
      success: false,
      message: "Erreur mise à jour",
      error: error.message
    });
  }
});

// 🚚 Ajouter un nouveau camion
router.post("/add-truck", authenticate, async (req, res) => {
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
      startLocation = "Tunis"
    } = req.body;

    // Validation
    if (!truckId || !truckType || !weight) {
      return res.status(400).json({
        success: false,
        message: "truckId, truckType et weight sont requis"
      });
    }

    // Vérifier si le camion existe déjà
    const existingTruck = await Camion.findOne({ truckId });
    if (existingTruck) {
      return res.status(409).json({
        success: false,
        message: "Un camion avec cet ID existe déjà"
      });
    }

    // Position initiale
    const initialLocation = LOCATIONS[startLocation] || LOCATIONS["Tunis"];

    const newTruck = new Camion({
      truckId,
      truckType,
      weight,
      height: height || 3,
      width: width || 2.5,
      length: length || 12,
      axleCount: axleCount || 2,
      fuelType: fuelType || "Diesel",
      status: "in_service",
      location: {
        lat: initialLocation[0],
        lon: initialLocation[1]
      },
      speed: 0,
      bearing: 0,
      routeProgress: 0,
      fuelLevel: 100,
      engineTemp: 20,
      lastUpdate: new Date()
    });

    await newTruck.save();

    res.status(201).json({
      success: true,
      message: "Camion ajouté avec succès",
      truck: newTruck
    });

  } catch (error) {
    console.error("Erreur ajout camion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du camion",
      error: error.message
    });
  }
});

// Fonction utilitaire pour générer route fallback
function generateFallbackRoute(start, end, waypoints = 10) {
  const route = [start];
  
  for (let i = 1; i < waypoints; i++) {
    const ratio = i / waypoints;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lon = start[1] + (end[1] - start[1]) * ratio;
    
    // Ajouter légère variation pour réalisme
    const variation = 0.01;
    const varLat = lat + (Math.random() - 0.5) * variation;
    const varLon = lon + (Math.random() - 0.5) * variation;
    
    route.push([varLat, varLon]);
  }
  
  route.push(end);
  return route;
}

// Fonction utilitaire pour calculer distance
function calculateDistance(point1, point2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router;
