// Service de notifications préventives pour alerter les conducteurs 1-2h à l'avance
class PreventiveAlertsService {
  constructor() {
    this.routeAlerts = new Map(); // Alertes le long des routes
    this.notifiedTrucks = new Set(); // Camions déjà notifiés pour éviter répétitions
  }

  // Ajouter une alerte le long d'une route
  addRouteAlert(alert) {
    const alertKey = `${alert.position[0].toFixed(4)}-${alert.position[1].toFixed(4)}`;
    this.routeAlerts.set(alertKey, alert);
  }

  // Vérifier si un camion approche d'une zone avec problème
  checkUpcomingAlerts(truckId, currentPosition, routeWaypoints, currentProgressIndex) {
    if (!currentPosition || !routeWaypoints || currentProgressIndex >= routeWaypoints.length - 1) {
      return [];
    }

    const upcomingAlerts = [];
    const notificationKey = `${truckId}-${Date.now()}`;

    // Vérifier les 10-15 prochains waypoints (environ 1-2h de route)
    const lookAheadPoints = Math.min(15, routeWaypoints.length - currentProgressIndex - 1);
    
    for (let i = 1; i <= lookAheadPoints; i++) {
      const futureIndex = currentProgressIndex + i;
      if (futureIndex < routeWaypoints.length) {
        const futurePosition = routeWaypoints[futureIndex];
        
        // Chercher des alertes dans un rayon de 2km du point futur
        this.routeAlerts.forEach((alert, alertKey) => {
          const distance = this.calculateDistance(futurePosition, alert.position);
          
          if (distance < 2000 && !this.notifiedTrucks.has(`${truckId}-${alert.id}`)) {
            // Estimer le temps d'arrivée (supposons 60 km/h moyenne)
            const estimatedTimeMinutes = (i * 2); // Approximation: 2 min par waypoint
            
            if (estimatedTimeMinutes >= 60 && estimatedTimeMinutes <= 120) { // Entre 1h et 2h
              upcomingAlerts.push({
                ...alert,
                isPreventive: true,
                estimatedTime: estimatedTimeMinutes,
                message: `⚠️ Attention: ${alert.title} détect�� sur votre trajet dans ${Math.round(estimatedTimeMinutes)}min`,
                severity: 'warning',
                truckId: truckId
              });
              
              // Marquer comme notifié
              this.notifiedTrucks.add(`${truckId}-${alert.id}`);
            }
          }
        });
      }
    }

    return upcomingAlerts;
  }

  // Calculer distance entre deux points GPS (en mètres)
  calculateDistance(pos1, pos2) {
    const R = 6371e3; // Rayon de la terre en mètres
    const φ1 = pos1[0] * Math.PI / 180;
    const φ2 = pos2[0] * Math.PI / 180;
    const Δφ = (pos2[0] - pos1[0]) * Math.PI / 180;
    const Δλ = (pos2[1] - pos1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Générer alertes préventives basées sur les conditions de trafic
  generateTrafficPredictions() {
    const predictions = [
      {
        id: `traffic-pred-${Date.now()}`,
        type: 'traffic',
        title: 'Embouteillage prévu',
        position: [36.8354, 10.2045], // Pont Radès
        message: 'Trafic dense attendu aux heures de pointe (17h-19h)',
        severity: 'warning',
        timeWindow: { start: 17, end: 19 }
      },
      {
        id: `construction-pred-${Date.now() + 1}`,
        type: 'construction',
        title: 'Travaux programmés',
        position: [35.8256, 10.6369], // Sousse
        message: 'Travaux de maintenance prévus demain matin (8h-12h)',
        severity: 'info',
        timeWindow: { start: 8, end: 12, day: 'tomorrow' }
      }
    ];

    predictions.forEach(pred => this.addRouteAlert(pred));
    return predictions;
  }

  // Nettoyer les notifications anciennes
  cleanupOldNotifications() {
    const cutoffTime = Date.now() - (4 * 60 * 60 * 1000); // 4 heures
    
    // Nettoyer les camions notifiés (garder seulement les 4 dernières heures)
    this.notifiedTrucks.forEach(key => {
      const timestamp = key.split('-').pop();
      if (parseInt(timestamp) < cutoffTime) {
        this.notifiedTrucks.delete(key);
      }
    });
  }

  // Initialiser avec quelques alertes sur les routes principales
  initializeRouteAlerts() {
    const initialAlerts = [
      {
        id: 'route-alert-1',
        type: 'construction',
        title: 'Travaux Route A1',
        position: [36.8666, 10.2269], // Enfidha
        message: 'Travaux de réfection, voie réduite',
        severity: 'warning'
      },
      {
        id: 'route-alert-2',
        type: 'accident',
        title: 'Accident signalé',
        position: [35.8256, 10.6369], // Sousse
        message: 'Accident léger, circulation ralentie',
        severity: 'danger'
      },
      {
        id: 'route-alert-3',
        type: 'weatherRain',
        title: 'Zone pluvieuse',
        position: [34.7406, 10.7603], // Sfax
        message: 'Pluie modérée, chaussée glissante',
        severity: 'warning'
      }
    ];

    initialAlerts.forEach(alert => this.addRouteAlert(alert));
  }
}

const preventiveAlertsService = new PreventiveAlertsService();
export default preventiveAlertsService;
