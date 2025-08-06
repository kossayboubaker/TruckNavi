// Service de routes 100% dynamique - AUCUNE donnée statique
// Toutes les données proviennent de votre backend MongoDB via API

class RouteGenerator {
  constructor() {
    // Configuration de l'API backend
    this.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    
    // Cache temporaire pour performance (sera rechargé depuis API)
    this.routeCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    console.log('🗺️ RouteGenerator initialisé - Mode 100% dynamique');
  }

  // Récupérer toutes les routes depuis votre backend MongoDB
  async fetchRoutesFromAPI() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/trip/routes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Routes récupérées depuis MongoDB:', data.routes?.length || 0);
      
      return data.routes || [];
    } catch (error) {
      console.error('❌ Erreur récupération routes API:', error);
      throw new Error('Impossible de récupérer les routes depuis le backend');
    }
  }

  // Récupérer une route spécifique pour un camion
  async fetchTruckRoute(truckId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/trip/truck/${truckId}/route`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Route API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`🚚 Route récupérée pour ${truckId}:`, data.route ? 'Trouvée' : 'Non trouvée');
      
      return data.route;
    } catch (error) {
      console.error(`❌ Erreur récupération route ${truckId}:`, error);
      return null;
    }
  }

  // Générer itinéraire avec progression - 100% depuis API
  async generateRouteWithProgress(truckId, progress = 0) {
    try {
      // Vérifier cache temporaire
      const cacheKey = `${truckId}_${progress}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Récupérer route depuis votre backend
      const routeData = await this.fetchTruckRoute(truckId);
      
      if (!routeData || !routeData.waypoints) {
        console.warn(`⚠️ Aucune route trouvée pour ${truckId} dans MongoDB`);
        return null;
      }

      // Calculer progression sur route réelle
      const progressData = this.calculateProgressOnRoute(routeData, progress);
      
      // Mettre en cache temporairement
      this.setCache(cacheKey, progressData);
      
      return progressData;
    } catch (error) {
      console.error(`❌ Erreur génération route ${truckId}:`, error);
      return null;
    }
  }

  // Calculer progression sur route depuis MongoDB
  calculateProgressOnRoute(routeData, progress) {
    if (!routeData.waypoints || routeData.waypoints.length === 0) {
      return null;
    }

    const waypoints = routeData.waypoints;
    const totalPoints = waypoints.length;
    
    // Position actuelle selon progression
    const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);
    
    // Interpolation entre deux points
    const progressBetween = ((progress / 100) * (totalPoints - 1)) % 1;
    const currentPoint = waypoints[progressIndex];
    const nextPoint = waypoints[nextIndex];
    
    let currentPosition;
    if (progressBetween === 0 || progressIndex === nextIndex) {
      currentPosition = currentPoint;
    } else {
      currentPosition = [
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progressBetween,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progressBetween
      ];
    }

    return {
      fullRoute: waypoints,
      currentPosition: currentPosition,
      completedRoute: waypoints.slice(0, progressIndex + 1),
      remainingRoute: waypoints.slice(progressIndex),
      color: routeData.color || this.determineRouteColor(routeData.status),
      status: routeData.status || 'active',
      progress: progress,
      startPoint: routeData.startPoint,
      endPoint: routeData.endPoint,
      distance: routeData.distance || 0,
      duration: routeData.duration || 0,
      truckId: routeData.truckId
    };
  }

  // Récupérer itinéraire complet depuis votre API
  async fetchCompleteRoute(startCoords, endCoords) {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/trip/route?start=${endCoords[1]},${endCoords[0]}&end=${startCoords[1]},${startCoords[0]}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Route API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🗺️ Itinéraire complet récupéré depuis API');
      
      return data.route || [];
    } catch (error) {
      console.error('❌ Erreur récupération itinéraire complet:', error);
      return [];
    }
  }

  // Récupérer détails des camions depuis votre backend
  async fetchTruckDetails() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/trip/details`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Trucks API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🚚 Détails camions récupérés depuis MongoDB:', data.trucks?.length || 0);
      
      return data.trucks || [];
    } catch (error) {
      console.error('❌ Erreur récupération détails camions:', error);
      throw new Error('Impossible de récupérer les données des camions');
    }
  }

  // Générer toutes les routes dynamiquement
  async generateAllRoutes(trucks) {
    const routes = {};
    
    try {
      // Traitement en parallèle pour performance
      const routePromises = trucks.map(async (truck) => {
        const routeInfo = await this.generateRouteWithProgress(
          truck.truck_id || truck.id, 
          truck.route_progress || truck.progress || 0
        );
        
        if (routeInfo) {
          routes[truck.truck_id || truck.id] = {
            ...routeInfo,
            truck: truck,
            lastUpdate: new Date().toISOString(),
            source: 'api_mongodb'
          };
        }
      });

      await Promise.all(routePromises);
      
      console.log(`🗺️ ${Object.keys(routes).length} routes générées depuis MongoDB`);
      
    } catch (error) {
      console.error('❌ Erreur génération routes multiples:', error);
    }
    
    return routes;
  }

  // Déterminer couleur de route basée sur statut depuis MongoDB
  determineRouteColor(status) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'en route':
      case 'in-progress':
        return '#1e90ff';
      case 'completed':
      case 'terminé':
        return '#22c55e';
      case 'delayed':
      case 'retardé':
        return '#ef4444';
      case 'maintenance':
        return '#f59e0b';
      case 'paused':
      case 'pause':
        return '#8b5cf6';
      default:
        return '#9ca3af';
    }
  }

  // Vérifier points de pause depuis données MongoDB
  async checkBreakPoint(truckId, progress) {
    try {
      const routeData = await this.fetchTruckRoute(truckId);
      
      if (!routeData || !routeData.breakPoints) {
        return null;
      }

      // Chercher le point de pause le plus proche
      const currentIndex = Math.floor((progress / 100) * (routeData.waypoints?.length || 0));
      
      for (const breakPointIndex of routeData.breakPoints) {
        if (Math.abs(currentIndex - breakPointIndex) <= 1) {
          return {
            isAtBreakPoint: true,
            breakIndex: breakPointIndex,
            coordinates: routeData.waypoints[breakPointIndex],
            reason: 'Point de pause réglementaire',
            source: 'mongodb'
          };
        }
      }
      
      return { isAtBreakPoint: false };
    } catch (error) {
      console.error(`❌ Erreur vérification pause ${truckId}:`, error);
      return null;
    }
  }

  // Créer marqueurs de route depuis données MongoDB
  async createRouteMarkers(truckId) {
    try {
      const routeData = await this.fetchTruckRoute(truckId);
      
      if (!routeData) {
        return [];
      }

      const markers = [];
      
      // Marqueur de départ
      if (routeData.startPoint) {
        markers.push({
          position: routeData.startPoint,
          type: 'start',
          icon: '🟢',
          popup: `Départ: ${routeData.startLocation || 'Point de départ'}`,
          source: 'mongodb'
        });
      }
      
      // Marqueur d'arrivée
      if (routeData.endPoint) {
        markers.push({
          position: routeData.endPoint,
          type: 'end',
          icon: '🔴',
          popup: `Arrivée: ${routeData.endLocation || 'Destination'}`,
          source: 'mongodb'
        });
      }
      
      // Marqueurs de pause depuis MongoDB
      if (routeData.breakPoints && routeData.waypoints) {
        routeData.breakPoints.forEach(breakIndex => {
          if (routeData.waypoints[breakIndex]) {
            markers.push({
              position: routeData.waypoints[breakIndex],
              type: 'break',
              icon: '⏸️',
              popup: 'Point de pause réglementaire',
              source: 'mongodb'
            });
          }
        });
      }
      
      return markers;
    } catch (error) {
      console.error(`❌ Erreur création marqueurs ${truckId}:`, error);
      return [];
    }
  }

  // Gestion du cache temporaire
  setCache(key, data) {
    this.routeCache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.routeCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    this.routeCache.delete(key);
    return null;
  }

  // Nettoyer cache expiré
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, cached] of this.routeCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.routeCache.delete(key);
      }
    }
  }

  // Test de connectivité API
  async testAPIConnection() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        credentials: 'include'
      });
      
      return {
        connected: response.ok,
        status: response.status,
        apiUrl: this.API_BASE_URL
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        apiUrl: this.API_BASE_URL
      };
    }
  }
}

// Instance singleton
const routeGenerator = new RouteGenerator();

// Test initial de connexion
routeGenerator.testAPIConnection().then(result => {
  if (result.connected) {
    console.log('✅ Connexion API backend réussie:', result.apiUrl);
  } else {
    console.error('❌ Échec connexion API backend:', result.error);
  }
});

export default routeGenerator;
