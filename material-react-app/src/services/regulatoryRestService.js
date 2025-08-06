// Service de gestion des temps de repos réglementaires (CE 561/2006)
// Conforme aux réglementations européennes sur les temps de conduite et de repos

class RegulatoryRestService {
  constructor() {
    // Réglementations CE 561/2006 (temps en minutes)
    this.REGULATIONS = {
      // Temps de conduite
      MAX_DAILY_DRIVING: 9 * 60,          // 9h maximum par jour
      MAX_EXTENDED_DAILY_DRIVING: 10 * 60, // 10h maximum (2x/semaine)
      MAX_WEEKLY_DRIVING: 56 * 60,         // 56h maximum par semaine
      MAX_BIWEEKLY_DRIVING: 90 * 60,       // 90h sur 2 semaines consécutives
      MAX_CONTINUOUS_DRIVING: 4.5 * 60,    // 4h30 maximum en continu
      
      // Pauses obligatoires
      MIN_BREAK_DURATION: 45,              // 45 minutes minimum
      BREAK_AFTER_DRIVING: 4.5 * 60,       // Pause après 4h30 de conduite
      ALTERNATIVE_BREAK_15MIN: 15,         // Pause de 15min
      ALTERNATIVE_BREAK_30MIN: 30,         // + pause de 30min = 45min total
      
      // Repos journalier
      MIN_DAILY_REST: 11 * 60,             // 11h minimum de repos journalier
      REDUCED_DAILY_REST: 9 * 60,          // 9h minimum (3x/semaine)
      MAX_PERIODS_BETWEEN_RESTS: 24 * 60,  // 24h maximum entre 2 repos
      
      // Repos hebdomadaire
      MIN_WEEKLY_REST: 45 * 60,            // 45h minimum de repos hebdomadaire
      REDUCED_WEEKLY_REST: 24 * 60,        // 24h minimum (compensation obligatoire)
      MAX_DAYS_WITHOUT_WEEKLY_REST: 6,     // 6 jours maximum sans repos hebdo
      
      // Limites spéciales
      MAX_EXTENDED_DRIVING_DAYS_PER_WEEK: 2, // 2 jours max à 10h/semaine
      MAX_REDUCED_REST_DAYS_PER_WEEK: 3      // 3 jours max à 9h repos/semaine
    };

    // État global des chauffeurs
    this.driversState = new Map();
    this.weeklySchedules = new Map();
    this.violations = new Map();
    this.compensationRequired = new Map();

    // Périodes de référence (semaines)
    this.currentWeek = this.getCurrentWeek();
    this.previousWeek = this.currentWeek - 1;
  }

  // Calculer la semaine de référence (numéro de semaine ISO)
  getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  }

  // Initialiser ou récupérer l'état d'un chauffeur
  getDriverState(driverId) {
    if (!this.driversState.has(driverId)) {
      this.driversState.set(driverId, {
        // Temps de conduite
        dailyDrivingTime: 0,
        weeklyDrivingTime: 0,
        biweeklyDrivingTime: 0,
        continuousDrivingTime: 0,
        
        // Dernières activités
        lastDrivingStart: null,
        lastBreakTime: null,
        lastBreakDuration: 0,
        lastDailyRestStart: null,
        lastDailyRestDuration: 0,
        lastWeeklyRestStart: null,
        
        // Compteurs
        extendedDrivingDaysThisWeek: 0,
        reducedRestDaysThisWeek: 0,
        daysWithoutWeeklyRest: 0,
        
        // État actuel
        isCurrentlyDriving: false,
        isOnBreak: false,
        isOnDailyRest: false,
        isOnWeeklyRest: false,
        
        // Violations et compensations
        pendingViolations: [],
        compensationOwed: 0, // Minutes de repos dues
        
        // Historique
        dailyHistory: [],
        weeklyHistory: [],
        
        // Dates de référence
        currentShiftStart: null,
        weekStart: this.getWeekStartDate(),
        lastUpdate: new Date().toISOString()
      });
    }
    
    return this.driversState.get(driverId);
  }

  // Obtenir le début de la semaine courante
  getWeekStartDate() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Démarrer une période de conduite
  async startDriving(driverId, timestamp = new Date()) {
    const driver = this.getDriverState(driverId);
    
    // Vérifier si le chauffeur peut conduire
    const canDrive = this.canDriverStartDriving(driverId);
    if (!canDrive.allowed) {
      throw new Error(`Conduite interdite: ${canDrive.reason}`);
    }
    
    driver.isCurrentlyDriving = true;
    driver.lastDrivingStart = timestamp;
    driver.isOnBreak = false;
    driver.isOnDailyRest = false;
    driver.isOnWeeklyRest = false;
    
    // Démarrer un nouveau shift si nécessaire
    if (!driver.currentShiftStart) {
      driver.currentShiftStart = timestamp;
    }
    
    driver.lastUpdate = timestamp.toISOString();
    
    console.log(`🚗 Conduite démarrée pour ${driverId} à ${timestamp.toLocaleTimeString()}`);
    
    return {
      success: true,
      driverId,
      startTime: timestamp,
      canDriveUntil: this.calculateMaxDrivingTime(driverId),
      nextBreakRequired: this.calculateNextBreakTime(driverId)
    };
  }

  // Arrêter la conduite
  async stopDriving(driverId, timestamp = new Date()) {
    const driver = this.getDriverState(driverId);
    
    if (!driver.isCurrentlyDriving || !driver.lastDrivingStart) {
      throw new Error(`Chauffeur ${driverId} n'était pas en conduite`);
    }
    
    // Calculer le temps de conduite de cette session
    const drivingDuration = Math.floor((timestamp - new Date(driver.lastDrivingStart)) / 60000);
    
    // Mettre à jour les compteurs
    driver.dailyDrivingTime += drivingDuration;
    driver.weeklyDrivingTime += drivingDuration;
    driver.biweeklyDrivingTime += drivingDuration;
    driver.continuousDrivingTime += drivingDuration;
    
    driver.isCurrentlyDriving = false;
    driver.lastUpdate = timestamp.toISOString();
    
    // Ajouter à l'historique
    driver.dailyHistory.push({
      type: 'driving',
      start: driver.lastDrivingStart,
      end: timestamp,
      duration: drivingDuration
    });
    
    // Vérifier les violations
    this.checkViolations(driverId);
    
    console.log(`🛑 Conduite arrêtée pour ${driverId}: ${drivingDuration}min`);
    
    return {
      success: true,
      driverId,
      endTime: timestamp,
      sessionDuration: drivingDuration,
      dailyTotal: driver.dailyDrivingTime,
      weeklyTotal: driver.weeklyDrivingTime,
      violations: driver.pendingViolations
    };
  }

  // Démarrer une pause
  async startBreak(driverId, timestamp = new Date()) {
    const driver = this.getDriverState(driverId);
    
    if (driver.isCurrentlyDriving) {
      await this.stopDriving(driverId, timestamp);
    }
    
    driver.isOnBreak = true;
    driver.lastBreakTime = timestamp;
    driver.lastUpdate = timestamp.toISOString();
    
    console.log(`⏸️ Pause démarrée pour ${driverId} à ${timestamp.toLocaleTimeString()}`);
    
    return {
      success: true,
      driverId,
      breakStart: timestamp,
      minimumDuration: this.REGULATIONS.MIN_BREAK_DURATION
    };
  }

  // Terminer une pause
  async endBreak(driverId, timestamp = new Date()) {
    const driver = this.getDriverState(driverId);
    
    if (!driver.isOnBreak || !driver.lastBreakTime) {
      throw new Error(`Chauffeur ${driverId} n'était pas en pause`);
    }
    
    const breakDuration = Math.floor((timestamp - new Date(driver.lastBreakTime)) / 60000);
    
    // Vérifier la durée minimale
    if (breakDuration < this.REGULATIONS.MIN_BREAK_DURATION) {
      throw new Error(`Pause trop courte: ${breakDuration}min (minimum ${this.REGULATIONS.MIN_BREAK_DURATION}min)`);
    }
    
    driver.isOnBreak = false;
    driver.lastBreakDuration = breakDuration;
    
    // Réinitialiser le temps de conduite continu si pause suffisante
    if (breakDuration >= this.REGULATIONS.MIN_BREAK_DURATION) {
      driver.continuousDrivingTime = 0;
    }
    
    // Ajouter à l'historique
    driver.dailyHistory.push({
      type: 'break',
      start: driver.lastBreakTime,
      end: timestamp,
      duration: breakDuration
    });
    
    driver.lastUpdate = timestamp.toISOString();
    
    console.log(`▶️ Pause terminée pour ${driverId}: ${breakDuration}min`);
    
    return {
      success: true,
      driverId,
      breakEnd: timestamp,
      breakDuration: breakDuration,
      canResumeDriving: true
    };
  }

  // Démarrer repos journalier
  async startDailyRest(driverId, timestamp = new Date()) {
    const driver = this.getDriverState(driverId);
    
    if (driver.isCurrentlyDriving) {
      await this.stopDriving(driverId, timestamp);
    }
    
    driver.isOnDailyRest = true;
    driver.lastDailyRestStart = timestamp;
    driver.isOnBreak = false;
    driver.lastUpdate = timestamp.toISOString();
    
    console.log(`🏠 Repos journalier démarré pour ${driverId} à ${timestamp.toLocaleTimeString()}`);
    
    return {
      success: true,
      driverId,
      restStart: timestamp,
      minimumDuration: this.REGULATIONS.MIN_DAILY_REST
    };
  }

  // Terminer repos journalier
  async endDailyRest(driverId, timestamp = new Date()) {
    const driver = this.getDriverState(driverId);
    
    if (!driver.isOnDailyRest || !driver.lastDailyRestStart) {
      throw new Error(`Chauffeur ${driverId} n'était pas en repos journalier`);
    }
    
    const restDuration = Math.floor((timestamp - new Date(driver.lastDailyRestStart)) / 60000);
    const minRestRequired = this.REGULATIONS.MIN_DAILY_REST;
    
    // Vérifier durée minimale (avec possibilité de repos réduit)
    const isReducedRestAllowed = driver.reducedRestDaysThisWeek < this.REGULATIONS.MAX_REDUCED_REST_DAYS_PER_WEEK;
    const minimumRequired = isReducedRestAllowed ? this.REGULATIONS.REDUCED_DAILY_REST : minRestRequired;
    
    if (restDuration < minimumRequired) {
      throw new Error(`Repos trop court: ${Math.floor(restDuration/60)}h${restDuration%60}min (minimum ${Math.floor(minimumRequired/60)}h)`);
    }
    
    driver.isOnDailyRest = false;
    driver.lastDailyRestDuration = restDuration;
    
    // Compter comme repos réduit si applicable
    if (restDuration < minRestRequired && restDuration >= this.REGULATIONS.REDUCED_DAILY_REST) {
      driver.reducedRestDaysThisWeek++;
    }
    
    // Réinitialiser les compteurs journaliers
    driver.dailyDrivingTime = 0;
    driver.continuousDrivingTime = 0;
    driver.currentShiftStart = null;
    
    // Ajouter à l'historique
    driver.dailyHistory.push({
      type: 'daily_rest',
      start: driver.lastDailyRestStart,
      end: timestamp,
      duration: restDuration
    });
    
    driver.lastUpdate = timestamp.toISOString();
    
    console.log(`🌅 Repos journalier terminé pour ${driverId}: ${Math.floor(restDuration/60)}h${restDuration%60}min`);
    
    return {
      success: true,
      driverId,
      restEnd: timestamp,
      restDuration: restDuration,
      wasReduced: restDuration < minRestRequired
    };
  }

  // Vérifier si un chauffeur peut commencer à conduire
  canDriverStartDriving(driverId) {
    const driver = this.getDriverState(driverId);
    
    // Vérifier temps de conduite journalier
    const maxDaily = driver.extendedDrivingDaysThisWeek < this.REGULATIONS.MAX_EXTENDED_DRIVING_DAYS_PER_WEEK ? 
      this.REGULATIONS.MAX_EXTENDED_DAILY_DRIVING : this.REGULATIONS.MAX_DAILY_DRIVING;
    
    if (driver.dailyDrivingTime >= maxDaily) {
      return {
        allowed: false,
        reason: `Limite journalière atteinte: ${Math.floor(driver.dailyDrivingTime/60)}h/${Math.floor(maxDaily/60)}h`
      };
    }
    
    // Vérifier temps de conduite continu
    if (driver.continuousDrivingTime >= this.REGULATIONS.MAX_CONTINUOUS_DRIVING) {
      return {
        allowed: false,
        reason: `Pause obligatoire: ${Math.floor(driver.continuousDrivingTime/60)}h30 de conduite continue`
      };
    }
    
    // Vérifier temps de conduite hebdomadaire
    if (driver.weeklyDrivingTime >= this.REGULATIONS.MAX_WEEKLY_DRIVING) {
      return {
        allowed: false,
        reason: `Limite hebdomadaire atteinte: ${Math.floor(driver.weeklyDrivingTime/60)}h/56h`
      };
    }
    
    // Vérifier repos journalier requis
    if (driver.currentShiftStart) {
      const shiftDuration = (Date.now() - new Date(driver.currentShiftStart)) / 60000;
      if (shiftDuration >= this.REGULATIONS.MAX_PERIODS_BETWEEN_RESTS) {
        return {
          allowed: false,
          reason: `Repos journalier obligatoire: ${Math.floor(shiftDuration/60)}h depuis le début du shift`
        };
      }
    }
    
    return { allowed: true };
  }

  // Calculer le temps de conduite maximum restant
  calculateMaxDrivingTime(driverId) {
    const driver = this.getDriverState(driverId);
    
    const dailyRemaining = this.REGULATIONS.MAX_DAILY_DRIVING - driver.dailyDrivingTime;
    const continuousRemaining = this.REGULATIONS.MAX_CONTINUOUS_DRIVING - driver.continuousDrivingTime;
    const weeklyRemaining = this.REGULATIONS.MAX_WEEKLY_DRIVING - driver.weeklyDrivingTime;
    
    const maxTime = Math.min(dailyRemaining, continuousRemaining, weeklyRemaining);
    
    return {
      maxMinutes: Math.max(0, maxTime),
      limitedBy: maxTime === dailyRemaining ? 'daily' : 
                 maxTime === continuousRemaining ? 'continuous' : 'weekly',
      dailyRemaining,
      continuousRemaining,
      weeklyRemaining
    };
  }

  // Calculer quand la prochaine pause est requise
  calculateNextBreakTime(driverId) {
    const driver = this.getDriverState(driverId);
    
    if (!driver.isCurrentlyDriving || !driver.lastDrivingStart) {
      return null;
    }
    
    const timeUntilBreak = this.REGULATIONS.BREAK_AFTER_DRIVING - driver.continuousDrivingTime;
    
    if (timeUntilBreak <= 0) {
      return {
        required: 'immediate',
        reason: 'Temps de conduite continu dépassé'
      };
    }
    
    const breakTime = new Date(Date.now() + timeUntilBreak * 60000);
    
    return {
      required: 'at',
      time: breakTime,
      minutesRemaining: timeUntilBreak,
      reason: `Pause obligatoire après ${Math.floor(this.REGULATIONS.BREAK_AFTER_DRIVING/60)}h30 de conduite`
    };
  }

  // Vérifier les violations réglementaires
  checkViolations(driverId) {
    const driver = this.getDriverState(driverId);
    const violations = [];
    
    // Temps de conduite journalier
    if (driver.dailyDrivingTime > this.REGULATIONS.MAX_DAILY_DRIVING) {
      violations.push({
        type: 'daily_driving_exceeded',
        severity: 'critical',
        regulation: 'CE 561/2006 Art. 6(1)',
        current: driver.dailyDrivingTime,
        limit: this.REGULATIONS.MAX_DAILY_DRIVING,
        excess: driver.dailyDrivingTime - this.REGULATIONS.MAX_DAILY_DRIVING
      });
    }
    
    // Temps de conduite continu
    if (driver.continuousDrivingTime > this.REGULATIONS.MAX_CONTINUOUS_DRIVING) {
      violations.push({
        type: 'continuous_driving_exceeded',
        severity: 'critical',
        regulation: 'CE 561/2006 Art. 7',
        current: driver.continuousDrivingTime,
        limit: this.REGULATIONS.MAX_CONTINUOUS_DRIVING,
        excess: driver.continuousDrivingTime - this.REGULATIONS.MAX_CONTINUOUS_DRIVING
      });
    }
    
    // Temps de conduite hebdomadaire
    if (driver.weeklyDrivingTime > this.REGULATIONS.MAX_WEEKLY_DRIVING) {
      violations.push({
        type: 'weekly_driving_exceeded',
        severity: 'critical',
        regulation: 'CE 561/2006 Art. 6(2)',
        current: driver.weeklyDrivingTime,
        limit: this.REGULATIONS.MAX_WEEKLY_DRIVING,
        excess: driver.weeklyDrivingTime - this.REGULATIONS.MAX_WEEKLY_DRIVING
      });
    }
    
    driver.pendingViolations = violations;
    
    if (violations.length > 0) {
      console.warn(`⚠️ ${violations.length} violation(s) détectée(s) pour ${driverId}`);
      this.violations.set(driverId, violations);
    }
    
    return violations;
  }

  // Obtenir le statut complet d'un chauffeur
  getDriverStatus(driverId) {
    const driver = this.getDriverState(driverId);
    const canDrive = this.canDriverStartDriving(driverId);
    const maxDriving = this.calculateMaxDrivingTime(driverId);
    const nextBreak = this.calculateNextBreakTime(driverId);
    const violations = this.checkViolations(driverId);
    
    return {
      driverId,
      currentState: {
        isCurrentlyDriving: driver.isCurrentlyDriving,
        isOnBreak: driver.isOnBreak,
        isOnDailyRest: driver.isOnDailyRest,
        isOnWeeklyRest: driver.isOnWeeklyRest
      },
      drivingTimes: {
        daily: driver.dailyDrivingTime,
        weekly: driver.weeklyDrivingTime,
        continuous: driver.continuousDrivingTime,
        biweekly: driver.biweeklyDrivingTime
      },
      limits: {
        dailyLimit: this.REGULATIONS.MAX_DAILY_DRIVING,
        weeklyLimit: this.REGULATIONS.MAX_WEEKLY_DRIVING,
        continuousLimit: this.REGULATIONS.MAX_CONTINUOUS_DRIVING
      },
      permissions: canDrive,
      maxDrivingTime: maxDriving,
      nextBreakRequired: nextBreak,
      violations: violations,
      compensationOwed: driver.compensationOwed,
      counters: {
        extendedDrivingDaysThisWeek: driver.extendedDrivingDaysThisWeek,
        reducedRestDaysThisWeek: driver.reducedRestDaysThisWeek,
        daysWithoutWeeklyRest: driver.daysWithoutWeeklyRest
      },
      lastUpdate: driver.lastUpdate
    };
  }

  // Réinitialiser les compteurs hebdomadaires
  resetWeeklyCounters(driverId) {
    const driver = this.getDriverState(driverId);
    
    // Sauvegarder l'historique hebdomadaire
    driver.weeklyHistory.push({
      week: this.currentWeek,
      weeklyDrivingTime: driver.weeklyDrivingTime,
      extendedDrivingDays: driver.extendedDrivingDaysThisWeek,
      reducedRestDays: driver.reducedRestDaysThisWeek
    });
    
    // Réinitialiser
    driver.weeklyDrivingTime = 0;
    driver.extendedDrivingDaysThisWeek = 0;
    driver.reducedRestDaysThisWeek = 0;
    driver.weekStart = this.getWeekStartDate();
    
    console.log(`🔄 Compteurs hebdomadaires réinitialisés pour ${driverId}`);
  }

  // Export des données pour intégration
  exportDriverData(driverId) {
    const driver = this.getDriverState(driverId);
    const status = this.getDriverStatus(driverId);
    
    return {
      driverId,
      driverState: driver,
      currentStatus: status,
      regulations: this.REGULATIONS,
      exportedAt: new Date().toISOString()
    };
  }

  // Statistiques globales
  getGlobalStatistics() {
    const drivers = Array.from(this.driversState.entries());
    
    return {
      totalDrivers: drivers.length,
      currentlyDriving: drivers.filter(([id, driver]) => driver.isCurrentlyDriving).length,
      onBreak: drivers.filter(([id, driver]) => driver.isOnBreak).length,
      onDailyRest: drivers.filter(([id, driver]) => driver.isOnDailyRest).length,
      onWeeklyRest: drivers.filter(([id, driver]) => driver.isOnWeeklyRest).length,
      withViolations: drivers.filter(([id, driver]) => driver.pendingViolations.length > 0).length,
      averageDailyDriving: drivers.reduce((sum, [id, driver]) => sum + driver.dailyDrivingTime, 0) / drivers.length,
      averageWeeklyDriving: drivers.reduce((sum, [id, driver]) => sum + driver.weeklyDrivingTime, 0) / drivers.length
    };
  }
}

// Instance singleton
const regulatoryRestService = new RegulatoryRestService();

export default regulatoryRestService;
