// Service de gestion des pauses obligatoires réglementaires
// Conforme aux réglementations européennes de transport routier

class MandatoryBreaksService {
  constructor() {
    this.MINIMUM_BREAK_DURATION = 45; // minutes minimum réglementaires
    this.MAXIMUM_DRIVING_TIME = 4.5 * 60; // 4h30 maximum de conduite continue (en minutes)
    this.DAILY_DRIVING_LIMIT = 9 * 60; // 9h maximum par jour (en minutes)
    this.WEEKLY_DRIVING_LIMIT = 56 * 60; // 56h maximum par semaine (en minutes)
    
    // Cache des états de conduite
    this.driverStates = new Map();
    this.breakSchedules = new Map();
    this.alerts = [];
    
    // Configuration des types de pauses
    this.BREAK_TYPES = {
      MANDATORY: 'mandatory', // Pause obligatoire 45min
      EXTENDED: 'extended',   // Pause prolongée 
      DAILY_REST: 'daily_rest', // Repos journalier
      WEEKLY_REST: 'weekly_rest' // Repos hebdomadaire
    };
  }

  // Calculer les pauses obligatoires pour un trajet donné
  calculateMandatoryBreaks(routeData, driverId, currentProgress = 0) {
    if (!routeData || !routeData.duration || !driverId) {
      console.warn('⚠️ Données insuffisantes pour calculer les pauses');
      return { breaks: [], warnings: [] };
    }

    const totalDuration = routeData.duration; // en secondes
    const totalDurationMinutes = Math.ceil(totalDuration / 60);
    const driverState = this.getDriverState(driverId);
    
    console.log(`🚚 Calcul pauses pour trajet de ${totalDurationMinutes}min (chauffeur: ${driverId})`);
    
    const breaks = [];
    const warnings = [];
    
    // Si le trajet dépasse 4h30, pauses obligatoires nécessaires
    if (totalDurationMinutes > this.MAXIMUM_DRIVING_TIME) {
      const breaksNeeded = Math.ceil(totalDurationMinutes / this.MAXIMUM_DRIVING_TIME) - 1;
      
      for (let i = 0; i < breaksNeeded; i++) {
        const breakPosition = ((i + 1) * this.MAXIMUM_DRIVING_TIME) / totalDurationMinutes * 100;
        
        // Calculer position géographique approximative de la pause
        const breakLocationCoords = this.calculateBreakLocation(routeData, breakPosition);
        
        const mandatoryBreak = {
          id: `break_${driverId}_${i + 1}`,
          type: this.BREAK_TYPES.MANDATORY,
          driverId: driverId,
          position: breakPosition, // pourcentage du trajet
          coordinates: breakLocationCoords,
          duration: this.MINIMUM_BREAK_DURATION,
          scheduledTime: this.calculateScheduledTime(routeData, breakPosition),
          isCompleted: false,
          isActive: false,
          reason: 'Pause réglementaire obligatoire (45min)',
          regulation: 'CE 561/2006 Art. 7',
          priority: 'high',
          canBeSkipped: false
        };
        
        breaks.push(mandatoryBreak);
      }
      
      warnings.push({
        type: 'long_drive',
        message: `Trajet long détecté: ${breaksNeeded} pause(s) obligatoire(s) de 45min`,
        severity: 'warning'
      });
    }
    
    // Vérifier le temps de conduite cumulé du chauffeur
    const dailyDrivingTime = driverState.dailyDrivingTime + totalDurationMinutes;
    if (dailyDrivingTime > this.DAILY_DRIVING_LIMIT) {
      warnings.push({
        type: 'daily_limit_exceeded',
        message: `Limite journalière dépassée: ${Math.round(dailyDrivingTime/60)}h (max 9h)`,
        severity: 'danger'
      });
    }
    
    // Vérifier si une pause est nécessaire avant de commencer
    const timeSinceLastBreak = driverState.timeSinceLastBreak;
    if (timeSinceLastBreak > this.MAXIMUM_DRIVING_TIME) {
      breaks.unshift({
        id: `break_${driverId}_immediate`,
        type: this.BREAK_TYPES.MANDATORY,
        driverId: driverId,
        position: 0, // Au début du trajet
        coordinates: routeData.waypoints ? routeData.waypoints[0] : null,
        duration: this.MINIMUM_BREAK_DURATION,
        scheduledTime: new Date().toISOString(),
        isCompleted: false,
        isActive: false,
        reason: 'Pause immédiate requise - temps de conduite dépassé',
        regulation: 'CE 561/2006 Art. 7',
        priority: 'critical',
        canBeSkipped: false
      });
      
      warnings.push({
        type: 'immediate_break_required',
        message: 'Pause immédiate requise avant de commencer le trajet',
        severity: 'danger'
      });
    }
    
    return { breaks, warnings };
  }

  // Calculer la position géographique approximative d'une pause
  calculateBreakLocation(routeData, progressPercentage) {
    if (!routeData.waypoints || routeData.waypoints.length === 0) {
      return null;
    }
    
    const waypoints = routeData.waypoints;
    const totalPoints = waypoints.length;
    const targetIndex = Math.floor((progressPercentage / 100) * (totalPoints - 1));
    
    if (targetIndex >= 0 && targetIndex < waypoints.length) {
      return waypoints[targetIndex];
    }
    
    return waypoints[Math.floor(waypoints.length / 2)]; // Position médiane par défaut
  }

  // Calculer l'heure programmée d'une pause
  calculateScheduledTime(routeData, progressPercentage) {
    if (!routeData.duration) return new Date().toISOString();
    
    const totalDurationMs = routeData.duration * 1000;
    const breakTimeMs = (progressPercentage / 100) * totalDurationMs;
    const scheduledTime = new Date(Date.now() + breakTimeMs);
    
    return scheduledTime.toISOString();
  }

  // Obtenir l'état actuel d'un chauffeur
  getDriverState(driverId) {
    if (!this.driverStates.has(driverId)) {
      // État initial du chauffeur
      this.driverStates.set(driverId, {
        dailyDrivingTime: 0, // minutes conduites aujourd'hui
        weeklyDrivingTime: 0, // minutes conduites cette semaine
        timeSinceLastBreak: 0, // minutes depuis dernière pause
        lastBreakTime: null,
        lastBreakDuration: 0,
        isOnBreak: false,
        currentBreakStart: null,
        todayStartTime: new Date().toISOString(),
        violations: []
      });
    }
    
    return this.driverStates.get(driverId);
  }

  // Démarrer une pause pour un chauffeur
  async startBreak(driverId, breakInfo) {
    try {
      const driverState = this.getDriverState(driverId);
      
      if (driverState.isOnBreak) {
        throw new Error(`Chauffeur ${driverId} déjà en pause`);
      }
      
      // Marquer le début de la pause
      driverState.isOnBreak = true;
      driverState.currentBreakStart = new Date();
      
      // Mettre à jour le break info
      if (breakInfo) {
        breakInfo.isActive = true;
        breakInfo.actualStartTime = new Date().toISOString();
      }
      
      console.log(`⏸️ Pause démarrée pour ${driverId} à ${new Date().toLocaleTimeString()}`);
      
      // Notifier les autres services
      this.notifyBreakEvent('break_started', {
        driverId,
        breakInfo,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: `Pause démarrée pour ${driverId}`,
        breakStartTime: driverState.currentBreakStart,
        minimumDuration: this.MINIMUM_BREAK_DURATION
      };
    } catch (error) {
      console.error(`❌ Erreur démarrage pause ${driverId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Terminer une pause et valider la durée
  async endBreak(driverId, breakInfo) {
    try {
      const driverState = this.getDriverState(driverId);
      
      if (!driverState.isOnBreak) {
        throw new Error(`Chauffeur ${driverId} n'est pas en pause`);
      }
      
      const breakDuration = Math.floor((Date.now() - driverState.currentBreakStart.getTime()) / 60000);
      
      // Vérifier la durée minimale
      if (breakDuration < this.MINIMUM_BREAK_DURATION) {
        const remaining = this.MINIMUM_BREAK_DURATION - breakDuration;
        throw new Error(`Pause trop courte: ${remaining}min restantes (minimum ${this.MINIMUM_BREAK_DURATION}min)`);
      }
      
      // Mettre à jour l'état du chauffeur
      driverState.isOnBreak = false;
      driverState.lastBreakTime = driverState.currentBreakStart;
      driverState.lastBreakDuration = breakDuration;
      driverState.timeSinceLastBreak = 0;
      driverState.currentBreakStart = null;
      
      // Mettre à jour le break info
      if (breakInfo) {
        breakInfo.isActive = false;
        breakInfo.isCompleted = true;
        breakInfo.actualEndTime = new Date().toISOString();
        breakInfo.actualDuration = breakDuration;
      }
      
      console.log(`▶️ Pause terminée pour ${driverId} après ${breakDuration}min`);
      
      // Notifier les autres services
      this.notifyBreakEvent('break_ended', {
        driverId,
        breakInfo,
        duration: breakDuration,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: `Pause terminée après ${breakDuration}min`,
        duration: breakDuration,
        canResumeDriving: true
      };
    } catch (error) {
      console.error(`❌ Erreur fin pause ${driverId}:`, error);
      return {
        success: false,
        error: error.message,
        canResumeDriving: false
      };
    }
  }

  // Vérifier si une pause est requise maintenant
  isBreakRequired(driverId, currentDrivingTime = 0) {
    const driverState = this.getDriverState(driverId);
    const totalDrivingTime = driverState.timeSinceLastBreak + currentDrivingTime;
    
    return {
      required: totalDrivingTime >= this.MAXIMUM_DRIVING_TIME,
      urgency: totalDrivingTime >= this.MAXIMUM_DRIVING_TIME ? 'immediate' : 
               totalDrivingTime >= (this.MAXIMUM_DRIVING_TIME * 0.9) ? 'soon' : 'none',
      timeRemaining: Math.max(0, this.MAXIMUM_DRIVING_TIME - totalDrivingTime),
      currentDrivingTime: totalDrivingTime
    };
  }

  // Mettre à jour le temps de conduite d'un chauffeur
  updateDrivingTime(driverId, additionalMinutes) {
    const driverState = this.getDriverState(driverId);
    
    if (!driverState.isOnBreak) {
      driverState.dailyDrivingTime += additionalMinutes;
      driverState.weeklyDrivingTime += additionalMinutes;
      driverState.timeSinceLastBreak += additionalMinutes;
    }
    
    // Vérifier les violations potentielles
    this.checkForViolations(driverId);
  }

  // Vérifier les violations de temps de conduite
  checkForViolations(driverId) {
    const driverState = this.getDriverState(driverId);
    const violations = [];
    
    // Vérification temps de conduite continu
    if (driverState.timeSinceLastBreak > this.MAXIMUM_DRIVING_TIME) {
      violations.push({
        type: 'continuous_driving_exceeded',
        severity: 'critical',
        message: `Temps de conduite continu dépassé: ${Math.round(driverState.timeSinceLastBreak/60)}h (max 4h30)`,
        regulation: 'CE 561/2006 Art. 7'
      });
    }
    
    // Vérification limite journalière
    if (driverState.dailyDrivingTime > this.DAILY_DRIVING_LIMIT) {
      violations.push({
        type: 'daily_limit_exceeded',
        severity: 'critical',
        message: `Limite journalière dépassée: ${Math.round(driverState.dailyDrivingTime/60)}h (max 9h)`,
        regulation: 'CE 561/2006 Art. 6'
      });
    }
    
    // Vérification limite hebdomadaire
    if (driverState.weeklyDrivingTime > this.WEEKLY_DRIVING_LIMIT) {
      violations.push({
        type: 'weekly_limit_exceeded',
        severity: 'critical',
        message: `Limite hebdomadaire dépassée: ${Math.round(driverState.weeklyDrivingTime/60)}h (max 56h)`,
        regulation: 'CE 561/2006 Art. 6'
      });
    }
    
    driverState.violations = violations;
    
    // Notifier les violations critiques
    violations.forEach(violation => {
      if (violation.severity === 'critical') {
        this.notifyBreakEvent('violation_detected', {
          driverId,
          violation,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return violations;
  }

  // Obtenir les pauses programmées pour un camion
  getScheduledBreaks(truckId) {
    return this.breakSchedules.get(truckId) || [];
  }

  // Programmer les pauses pour un trajet
  scheduleBreaksForRoute(truckId, routeData, driverId) {
    const breakData = this.calculateMandatoryBreaks(routeData, driverId);
    
    this.breakSchedules.set(truckId, {
      truckId,
      driverId,
      breaks: breakData.breaks,
      warnings: breakData.warnings,
      scheduledAt: new Date().toISOString(),
      routeInfo: {
        duration: routeData.duration,
        distance: routeData.distance
      }
    });
    
    console.log(`📅 ${breakData.breaks.length} pause(s) programmée(s) pour ${truckId}`);
    
    return breakData;
  }

  // Obtenir le prochain break à venir
  getNextBreak(truckId, currentProgress) {
    const schedule = this.breakSchedules.get(truckId);
    if (!schedule) return null;
    
    const upcomingBreaks = schedule.breaks.filter(
      breakInfo => !breakInfo.isCompleted && breakInfo.position > currentProgress
    );
    
    if (upcomingBreaks.length === 0) return null;
    
    // Retourner le prochain break
    return upcomingBreaks.sort((a, b) => a.position - b.position)[0];
  }

  // Système de notifications pour les événements de pause
  notifyBreakEvent(eventType, data) {
    // Ajouter à la liste des alertes internes
    this.alerts.push({
      id: `break_alert_${Date.now()}`,
      type: 'break_management',
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Notifier via console pour debug
    switch (eventType) {
      case 'break_started':
        console.log(`🚦 PAUSE DÉMARRÉE: ${data.driverId}`);
        break;
      case 'break_ended':
        console.log(`▶️ PAUSE TERMINÉE: ${data.driverId} (${data.duration}min)`);
        break;
      case 'violation_detected':
        console.warn(`⚠️ VIOLATION: ${data.violation.message}`);
        break;
    }
    
    // Ici vous pouvez ajouter l'intégration avec Socket.IO, Kafka, etc.
  }

  // Obtenir les statistiques des pauses
  getBreakStatistics(driverId = null) {
    if (driverId) {
      const driverState = this.getDriverState(driverId);
      return {
        dailyDrivingTime: driverState.dailyDrivingTime,
        timeSinceLastBreak: driverState.timeSinceLastBreak,
        isOnBreak: driverState.isOnBreak,
        violations: driverState.violations.length,
        lastBreakDuration: driverState.lastBreakDuration
      };
    }
    
    // Statistiques globales
    const allDrivers = Array.from(this.driverStates.entries());
    return {
      totalDrivers: allDrivers.length,
      driversOnBreak: allDrivers.filter(([id, state]) => state.isOnBreak).length,
      totalViolations: allDrivers.reduce((sum, [id, state]) => sum + state.violations.length, 0),
      averageDailyDriving: allDrivers.reduce((sum, [id, state]) => sum + state.dailyDrivingTime, 0) / allDrivers.length
    };
  }

  // Réinitialiser les données d'un chauffeur (nouveau jour)
  resetDailyData(driverId) {
    const driverState = this.getDriverState(driverId);
    driverState.dailyDrivingTime = 0;
    driverState.timeSinceLastBreak = 0;
    driverState.violations = [];
    driverState.todayStartTime = new Date().toISOString();
    
    console.log(`🔄 Données journalières réinitialisées pour ${driverId}`);
  }

  // Export des données pour intégration avec le backend
  exportBreakData() {
    return {
      driverStates: Object.fromEntries(this.driverStates),
      breakSchedules: Object.fromEntries(this.breakSchedules),
      alerts: this.alerts,
      configuration: {
        minimumBreakDuration: this.MINIMUM_BREAK_DURATION,
        maximumDrivingTime: this.MAXIMUM_DRIVING_TIME,
        dailyDrivingLimit: this.DAILY_DRIVING_LIMIT
      }
    };
  }
}

// Instance singleton
const mandatoryBreaksService = new MandatoryBreaksService();

export default mandatoryBreaksService;
