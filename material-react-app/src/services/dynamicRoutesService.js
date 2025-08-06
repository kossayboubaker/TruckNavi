// Service de routes 100% dynamiques - aucune donnée hardcodée
import trucksService from './trucksService';
import realtimeService from './realtimeService';
import mandatoryBreaksService from './mandatoryBreaksService';

class DynamicRoutesService {
  constructor() {
    this.activeRoutes = new Map();
    this.routeUpdateCallbacks = [];
    this.pausedTrucks = new Map();
    this.routeCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Initialiser le service avec connexion temps réel
  initialize() {
    // S'abonner aux mises à jour de routes en temps réel
    realtimeService.subscribe('routes', (routeData) => {
      this.handleRouteUpdate(routeData);
    });

    // S'abonner aux positions de camions
    realtimeService.subscribe('truck_positions', (positionsData) => {
      this.handlePositionsUpdate(positionsData);
    });

    console.log('✅ Service routes dynamiques initialisé');
  }

  // Récupérer toutes les routes depuis le backend
  async getAllRoutes(truckIds = []) {
    try {
      const routes = await trucksService.getTruckRoutes(truckIds);
      
      // Stocker dans le cache local
      Object.entries(routes).forEach(([truckId, routeData]) => {
        this.cacheRoute(truckId, routeData);
      });

      return routes;
    } catch (error) {
      console.error('❌ Erreur récupération routes dynamiques:', error);
      return {};
    }
  }

  // Générer route avec progression dynamique depuis le backend
  async generateRouteWithProgress(truckId, progress = 0) {
    try {
      // Vérifier le cache d'abord
      const cachedRoute = this.getCachedRoute(truckId);
      if (cachedRoute) {
        return this.calculateProgressOnRoute(cachedRoute, progress);
      }

      // Récupérer depuis le backend
      const truckData = await trucksService.getTruckById(truckId);
      if (!truckData || !truckData.route) {
        console.warn(`⚠️ Aucune route trouvée pour ${truckId}`);
        return null;
      }

      // Si pas de route pré-calculée, demander optimisation OSRM
      let routeData = truckData.route;
      if (!routeData.waypoints || routeData.waypoints.length === 0) {
        routeData = await this.requestOptimizedRoute(truckData);
      }

      // ** NOUVEAU : Calculer les pauses obligatoires pour ce trajet **
      const driverId = truckData.driver?.id || truckData.driver?.name || `driver_${truckId}`;
      const breakData = mandatoryBreaksService.calculateMandatoryBreaks(routeData, driverId, progress);

      // Programmer les pauses pour ce camion
      if (breakData.breaks.length > 0) {
        mandatoryBreaksService.scheduleBreaksForRoute(truckId, routeData, driverId);
        console.log(`🚦 ${breakData.breaks.length} pause(s) obligatoire(s) programmée(s) pour ${truckId}`);
      }

      // Ajouter les informations de pause à la route
      routeData.mandatoryBreaks = breakData.breaks;
      routeData.breakWarnings = breakData.warnings;
      routeData.driverId = driverId;

      // Stocker en cache
      this.cacheRoute(truckId, routeData);

      return this.calculateProgressOnRoute(routeData, progress);
    } catch (error) {
      console.error(`❌ Erreur génération route ${truckId}:`, error);
      return null;
    }
  }

  // Demander une route optimisée via OSRM/Backend
  async requestOptimizedRoute(truckData) {
    try {
      const startCoords = truckData.pickup?.coordinates || truckData.position;
      const endCoords = truckData.destinationCoords || truckData.destination?.coordinates;
      
      if (!startCoords || !endCoords) {
        console.warn(`⚠️ Coordonnées manquantes pour ${truckData.truck_id}`);
        return null;
      }

      const optimizedRoute = await trucksService.getOptimizedRoute(
        truckData.truck_id,
        startCoords,
        endCoords,
        truckData.waypoints || []
      );

      return optimizedRoute;
    } catch (error) {
      console.error(`❌ Erreur route optimisée ${truckData.truck_id}:`, error);
      return null;
    }
  }

  // Calculer la progression sur une route
  calculateProgressOnRoute(routeData, progress) {
    if (!routeData || !routeData.waypoints || routeData.waypoints.length === 0) {
      return null;
    }

    const waypoints = routeData.waypoints;
    const totalPoints = waypoints.length;
    
    // Calculer position actuelle selon progression
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
      color: this.determineRouteColor(routeData),
      status: routeData.status || 'active',
      progress: progress,
      distance: routeData.distance || 0,
      duration: routeData.duration || 0,
      traffic: routeData.traffic || 'unknown'
    };
  }

  // Déterminer la couleur de route basée sur l'état
  determineRouteColor(routeData) {
    if (routeData.color) return routeData.color;
    
    switch (routeData.status) {
      case 'active':
      case 'in-progress':
        return '#1e90ff'; // Bleu pour actifs
      case 'completed':
        return '#22c55e'; // Vert pour terminés
      case 'delayed':
        return '#ef4444'; // Rouge pour retardés
      case 'maintenance':
        return '#f59e0b'; // Orange pour maintenance
      case 'paused':
        return '#8b5cf6'; // Violet pour en pause
      default:
        return '#9ca3af'; // Gris pour inconnu
    }
  }

  // Générer toutes les routes avec couleurs dynamiques
  async generateAllRoutes(trucks) {
    const routes = {};
    
    try {
      // Récupérer toutes les routes en parallèle
      const truckIds = trucks.map(truck => truck.truck_id);
      const allRoutesData = await this.getAllRoutes(truckIds);
      
      // Traitement en parallèle pour performance
      const routePromises = trucks.map(async (truck) => {
        const routeInfo = await this.generateRouteWithProgress(
          truck.truck_id, 
          truck.route_progress || 0
        );
        
        if (routeInfo) {
          // Couleur dynamique basée sur l'état du camion
          const routeColor = this.getTruckStateColor(truck);
          
          routes[truck.truck_id] = {
            ...routeInfo,
            color: routeColor,
            truck: truck,
            lastUpdate: new Date().toISOString()
          };
        }
      });

      await Promise.all(routePromises);
      
    } catch (error) {
      console.error('❌ Erreur génération routes multiples:', error);
    }
    
    return routes;
  }

  // Obtenir couleur basée sur l'état du camion
  getTruckStateColor(truck) {
    switch (truck.state?.toLowerCase()) {
      case 'en route':
      case 'in-progress':
        return '#1e90ff'; // Bleu
      case 'at destination':
      case 'completed':
        return '#22c55e'; // Vert
      case 'maintenance':
        return '#f59e0b'; // Orange
      case 'delayed':
      case 'emergency':
        return '#ef4444'; // Rouge
      case 'paused':
      case 'break':
        return '#8b5cf6'; // Violet
      default:
        // Couleur basée sur la vitesse si état inconnu
        if (truck.speed > 50) return '#1e90ff';
        if (truck.speed > 0) return '#22c55e';
        return '#9ca3af';
    }
  }

  // Créer style de polyline dynamique
  createRoutePolyline(routeInfo, isSelected = false) {
    if (!routeInfo || !routeInfo.fullRoute) return null;

    const baseWeight = isSelected ? 6 : 4;
    let opacity = 0.9;
    
    // Opacité basée sur l'état
    switch (routeInfo.status) {
      case 'completed':
        opacity = 0.7;
        break;
      case 'paused':
        opacity = 0.6;
        break;
      case 'delayed':
        opacity = 1.0;
        break;
      default:
        opacity = 0.9;
    }
    
    const lineStyle = {
      color: routeInfo.color,
      weight: baseWeight,
      opacity: opacity,
      lineCap: 'round',
      lineJoin: 'round'
    };
    
    // Styles spéciaux selon l'état
    if (routeInfo.status === 'completed') {
      lineStyle.dashArray = '12, 8';
    } else if (routeInfo.status === 'delayed') {
      lineStyle.dashArray = '4, 4';
    } else if (routeInfo.status === 'paused') {
      lineStyle.dashArray = '8, 12';
    }
    
    // Surbrillance pour sélection
    if (isSelected) {
      lineStyle.weight = baseWeight + 1;
    }

    return lineStyle;
  }

  // Créer marqueurs de route dynamiques
  createRouteMarkers(routeInfo) {
    if (!routeInfo || !routeInfo.fullRoute) return [];

    const markers = [];
    const waypoints = routeInfo.fullRoute;
    const truck = routeInfo.truck;

    // Marqueur de départ dynamique
    markers.push({
      position: waypoints[0],
      type: 'start',
      icon: '🟢',
      popup: `<div style="text-align: center; font-family: sans-serif;">
        <strong>🟢 Point de Départ</strong><br>
        <span style="font-size: 12px;">${truck?.pickup?.address || 'Départ'}</span><br>
        <span style="font-size: 10px; color: #666;">Camion: ${truck?.truck_id || 'N/A'}</span>
      </div>`
    });

    // Marqueur d'arrivée dynamique
    const arrivalTime = truck?.estimatedArrival ?
      new Date(truck.estimatedArrival).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) :
      'Calcul en cours...';

    markers.push({
      position: waypoints[waypoints.length - 1],
      type: 'end',
      icon: '🔴',
      popup: `<div style="text-align: center; font-family: sans-serif;">
        <strong>🔴 Destination</strong><br>
        <span style="font-size: 12px;">${truck?.destination || 'Arrivée'}</span><br>
        <span style="font-size: 10px; color: #666;">ETA: ${arrivalTime}</span><br>
        <span style="font-size: 10px; color: #666;">Distance: ${routeInfo.distance || 0}km</span>
      </div>`
    });

    // ** NOUVEAU : Marqueurs de pauses obligatoires **
    if (routeInfo.mandatoryBreaks && routeInfo.mandatoryBreaks.length > 0) {
      routeInfo.mandatoryBreaks.forEach((breakInfo, index) => {
        if (breakInfo.coordinates) {
          const breakTime = new Date(breakInfo.scheduledTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const priorityColor = breakInfo.priority === 'critical' ? '#ff0000' :
                               breakInfo.priority === 'high' ? '#ff6600' : '#ff9900';

          markers.push({
            position: breakInfo.coordinates,
            type: 'mandatory_break',
            icon: breakInfo.priority === 'critical' ? '🛑' : '⏸️',
            className: 'mandatory-break-marker',
            popup: `<div style="text-align: center; font-family: sans-serif; border-left: 3px solid ${priorityColor}; padding-left: 8px;">
              <strong style="color: ${priorityColor};">${breakInfo.icon || '⏸️'} Pause Obligatoire</strong><br>
              <span style="font-size: 12px; font-weight: bold;">Durée: ${breakInfo.duration} minutes</span><br>
              <span style="font-size: 11px;">Programmée: ${breakTime}</span><br>
              <span style="font-size: 10px; color: #666;">${breakInfo.reason}</span><br>
              <span style="font-size: 9px; color: #999;">${breakInfo.regulation}</span><br>
              ${breakInfo.priority === 'critical' ? '<span style="font-size: 10px; color: #ff0000; font-weight: bold;">🚨 PAUSE IMMÉDIATE REQUISE</span>' : ''}
            </div>`
          });
        }
      });
    }

    // Points d'étapes seulement si fournis par le backend
    if (routeInfo.waypoints && routeInfo.waypoints.length > 2) {
      routeInfo.waypoints.forEach((waypoint, index) => {
        if (index > 0 && index < routeInfo.waypoints.length - 1) {
          markers.push({
            position: waypoint.coordinates || waypoint,
            type: 'waypoint',
            icon: '🔵',
            popup: `<div style="text-align: center; font-family: sans-serif;">
              <strong>🔵 Point d'Étape</strong><br>
              <span style="font-size: 12px;">${waypoint.name || `Étape ${index}`}</span><br>
              <span style="font-size: 10px; color: #666;">Type: ${waypoint.type || 'Transit'}</span>
            </div>`
          });
        }
      });
    }

    return markers;
  }

  // Gestion des événements en temps réel
  handleRouteUpdate(routeData) {
    console.log(`🗺️ Mise à jour route: ${routeData.truckId}`);
    
    // Mettre à jour le cache
    this.cacheRoute(routeData.truckId, routeData);
    
    // Notifier les composants
    this.notifyRouteUpdate(routeData.truckId, routeData);
  }

  handlePositionsUpdate(positionsData) {
    if (positionsData.trucks) {
      positionsData.trucks.forEach(truckData => {
        // Mettre à jour la position dans les routes actives
        if (this.activeRoutes.has(truckData.truck_id)) {
          const existingRoute = this.activeRoutes.get(truckData.truck_id);
          existingRoute.currentPosition = truckData.position;
          existingRoute.progress = truckData.route_progress || 0;
          existingRoute.lastUpdate = new Date().toISOString();
        }
      });
    }
  }

  // Cache des routes
  cacheRoute(truckId, routeData) {
    this.routeCache.set(truckId, {
      data: routeData,
      timestamp: Date.now()
    });
  }

  getCachedRoute(truckId) {
    const cached = this.routeCache.get(truckId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Nettoyage du cache
  clearExpiredCache() {
    const now = Date.now();
    for (const [truckId, cached] of this.routeCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.routeCache.delete(truckId);
      }
    }
  }

  // Callbacks pour mises à jour
  onRouteUpdate(callback) {
    this.routeUpdateCallbacks.push(callback);
    return () => {
      this.routeUpdateCallbacks = this.routeUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  notifyRouteUpdate(truckId, routeData) {
    this.routeUpdateCallbacks.forEach(callback => {
      try {
        callback(truckId, routeData);
      } catch (error) {
        console.error('❌ Erreur callback route:', error);
      }
    });
  }

  // Gestion des pauses dynamiques (depuis le backend)
  async pauseTruck(truckId, currentProgress, currentPosition) {
    try {
      const success = await trucksService.sendTruckCommand(truckId, 'pause', {
        progress: currentProgress,
        position: currentPosition
      });

      if (success) {
        this.pausedTrucks.set(truckId, {
          pausedAt: Date.now(),
          progress: currentProgress,
          position: currentPosition,
          isPaused: true
        });
        console.log(`🚦 Camion ${truckId} mis en pause à ${currentProgress}%`);
      }

      return success;
    } catch (error) {
      console.error(`❌ Erreur pause camion ${truckId}:`, error);
      return false;
    }
  }

  // ** NOUVEAU : Démarrer une pause obligatoire **
  async startMandatoryBreak(truckId, breakId) {
    try {
      // Récupérer les infos du break
      const breakSchedule = mandatoryBreaksService.getScheduledBreaks(truckId);
      const breakInfo = breakSchedule.find(b => b.id === breakId);

      if (!breakInfo) {
        throw new Error(`Pause ${breakId} non trouvée pour ${truckId}`);
      }

      // Démarrer la pause via le service des pauses
      const result = await mandatoryBreaksService.startBreak(breakSchedule.driverId, breakInfo);

      if (result.success) {
        // Mettre en pause le camion
        const pauseSuccess = await trucksService.sendTruckCommand(truckId, 'start_break', {
          breakId: breakId,
          breakType: breakInfo.type,
          minimumDuration: breakInfo.duration
        });

        if (pauseSuccess) {
          console.log(`⏸️ Pause obligatoire démarrée pour ${truckId}: ${breakInfo.reason}`);
          return {
            success: true,
            message: `Pause obligatoire démarrée`,
            breakInfo: breakInfo,
            minimumDuration: result.minimumDuration
          };
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Erreur démarrage pause obligatoire ${truckId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ** NOUVEAU : Terminer une pause obligatoire **
  async endMandatoryBreak(truckId, breakId) {
    try {
      // Récupérer les infos du break
      const breakSchedule = mandatoryBreaksService.getScheduledBreaks(truckId);
      const breakInfo = breakSchedule.find(b => b.id === breakId);

      if (!breakInfo) {
        throw new Error(`Pause ${breakId} non trouvée pour ${truckId}`);
      }

      // Terminer la pause via le service des pauses
      const result = await mandatoryBreaksService.endBreak(breakSchedule.driverId, breakInfo);

      if (result.success && result.canResumeDriving) {
        // Reprendre la route
        const resumeSuccess = await trucksService.sendTruckCommand(truckId, 'end_break', {
          breakId: breakId,
          actualDuration: result.duration
        });

        if (resumeSuccess) {
          console.log(`▶️ Pause obligatoire terminée pour ${truckId} après ${result.duration}min`);
          return {
            success: true,
            message: `Pause terminée après ${result.duration}min`,
            canResumeDriving: true,
            duration: result.duration
          };
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Erreur fin pause obligatoire ${truckId}:`, error);
      return {
        success: false,
        error: error.message,
        canResumeDriving: false
      };
    }
  }

  // ** NOUVEAU : Vérifier si une pause est requise **
  checkBreakRequirement(truckId) {
    try {
      const schedule = mandatoryBreaksService.getScheduledBreaks(truckId);
      if (!schedule) return { required: false };

      const driverId = schedule.driverId;
      const breakCheck = mandatoryBreaksService.isBreakRequired(driverId);

      return {
        ...breakCheck,
        nextBreak: mandatoryBreaksService.getNextBreak(truckId, 0), // À adapter selon la progression actuelle
        statistics: mandatoryBreaksService.getBreakStatistics(driverId)
      };
    } catch (error) {
      console.error(`❌ Erreur vérification pause ${truckId}:`, error);
      return { required: false, error: error.message };
    }
  }

  async resumeTruck(truckId) {
    try {
      const success = await trucksService.sendTruckCommand(truckId, 'resume');
      
      if (success && this.pausedTrucks.has(truckId)) {
        const pauseData = this.pausedTrucks.get(truckId);
        this.pausedTrucks.delete(truckId);
        console.log(`▶️ Camion ${truckId} reprend depuis ${pauseData.progress}%`);
        return pauseData;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Erreur reprise camion ${truckId}:`, error);
      return null;
    }
  }

  // Obtenir position actuelle depuis le backend
  async getCurrentTruckPosition(truckId) {
    try {
      const truckData = await trucksService.getTruckById(truckId);
      return truckData ? truckData.position : null;
    } catch (error) {
      console.error(`❌ Erreur position ${truckId}:`, error);
      return null;
    }
  }

  // Calculer bearing dynamiquement
  calculateBearing(routeInfo, progress) {
    if (!routeInfo || !routeInfo.fullRoute) return 0;

    const waypoints = routeInfo.fullRoute;
    const totalPoints = waypoints.length;
    const progressIndex = Math.floor((progress / 100) * (totalPoints - 1));
    const nextIndex = Math.min(progressIndex + 1, totalPoints - 1);

    if (progressIndex === nextIndex) return 0;

    const current = waypoints[progressIndex];
    const next = waypoints[nextIndex];

    const deltaLat = next[0] - current[0];
    const deltaLng = next[1] - current[1];

    let bearing = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;

    return bearing;
  }
}

// Instance singleton
const dynamicRoutesService = new DynamicRoutesService();

export default dynamicRoutesService;
