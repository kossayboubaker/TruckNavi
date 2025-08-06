# 🗄️ Intégration MongoDB - Configuration Backend

## ✅ **Données Statiques ÉLIMINÉES**

Toutes les données hardcodées ont été supprimées. Le système utilise maintenant **exclusivement** votre backend MongoDB via les APIs suivantes :

---

## 📡 **Endpoints API Requis**

### **1. Détails des Camions (Compatible avec votre API)**
```
GET http://localhost:8080/trip/details
```
**Réponse attendue :**
```json
{
  "success": true,
  "trucks": [
    {
      "id": "unique_id",
      "truck_id": "TN-001", 
      "position": [36.770032, 10.23034],
      "speed": 65,
      "state": "En Route",
      "vehicle": "Ford F-150",
      "cargo": "Food Materials",
      "route_progress": 25,
      "driver": {
        "id": "driver_001",
        "name": "Ahmed Ben Ali"
      },
      "destination": "Manouba Centre",
      "last_update": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### **2. Itinéraires (Compatible avec votre API)**
```
GET http://localhost:8080/trip/route?start=10.1815,36.8065&end=10.23034,36.770032
```
**Réponse attendue :**
```json
{
  "success": true,
  "route": [
    [36.8065, 10.1815],
    [36.8070, 10.1820],
    [36.770032, 10.23034]
  ],
  "distance": 25.5,
  "duration": 1800
}
```

---

## 🏗️ **Structure MongoDB Recommandée**

### **Collection `trucks`**
```javascript
{
  _id: ObjectId,
  truck_id: "TN-001",
  position: {
    coordinates: [36.770032, 10.23034],
    timestamp: Date
  },
  speed: 65,
  state: "En Route", // "En Route", "Paused", "At Destination"
  vehicle: "Ford F-150",
  cargo: "Food Materials",
  route_progress: 25, // Pourcentage 0-100
  driver: {
    id: "driver_001", 
    name: "Ahmed Ben Ali",
    company: "TransTunisia, LTD"
  },
  route: {
    waypoints: [[lat1, lng1], [lat2, lng2], ...],
    startPoint: [36.770032, 10.23034],
    endPoint: [36.8098, 10.1085],
    distance: 25.5, // km
    duration: 1800, // secondes
    breakPoints: [5, 15, 25] // Index des pauses obligatoires
  },
  destination: "Manouba Centre",
  estimatedArrival: Date,
  fuel_level: 78,
  last_update: Date,
  created_at: Date,
  updated_at: Date
}
```

### **Collection `routes`**
```javascript
{
  _id: ObjectId,
  truck_id: "TN-001",
  startPoint: [36.770032, 10.23034],
  endPoint: [36.8098, 10.1085],
  waypoints: [
    [36.770032, 10.23034],
    [36.769864, 10.230412],
    // ... points de route complets
    [36.8098, 10.1085]
  ],
  breakPoints: [5, 15, 25], // Index des pauses obligatoires
  distance: 25.5,
  duration: 1800,
  status: "active", // "active", "completed", "paused"
  color: "#1e90ff",
  created_at: Date,
  optimized_by: "osrm" // ou "manual"
}
```

### **Collection `alerts`**
```javascript
{
  _id: ObjectId,
  type: "traffic", // "traffic", "weather", "maintenance", "emergency"
  title: "Embouteillage A1",
  description: "Trafic dense détecté",
  severity: "warning", // "info", "warning", "danger", "critical"
  position: [36.7, 10.2],
  affectedRoutes: ["TN-001", "TN-002"],
  timestamp: Date,
  resolved: false,
  location: "Autoroute A1"
}
```

---

## 🔧 **Intégration Backend Requise**

### **1. Modèles Mongoose (Exemple)**
```javascript
// models/Truck.js
const truckSchema = new mongoose.Schema({
  truck_id: { type: String, required: true, unique: true },
  position: {
    coordinates: [Number], // [lat, lng]
    timestamp: { type: Date, default: Date.now }
  },
  speed: Number,
  state: { 
    type: String, 
    enum: ['En Route', 'Paused', 'At Destination', 'Maintenance'],
    default: 'En Route'
  },
  vehicle: String,
  cargo: String,
  route_progress: { type: Number, min: 0, max: 100, default: 0 },
  driver: {
    id: String,
    name: String,
    company: String
  },
  route: {
    waypoints: [[Number]], // Array de [lat, lng]
    startPoint: [Number],
    endPoint: [Number],
    distance: Number,
    duration: Number,
    breakPoints: [Number] // Index des pauses
  },
  destination: String,
  estimatedArrival: Date,
  fuel_level: Number,
  last_update: { type: Date, default: Date.now }
}, { timestamps: true });
```

### **2. Endpoints à Implémenter**
```javascript
// routes/trip.js
router.get('/details', async (req, res) => {
  try {
    const trucks = await Truck.find({})
      .populate('driver')
      .sort({ last_update: -1 });
    
    res.json({
      success: true,
      trucks: trucks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/route', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // Votre logique OSRM ou calcul de route
    const route = await calculateRoute(start, end);
    
    res.json({
      success: true,
      route: route.waypoints,
      distance: route.distance,
      duration: route.duration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## ⚡ **Mise à Jour Temps Réel**

### **1. Via Socket.IO (Recommandé)**
```javascript
// Émission depuis votre simulateur Python → Node.js
io.emit('truck_positions', {
  trucks: updatedTrucks,
  timestamp: new Date().toISOString()
});

// Réception côté frontend (automatique)
// Le hook useRealTimeData gère déjà tout
```

### **2. Via Kafka (Optionnel)**
```javascript
// Configuration topics Kafka
const topics = {
  TRUCK_POSITIONS: 'truck_positions',
  ROUTES: 'routes', 
  ALERTS: 'alerts'
};

// Publier depuis Python → Kafka → Node.js → Frontend
```

---

## 🚀 **Démarrage Rapide**

### **1. Vérifiez vos endpoints**
```bash
# Test camions
curl http://localhost:8080/trip/details

# Test routes  
curl "http://localhost:8080/trip/route?start=10.1815,36.8065&end=10.23034,36.770032"
```

### **2. Ajoutez des données test à MongoDB**
```javascript
// Script d'initialisation MongoDB
const testTrucks = [
  {
    truck_id: "TN-001",
    position: { coordinates: [36.770032, 10.23034] },
    speed: 65,
    state: "En Route",
    vehicle: "Ford F-150",
    cargo: "Food Materials", 
    route_progress: 25,
    driver: { id: "driver_001", name: "Ahmed Ben Ali" },
    destination: "Manouba Centre"
  }
];

await Truck.insertMany(testTrucks);
```

### **3. Variables d'environnement**
```env
# Frontend (.env)
REACT_APP_API_URL=http://localhost:8080

# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/logistics
PORT=8080
```

---

## ❌ **Ce qui a été ÉLIMINÉ**

- ❌ Routes prédéfinies avec waypoints hardcodés
- ❌ Données mockées de camions
- ❌ Fallback avec données statiques
- ❌ Génération de données factices
- ❌ Toute logique non-MongoDB

---

## ✅ **Ce qui est maintenant REQUIS**

- ✅ Backend MongoDB opérationnel
- ✅ Endpoints `/trip/details` et `/trip/route` fonctionnels
- ✅ Données réelles dans collections MongoDB
- ✅ Socket.IO ou Kafka pour temps réel
- ✅ Intégration OSRM pour calcul routes

---

**🎯 Le frontend affichera maintenant une erreur claire si MongoDB n'est pas accessible, vous forçant à utiliser votre vraie base de données !**
