import axios from 'axios';

class DynamicRouteService {
  constructor() {
    this.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.routeCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.activeTrucks = new Map();
    this.lastApiCall = 0;
    this.API_COOLDOWN = 2000; // 2 secondes entre appels
  }

  // Positions réelles des villes tunisiennes
  LOCATIONS = {
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

  /**
   * Récupère une route dynamique depuis l'API backend
   */
  async getDynamicRoute(startPoint, endPoint, truckId = null) {
    const cacheKey = `${startPoint}-${endPoint}`;
    
    // Vérifier le cache d'abord
    if (this.routeCache.has(cacheKey)) {
      const cached = this.routeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📦 Route récupérée depuis le cache:', cacheKey);
        return cached.route;
      } else {
        this.routeCache.delete(cacheKey);
      }
    }

    // Respecter le cooldown API
    const now = Date.now();
    if (now - this.lastApiCall < this.API_COOLDOWN) {
      console.log('⏱️ API cooldown actif, utilisation du fallback');
      return this.generateFallbackRoute(startPoint, endPoint);
    }

    try {
      this.lastApiCall = now;
      
      // Obtenir coordonnées
      const startCoords = this.LOCATIONS[startPoint] || startPoint;
      const endCoords = this.LOCATIONS[endPoint] || endPoint;
      
      const startLatLng = Array.isArray(startCoords) ? 
        `${startCoords[0]},${startCoords[1]}` : 
        `${startCoords.lat},${startCoords.lon}`;
      
      const endLatLng = Array.isArray(endCoords) ? 
        `${endCoords[0]},${endCoords[1]}` : 
        `${endCoords.lat},${endCoords.lon}`;

      // Appel API backend
      const response = await axios.get(`${this.API_BASE_URL}/api/trucks/route`, {
        params: {
          start: startLatLng,
          end: endLatLng,
          truckId: truckId
        },
        timeout: 5000,
        withCredentials: true
      });

      if (response.data.success && response.data.route) {
        const route = response.data.route;
        
        // Mettre en cache
        this.routeCache.set(cacheKey, {
          route: route,
          timestamp: now,
          source: response.data.source || 'api'
        });

        console.log(`✅ Route ${response.data.source} récupérée: ${route.length} points`);
        return route;
      } else {
        throw new Error('Réponse API invalide');
      }

    } catch (error) {
      console.warn(`🔄 Erreur API route (${error.message}), utilisation fallback`);
      return this.generateFallbackRoute(startCoords, endCoords);
    }
  }

  /**
   * Génère une route de secours intelligente
   */
  generateFallbackRoute(start, end, waypoints = 8) {
    const startCoords = Array.isArray(start) ? start : this.LOCATIONS[start] || [36.8, 10.18];
    const endCoords = Array.isArray(end) ? end : this.LOCATIONS[end] || [36.8, 10.18];
    
    const route = [startCoords];
    
    // Vérification que les points sont terrestres (Tunisie)
    const isOnLand = (lat, lng) => {
      return lat >= 30.5 && lat <= 37.5 && lng >= 8.0 && lng <= 11.8 &&
             !(lat > 36.5 && lng < 9.5) && // Éviter mer nord-ouest
             !(lat > 35.5 && lng > 11.2) && // Éviter mer est
             !(lat < 33.0 && lng < 9.0); // Éviter mer sud-ouest
    };

    // Génération de points intermédiaires réalistes
    for (let i = 1; i < waypoints; i++) {
      const ratio = i / waypoints;
      let lat = startCoords[0] + (endCoords[0] - startCoords[0]) * ratio;
      let lng = startCoords[1] + (endCoords[1] - startCoords[1]) * ratio;
      
      // Ajouter légère variation pour réalisme
      const variation = 0.005;
      lat += (Math.random() - 0.5) * variation;
      lng += (Math.random() - 0.5) * variation;
      
      // Courbure légère vers l'intérieur des terres
      const inlandCurvature = 0.002 * Math.sin(ratio * Math.PI);
      lat += inlandCurvature;
      
      // Vérifier que le point est sur terre
      if (!isOnLand(lat, lng)) {
        lat = Math.max(30.8, Math.min(37.2, lat));
        lng = Math.max(8.2, Math.min(11.5, lng));
      }
      
      route.push([lat, lng]);
    }
    
    route.push(endCoords);
    
    console.log(`🛣️ Route fallback générée: ${route.length} points`);
    return route;
  }

  /**
   * Met à jour la position d'un camion sur sa route
   */
  updateTruckPosition(truckId, truckData) {
    this.activeTrucks.set(truckId, {
      ...truckData,
      lastUpdate: Date.now()
    });
  }

  /**
   * Calcule la position actuelle d'un camion sur sa route
   */
  getCurrentPosition(truckId, progress = 0) {
    const truck = this.activeTrucks.get(truckId);
    if (!truck || !truck.route || truck.route.length < 2) {
      return null;
    }

    const route = truck.route;
    const totalSegments = route.length - 1;
    const currentSegmentFloat = (progress / 100.0) * totalSegments;
    const currentSegment = Math.floor(currentSegmentFloat);
    const segmentProgress = currentSegmentFloat - currentSegment;

    if (currentSegment >= totalSegments) {
      return route[route.length - 1];
    }

    // Interpolation linéaire entre deux points
    const start = route[currentSegment];
    const end = route[currentSegment + 1];

    const lat = start[0] + (end[0] - start[0]) * segmentProgress;
    const lng = start[1] + (end[1] - start[1]) * segmentProgress;

    return [lat, lng];
  }

  /**
   * Calcule l'orientation du camion
   */
  calculateBearing(truckId, progress = 0) {
    const truck = this.activeTrucks.get(truckId);
    if (!truck || !truck.route || truck.route.length < 2) {
      return 0;
    }

    const route = truck.route;
    const totalSegments = route.length - 1;
    const currentSegment = Math.floor((progress / 100.0) * totalSegments);
    const nextSegment = Math.min(currentSegment + 1, totalSegments);

    if (currentSegment === nextSegment) {
      return truck.bearing || 0;
    }

    const current = route[currentSegment];
    const next = route[nextSegment];

    const deltaLat = next[0] - current[0];
    const deltaLng = next[1] - current[1];

    let bearing = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  /**
   * Génère les routes pour tous les camions
   */
  async generateRoutesForTrucks(trucks) {
    const routes = {};
    
    // Traitement par batch pour éviter surcharge API
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < trucks.length; i += BATCH_SIZE) {
      const batch = trucks.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (truck) => {
        try {
          let route = [];
          
          // Utiliser route existante si disponible
          if (truck.route && truck.route.length > 1) {
            route = truck.route;
          } else {
            // Générer nouvelle route
            const startPoint = truck.pickup?.address || truck.pickup?.city || "Tunis";
            const endPoint = truck.destination || "Destination";
            
            route = await this.getDynamicRoute(startPoint, endPoint, truck.truck_id);
          }
          
          // Déterminer couleur selon état
          let color = '#6b7280';
          if (truck.state === 'En Route') color = '#1e90ff';
          else if (truck.state === 'At Destination') color = '#22c55e';
          else if (truck.state === 'Maintenance') color = '#f59e0b';
          else if (truck.state === 'Delayed') color = '#ef4444';
          
          // Mettre à jour les données du camion
          this.updateTruckPosition(truck.truck_id, {
            ...truck,
            route: route
          });
          
          return {
            truckId: truck.truck_id,
            route: route,
            color: color,
            status: truck.state,
            progress: truck.route_progress || 0
          };
        } catch (error) {
          console.error(`Erreur route pour ${truck.truck_id}:`, error);
          return {
            truckId: truck.truck_id,
            route: this.generateFallbackRoute(
              truck.position || [36.8, 10.18],
              truck.destinationCoords || [36.8, 10.18]
            ),
            color: '#6b7280',
            status: 'error',
            progress: 0
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const routeData = result.value;
          routes[routeData.truckId] = routeData;
        } else {
          const truck = batch[index];
          routes[truck.truck_id] = {
            truckId: truck.truck_id,
            route: [],
            color: '#ef4444',
            status: 'error',
            progress: 0
          };
        }
      });
      
      // Délai entre batches
      if (i + BATCH_SIZE < trucks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🗺️ ${Object.keys(routes).length} routes générées`);
    return routes;
  }

  /**
   * Nettoie le cache expiré
   */
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.routeCache) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.routeCache.delete(key);
      }
    }
  }

  /**
   * Obtient les statistiques du service
   */
  getStats() {
    return {
      cacheSize: this.routeCache.size,
      activeTrucks: this.activeTrucks.size,
      lastApiCall: this.lastApiCall,
      locations: Object.keys(this.LOCATIONS).length
    };
  }

  /**
   * Réinitialise le service
   */
  reset() {
    this.routeCache.clear();
    this.activeTrucks.clear();
    this.lastApiCall = 0;
    console.log('🔄 Service de routes réinitialisé');
  }
}

// Export singleton
const dynamicRouteService = new DynamicRouteService();

// Nettoyage automatique du cache toutes les 10 minutes
setInterval(() => {
  dynamicRouteService.cleanExpiredCache();
}, 10 * 60 * 1000);

export default dynamicRouteService;
