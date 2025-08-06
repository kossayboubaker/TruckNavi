// Service OSRM pour calcul de routes optimisées avec contraintes poids-lourds
import axios from 'axios';

class OSRMService {
  constructor() {
    // Configuration OSRM - à adapter selon votre installation
    this.OSRM_BASE_URL = process.env.OSRM_URL || 'http://localhost:5000';
    this.TRUCK_PROFILE = 'truck'; // Profil poids-lourd personnalisé
    this.CAR_PROFILE = 'driving'; // Profil voiture par défaut
    
    // Cache des routes pour éviter les recalculs
    this.routeCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    
    // Configuration des contraintes poids-lourds
    this.TRUCK_CONSTRAINTS = {
      maxWeight: 44000, // kg
      maxHeight: 4.0,   // mètres
      maxWidth: 2.55,   // mètres
      maxLength: 18.75, // mètres
      hazmatAllowed: false,
      avoidTolls: false,
      avoidFerries: false
    };
  }

  // Calculer une route optimisée entre deux points
  async calculateRoute(startCoords, endCoords, options = {}) {
    try {
      const {
        profile = this.TRUCK_PROFILE,
        alternatives = false,
        steps = true,
        geometries = 'geojson',
        overview = 'full',
        annotations = true,
        waypoints = []
      } = options;

      // Construire la liste des coordonnées (départ, points intermédiaires, arrivée)
      const coordinates = [startCoords, ...waypoints, endCoords];
      const coordsString = coordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
      
      // Vérifier le cache
      const cacheKey = this.generateCacheKey(coordinates, profile);
      const cachedRoute = this.getCachedRoute(cacheKey);
      if (cachedRoute) {
        console.log(`📍 Route OSRM récupérée du cache: ${cacheKey}`);
        return cachedRoute;
      }

      const url = `${this.OSRM_BASE_URL}/route/v1/${profile}/${coordsString}`;
      const params = {
        alternatives: alternatives ? 'true' : 'false',
        steps: steps ? 'true' : 'false',
        geometries,
        overview,
        annotations: annotations ? 'true' : 'false'
      };

      console.log(`🛣️ Calcul route OSRM: ${startCoords} → ${endCoords}`);
      
      const response = await axios.get(url, { 
        params,
        timeout: 30000 // 30 secondes timeout
      });

      if (response.data.code !== 'Ok') {
        throw new Error(`OSRM Error: ${response.data.message || 'Route calculation failed'}`);
      }

      const route = response.data.routes[0];
      if (!route) {
        throw new Error('Aucune route trouvée');
      }

      // Formater la réponse
      const routeData = {
        waypoints: this.extractWaypoints(route.geometry),
        distance: Math.round(route.distance / 1000 * 100) / 100, // km avec 2 décimales
        duration: Math.round(route.duration / 60), // minutes
        geometry: route.geometry,
        steps: route.legs?.flatMap(leg => leg.steps) || [],
        alternatives: response.data.routes.slice(1), // Routes alternatives
        profile: profile,
        calculatedAt: new Date().toISOString(),
        source: 'osrm'
      };

      // Ajouter informations spécifiques aux poids-lourds si profil truck
      if (profile === this.TRUCK_PROFILE) {
        routeData.truckConstraints = this.TRUCK_CONSTRAINTS;
        routeData.restrictions = this.analyzeTruckRestrictions(route);
      }

      // Stocker en cache
      this.cacheRoute(cacheKey, routeData);

      console.log(`✅ Route OSRM calculée: ${routeData.distance}km, ${routeData.duration}min`);
      return routeData;

    } catch (error) {
      console.error('❌ Erreur calcul route OSRM:', error.message);
      
      // Retourner une route de fallback basique
      return this.generateFallbackRoute(startCoords, endCoords);
    }
  }

  // Extraire les waypoints de la géométrie OSRM
  extractWaypoints(geometry) {
    if (!geometry || !geometry.coordinates) {
      return [];
    }

    // Convertir de [lng, lat] vers [lat, lng] pour Leaflet
    return geometry.coordinates.map(coord => [coord[1], coord[0]]);
  }

  // Analyser les restrictions pour poids-lourds
  analyzeTruckRestrictions(route) {
    const restrictions = {
      weightRestrictions: [],
      heightRestrictions: [],
      widthRestrictions: [],
      hazmatRestrictions: [],
      tollRoads: [],
      warnings: []
    };

    // Analyser les segments de route pour détecter les restrictions
    if (route.legs) {
      route.legs.forEach(leg => {
        if (leg.steps) {
          leg.steps.forEach(step => {
            // Détecter les restrictions basées sur le nom de la route ou les annotations
            if (step.name) {
              if (step.name.includes('tunnel') || step.name.includes('Tunnel')) {
                restrictions.heightRestrictions.push({
                  location: step.name,
                  type: 'height_limit',
                  limit: '3.5m', // Limite typique pour tunnels
                  coordinates: step.maneuver?.location
                });
              }
              
              if (step.name.includes('péage') || step.name.includes('Péage') || step.name.includes('toll')) {
                restrictions.tollRoads.push({
                  location: step.name,
                  type: 'toll',
                  coordinates: step.maneuver?.location
                });
              }
            }
          });
        }
      });
    }

    return restrictions;
  }

  // Générer une route de fallback simple
  generateFallbackRoute(startCoords, endCoords) {
    const distance = this.calculateHaversineDistance(startCoords, endCoords);
    const estimatedDuration = Math.round(distance / 0.8); // Vitesse moyenne 48 km/h

    console.log(`🔄 Route fallback générée: ${distance}km, ${estimatedDuration}min`);

    return {
      waypoints: [startCoords, endCoords],
      distance: distance,
      duration: estimatedDuration,
      geometry: {
        type: 'LineString',
        coordinates: [[startCoords[1], startCoords[0]], [endCoords[1], endCoords[0]]]
      },
      steps: [],
      alternatives: [],
      profile: 'fallback',
      calculatedAt: new Date().toISOString(),
      source: 'fallback',
      isFallback: true,
      warnings: ['Route calculée en mode fallback - OSRM non disponible']
    };
  }

  // Calculer la distance haversine entre deux points
  calculateHaversineDistance(coord1, coord2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.degToRad(coord2[0] - coord1[0]);
    const dLon = this.degToRad(coord2[1] - coord1[1]);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.degToRad(coord1[0])) * Math.cos(this.degToRad(coord2[0])) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100;
  }

  degToRad(deg) {
    return deg * (Math.PI/180);
  }

  // Optimiser plusieurs destinations (TSP - Traveling Salesman Problem)
  async optimizeMultipleDestinations(coordinates, options = {}) {
    try {
      const {
        profile = this.TRUCK_PROFILE,
        roundtrip = false,
        source = 'first',
        destination = 'last'
      } = options;

      const coordsString = coordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
      const url = `${this.OSRM_BASE_URL}/trip/v1/${profile}/${coordsString}`;
      
      const params = {
        roundtrip: roundtrip ? 'true' : 'false',
        source,
        destination,
        steps: 'true',
        geometries: 'geojson'
      };

      console.log(`🔄 Optimisation trajet multiple: ${coordinates.length} destinations`);

      const response = await axios.get(url, { 
        params,
        timeout: 45000 // 45 secondes pour optimisation complexe
      });

      if (response.data.code !== 'Ok') {
        throw new Error(`OSRM Trip Error: ${response.data.message}`);
      }

      const trips = response.data.trips;
      if (!trips || trips.length === 0) {
        throw new Error('Aucun trajet optimisé trouvé');
      }

      const optimizedTrip = trips[0];
      
      const routeData = {
        waypoints: this.extractWaypoints(optimizedTrip.geometry),
        distance: Math.round(optimizedTrip.distance / 1000 * 100) / 100,
        duration: Math.round(optimizedTrip.duration / 60),
        geometry: optimizedTrip.geometry,
        waypoints_order: response.data.waypoints?.map(wp => wp.waypoint_index) || [],
        legs: optimizedTrip.legs,
        profile: profile,
        optimized: true,
        calculatedAt: new Date().toISOString(),
        source: 'osrm-trip'
      };

      console.log(`✅ Trajet optimisé: ${routeData.distance}km, ${routeData.duration}min`);
      return routeData;

    } catch (error) {
      console.error('❌ Erreur optimisation trajet:', error.message);
      
      // Fallback: route séquentielle simple
      return this.calculateSequentialRoute(coordinates, options);
    }
  }

  // Route séquentielle simple (fallback pour l'optimisation)
  async calculateSequentialRoute(coordinates, options) {
    console.log('🔄 Calcul route séquentielle (fallback optimisation)');
    
    const routes = [];
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const route = await this.calculateRoute(coordinates[i], coordinates[i + 1], options);
      routes.push(route);
      totalDistance += route.distance;
      totalDuration += route.duration;
    }
    
    // Combiner toutes les waypoints
    const allWaypoints = routes.reduce((acc, route) => {
      return acc.concat(route.waypoints.slice(1)); // Éviter les doublons
    }, routes[0]?.waypoints || []);
    
    return {
      waypoints: allWaypoints,
      distance: totalDistance,
      duration: totalDuration,
      legs: routes,
      profile: options.profile || this.TRUCK_PROFILE,
      optimized: false,
      calculatedAt: new Date().toISOString(),
      source: 'osrm-sequential'
    };
  }

  // Calculer des isochrones (zones accessibles en X temps)
  async calculateIsochrone(coordinates, timeMinutes, options = {}) {
    try {
      const {
        profile = this.TRUCK_PROFILE,
        contours = [timeMinutes * 60] // Convertir en secondes
      } = options;

      const url = `${this.OSRM_BASE_URL}/isochrone/v1/${profile}/${coordinates[1]},${coordinates[0]}`;
      const params = {
        contours: contours.join(','),
        polygons: 'true'
      };

      const response = await axios.get(url, { params, timeout: 20000 });
      
      if (response.data.code !== 'Ok') {
        throw new Error(`OSRM Isochrone Error: ${response.data.message}`);
      }

      return {
        polygons: response.data.features,
        center: coordinates,
        timeMinutes: timeMinutes,
        profile: profile,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur calcul isochrone:', error.message);
      return null;
    }
  }

  // Gestion du cache
  generateCacheKey(coordinates, profile) {
    const coordsStr = coordinates.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('|');
    return `${profile}_${coordsStr}`;
  }

  cacheRoute(key, routeData) {
    this.routeCache.set(key, {
      data: routeData,
      timestamp: Date.now()
    });
  }

  getCachedRoute(key) {
    const cached = this.routeCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  clearExpiredCache() {
    const now = Date.now();
    for (const [key, cached] of this.routeCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.routeCache.delete(key);
      }
    }
  }

  // Vérifier la disponibilité d'OSRM
  async checkOSRMHealth() {
    try {
      const response = await axios.get(`${this.OSRM_BASE_URL}/health`, { timeout: 5000 });
      return {
        available: true,
        status: response.data,
        url: this.OSRM_BASE_URL
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        url: this.OSRM_BASE_URL
      };
    }
  }

  // Statistiques du service
  getStatistics() {
    return {
      cacheSize: this.routeCache.size,
      cacheTimeout: this.cacheTimeout,
      baseUrl: this.OSRM_BASE_URL,
      truckProfile: this.TRUCK_PROFILE,
      constraints: this.TRUCK_CONSTRAINTS
    };
  }
}

// Instance singleton
const osrmService = new OSRMService();

export default osrmService;
