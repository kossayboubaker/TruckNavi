import axios from 'axios';

// Générateur de routes entièrement dynamique
class RouteGenerator {
  constructor() {
    this.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    // Système de notification des pauses actives
    this.activeBreakTimers = new Map();
    this.breakNotificationCallbacks = [];
    this.shownBreakNotifications = new Set();
    this.pausedTrucks = new Map();
    
    // Cache des routes pour optimisation
    this.routeCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.activeTrucks = new Map();
    this.lastApiCall = 0;
    this.API_COOLDOWN = 2000; // 2 secondes entre appels
  }

  // Fonction pour valider et formater les coordonnées
  validateAndFormatCoordinates(coords) {
    if (!coords) return [36.8, 10.18]; // Default to Tunis

    // Si c'est un objet {lat, lng} ou {lat, lon}
    if (typeof coords === 'object' && !Array.isArray(coords)) {
      if ('lat' in coords && 'lng' in coords) {
        return [coords.lat, coords.lng];
      }
      if ('lat' in coords && 'lon' in coords) {
        return [coords.lat, coords.lon];
      }
    }

    // Si c'est un tableau [lat, lng]
    if (Array.isArray(coords) && coords.length >= 2) {
      return [coords[0], coords[1]];
    }

    return [36.8, 10.18]; // Fallback
  }

  // Récupérer route depuis l'API backend
  async fetchRouteFromAPI(startPoint, endPoint, truckId = null) {
    const cacheKey = `${startPoint}-${endPoint}`;
    
    // Vérifier le cache d'abord
    if (this.routeCache.has(cacheKey)) {
      const cached = this.routeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📦 Route récupérée depuis le cache');
        return cached.route;
      } else {
        this.routeCache.delete(cacheKey);
      }
    }

    // Respecter le cooldown API
    const now = Date.now();
    if (now - this.lastApiCall < this.API_COOLDOWN) {
      console.log('⏱️ API cooldown actif');
      return this.generateFallbackRoute(startPoint, endPoint);
    }

    try {
      this.lastApiCall = now;
      
      // Convertir en coordonnées si nécessaire
      const startCoords = this.validateAndFormatCoordinates(startPoint);
      const endCoords = this.validateAndFormatCoordinates(endPoint);
      
      const startLatLng = `${startCoords[0]},${startCoords[1]}`;
      const endLatLng = `${endCoords[0]},${endCoords[1]}`;

      // Appel API backend pour récupérer la route
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

  // Générer route de secours
  generateFallbackRoute(start, end, waypoints = 8) {
    const startCoords = this.validateAndFormatCoordinates(start);
    const endCoords = this.validateAndFormatCoordinates(end);
    
    const route = [startCoords];
    
    // Génération de points intermédiaires
    for (let i = 1; i < waypoints; i++) {
      const ratio = i / waypoints;
      let lat = startCoords[0] + (endCoords[0] - startCoords[0]) * ratio;
      let lng = startCoords[1] + (endCoords[1] - startCoords[1]) * ratio;
      
      // Ajouter légère variation pour réalisme
      const variation = 0.005;
      lat += (Math.random() - 0.5) * variation;
      lng += (Math.random() - 0.5) * variation;
      
      route.push([lat, lng]);
    }
    
    route.push(endCoords);
    console.log(`🛣️ Route fallback générée: ${route.length} points`);
    return route;
  }

  // Générer route avec progression pour un camion
  async generateRouteWithProgress(truckId, progress = 0) {
    // Récupérer les données du camion depuis l'API
    const truck = this.activeTrucks.get(truckId);
    if (!truck) {
      console.warn(`⚠️ Données camion non trouvées pour ${truckId}`);
      return null;
    }

    // Utiliser la route existante ou en générer une nouvelle
    let route = truck.route;
    if (!route || route.length < 2) {
      // Générer nouvelle route depuis l'API
      try {
        route = await this.fetchRouteFromAPI(
          truck.pickup?.coordinates || truck.position,
          truck.destinationCoords || truck.destination,
          truckId
        );
      } catch (error) {
        console.error(`❌ Erreur génération route pour ${truckId}:`, error);
        route = this.generateFallbackRoute(
          truck.position || [36.8, 10.18],
          truck.destinationCoords || [36.8, 10.18]
        );
      }
    }

    if (!route || route.length < 2) {
      return null;
    }

    const totalPoints = route.length;
    
    // Calculer position actuelle selon progression
    const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);
    
    // Interpolation entre deux points
    const progressBetween = ((progress / 100) * (totalPoints - 1)) % 1;
    const currentPoint = route[progressIndex];
    const nextPoint = route[nextIndex];
    
    let currentPosition;
    if (progressBetween === 0 || progressIndex === nextIndex) {
      currentPosition = currentPoint;
    } else {
      currentPosition = [
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progressBetween,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progressBetween
      ];
    }

    // Déterminer couleur selon état du camion
    let color = '#6b7280';
    if (truck.state === 'En Route') color = '#1e90ff';
    else if (truck.state === 'At Destination') color = '#22c55e';
    else if (truck.state === 'Maintenance') color = '#f59e0b';
    else if (truck.state === 'Delayed') color = '#ef4444';

    return {
      fullRoute: route,
      currentPosition: currentPosition,
      completedRoute: route.slice(0, progressIndex + 1),
      remainingRoute: route.slice(progressIndex),
      color: color,
      status: truck.state || 'active',
      progress: progress
    };
  }

  // Mettre à jour les données d'un camion
  updateTruckData(truckData) {
    if (!truckData || !truckData.truck_id) {
      console.warn('⚠️ Données camion invalides pour updateTruckData');
      return;
    }

    try {
      this.activeTrucks.set(truckData.truck_id, {
        ...truckData,
        position: this.validateAndFormatCoordinates(truckData.position),
        lastUpdate: Date.now()
      });
    } catch (error) {
      console.error(`❌ Erreur mise à jour camion ${truckData.truck_id}:`, error);
    }
  }

  // Générer toutes les routes pour une liste de camions
  async generateAllRoutes(trucks) {
    const routes = {};
    
    // Mettre à jour les données des camions
    trucks.forEach(truck => this.updateTruckData(truck));
    
    // Traitement par batch pour éviter surcharge API
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < trucks.length; i += BATCH_SIZE) {
      const batch = trucks.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (truck) => {
        try {
          const routeInfo = await this.generateRouteWithProgress(
            truck.truck_id, 
            truck.route_progress || 0
          );
          
          if (routeInfo) {
            return {
              truckId: truck.truck_id,
              ...routeInfo,
              truck: truck
            };
          }
          return null;
        } catch (error) {
          console.error(`Erreur route pour ${truck.truck_id}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const routeData = result.value;
          routes[routeData.truckId] = routeData;
        }
      });
      
      // Délai entre batches
      if (i + BATCH_SIZE < trucks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🗺️ ${Object.keys(routes).length} routes générées dynamiquement`);
    return routes;
  }

  // Créer ligne de route avec style selon état
  createRoutePolyline(routeInfo, isSelected = false) {
    if (!routeInfo || !routeInfo.fullRoute) return null;

    const baseWeight = isSelected ? 6 : 4;
    const opacity = routeInfo.status === 'At Destination' ? 0.7 : 0.9;
    
    // Style selon état
    const lineStyle = {
      color: routeInfo.color,
      weight: baseWeight,
      opacity: opacity,
      lineCap: 'round',
      lineJoin: 'round'
    };
    
    // Ligne discontinue pour trajets terminés
    if (routeInfo.status === 'At Destination') {
      lineStyle.dashArray = '12, 8';
    }
    
    if (routeInfo.status === 'En Route' && isSelected) {
      lineStyle.weight = baseWeight + 1;
    }

    return lineStyle;
  }

  // Points d'étapes avec informations
  createRouteMarkers(routeInfo) {
    if (!routeInfo || !routeInfo.fullRoute) return [];

    const markers = [];
    const waypoints = routeInfo.fullRoute;
    
    // Marqueur de départ
    markers.push({
      position: waypoints[0],
      type: 'start',
      icon: '🟢',
      popup: `<div style="text-align: center; font-family: sans-serif;">
        <strong>🟢 Point de Départ</strong><br>
        <span style="font-size: 12px;">${routeInfo.truck?.pickup?.address || 'Départ'}</span>
      </div>`
    });
    
    // Marqueur d'arrivée
    markers.push({
      position: waypoints[waypoints.length - 1],
      type: 'end',
      icon: '🔴',
      popup: `<div style="text-align: center; font-family: sans-serif;">
        <strong>🔴 Destination</strong><br>
        <span style="font-size: 12px;">${routeInfo.truck?.destination || 'Arrivée'}</span><br>
        <span style="font-size: 10px; color: #666;">ETA: ${routeInfo.truck?.estimatedArrival ? new Date(routeInfo.truck.estimatedArrival).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : 'N/A'}</span>
      </div>`
    });
    
    // Points d'étapes intermédiaires
    for (let i = 2; i < waypoints.length - 2; i += 3) {
      markers.push({
        position: waypoints[i],
        type: 'waypoint',
        icon: '🔵',
        popup: `<div style="text-align: center; font-family: sans-serif;">
          <strong>🔵 Point d'Étape</strong><br>
          <span style="font-size: 10px;">Étape ${Math.floor(i/2) + 1}</span>
        </div>`
      });
    }
    
    return markers;
  }

  // Obtenir position actuelle du camion sur sa route
  getCurrentTruckPosition(truckId, progress) {
    const truck = this.activeTrucks.get(truckId);
    if (!truck) return null;

    // Si le camion a une route, calculer la position selon progression
    if (truck.route && truck.route.length > 1) {
      const totalPoints = truck.route.length;
      const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
      const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);
      
      if (progressIndex === nextIndex) {
        return truck.route[progressIndex];
      }
      
      const progressBetween = ((progress / 100) * (totalPoints - 1)) % 1;
      const currentPoint = truck.route[progressIndex];
      const nextPoint = truck.route[nextIndex];
      
      return [
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progressBetween,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progressBetween
      ];
    }
    
    // Sinon retourner la position actuelle du camion
    return truck.position;
  }

  // Calculer direction du camion
  calculateBearing(truckId, progress) {
    const truck = this.activeTrucks.get(truckId);
    if (!truck || !truck.route || truck.route.length < 2) {
      return truck?.bearing || 0;
    }

    const route = truck.route;
    const totalPoints = route.length;
    const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);

    if (progressIndex === nextIndex) return truck.bearing || 0;

    const current = route[progressIndex];
    const next = route[nextIndex];

    const deltaLat = next[0] - current[0];
    const deltaLng = next[1] - current[1];

    let bearing = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  // Mettre un camion en pause
  pauseTruck(truckId, currentProgress, currentPosition) {
    this.pausedTrucks.set(truckId, {
      pausedAt: Date.now(),
      progress: currentProgress,
      position: currentPosition,
      isPaused: true
    });
    console.log(`🚦 Camion ${truckId} mis en pause à ${currentProgress}%`);
  }

  // Reprendre un camion depuis sa position d'arrêt
  resumeTruck(truckId) {
    if (this.pausedTrucks.has(truckId)) {
      const pauseData = this.pausedTrucks.get(truckId);
      this.pausedTrucks.delete(truckId);
      console.log(`▶️ Camion ${truckId} reprend depuis ${pauseData.progress}%`);
      return pauseData;
    }
    return null;
  }

  // V��rifier si un camion est en pause
  isTruckPaused(truckId) {
    return this.pausedTrucks.has(truckId);
  }

  // Obtenir les données de pause d'un camion
  getTruckPauseData(truckId) {
    return this.pausedTrucks.get(truckId);
  }

  // Nettoyer le cache expiré
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.routeCache) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.routeCache.delete(key);
      }
    }
  }

  // Réinitialiser le service
  reset() {
    this.routeCache.clear();
    this.activeTrucks.clear();
    this.pausedTrucks.clear();
    this.lastApiCall = 0;
    console.log('🔄 RouteGenerator réinitialisé');
  }
}

const routeGenerator = new RouteGenerator();

// Nettoyage automatique du cache toutes les 10 minutes
setInterval(() => {
  routeGenerator.cleanExpiredCache();
}, 10 * 60 * 1000);

export default routeGenerator;
