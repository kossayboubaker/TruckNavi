// Service d'alertes étendu avec tous les types demandés
class ExtendedAlertsService {
  constructor() {
    this.alertTypes = {
      // Alertes de trafic et accidents
      'danger': { icon: '🚨', severity: 'danger', color: '#dc2626' },
      'accident': { icon: '⚠️', severity: 'danger', color: '#dc2626' },
      'accidentMinor': { icon: '🚗', severity: 'warning', color: '#f59e0b' },
      'accidentMajor': { icon: '🚨', severity: 'danger', color: '#dc2626' },
      'construction': { icon: '🚧', severity: 'warning', color: '#f59e0b' },
      'malinfrastructure': { icon: '🏗️', severity: 'warning', color: '#f59e0b' },
      'traffic': { icon: '🚦', severity: 'info', color: '#3b82f6' },
      'police': { icon: '👮', severity: 'info', color: '#8b5cf6' },
      'maintenance': { icon: '🔧', severity: 'warning', color: '#f59e0b' },
      'info': { icon: 'ℹ️', severity: 'info', color: '#6b7280' },
      'warning': { icon: '⚠️', severity: 'warning', color: '#f59e0b' },

      // Alertes météorologiques
      'weatherRain': { icon: '🌧️', severity: 'warning', color: '#3b82f6' },
      'weatherThunderstorm': { icon: '⛈️', severity: 'danger', color: '#7c3aed' },
      'weatherMist': { icon: '🌫️', severity: 'warning', color: '#9ca3af' },
      'weatherClear': { icon: '☀️', severity: 'info', color: '#f59e0b' },
      'weatherClouds': { icon: '☁️', severity: 'info', color: '#6b7280' },
      'weatherSnow': { icon: '❄️', severity: 'warning', color: '#06b6d4' },
      'weatherWind': { icon: '🌬️', severity: 'warning', color: '#10b981' },
      'weatherFog': { icon: '🌫️', severity: 'warning', color: '#9ca3af' },
      'weatherHail': { icon: '🧊', severity: 'danger', color: '#06b6d4' },
      'weatherCold': { icon: '🥶', severity: 'warning', color: '#06b6d4' },
      'weatherStorm': { icon: '🌪️', severity: 'danger', color: '#7c3aed' },
      'weatherFlood': { icon: '🌊', severity: 'danger', color: '#3b82f6' },
      'weatherDrought': { icon: '🏜️', severity: 'warning', color: '#f59e0b' },
      'weatherSnowstorm': { icon: '❄️', severity: 'danger', color: '#06b6d4' },
      'weatherBlizzard': { icon: '🌨️', severity: 'danger', color: '#06b6d4' },
      'weatherTornado': { icon: '🌪️', severity: 'danger', color: '#7c3aed' },
      'weatherHurricane': { icon: '🌀', severity: 'danger', color: '#7c3aed' },
      'weatherTyphoon': { icon: '🌀', severity: 'danger', color: '#7c3aed' },
      'weatherVolcanic': { icon: '🌋', severity: 'danger', color: '#ef4444' },
      'weatherLandslide': { icon: '⛰️', severity: 'danger', color: '#92400e' },
      'weatherAvalanche': { icon: '��️', severity: 'danger', color: '#06b6d4' },
      'weatherWildfire': { icon: '🔥', severity: 'danger', color: '#ef4444' },
      'weatherExtremeHeat': { icon: '🔥', severity: 'danger', color: '#ef4444' },
      'weatherExtremeCold': { icon: '🥶', severity: 'danger', color: '#06b6d4' },
      'weatherTsunami': { icon: '🌊', severity: 'danger', color: '#3b82f6' },
      'weatherEarthquake': { icon: '🌍', severity: 'danger', color: '#92400e' },
      'weatherLunar': { icon: '🌙', severity: 'info', color: '#6b7280' }
    };

    this.tunisianLocations = [
      'Tunis Centre', 'Ariana', 'Ben Arous', 'Manouba', 'Sfax', 'Sousse', 
      'Kairouan', 'Bizerte', 'Gabès', 'Médenine', 'Monastir', 'Nabeul',
      'Kasserine', 'Sidi Bouzid', 'Gafsa', 'Tozeur', 'Kebili', 'Tataouine',
      'Zaghouan', 'Siliana', 'Le Kef', 'Jendouba', 'Béja', 'Mahdia'
    ];
  }

  // Générer une alerte aléatoire le long des routes
  generateRandomAlert() {
    const types = Object.keys(this.alertTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const alertConfig = this.alertTypes[randomType];
    const location = this.tunisianLocations[Math.floor(Math.random() * this.tunisianLocations.length)];

    // Positions le long des routes principales tunisiennes (éviter la mer)
    const roadPositions = [
      // Route A1 Tunis-Sousse
      [36.8065, 10.1815], [36.8354, 10.2045], [36.8666, 10.2269], [35.8256, 10.6369],
      // Route GP1 côte est
      [36.4561, 10.7376], [35.8256, 10.6369], [34.7406, 10.7603],
      // Routes intérieures
      [36.4098, 10.1398], [35.6786, 10.0963], [34.7406, 10.7603], [33.8869, 10.0982],
      // Autres routes principales
      [36.8065, 10.1815], [36.4098, 10.1398], [35.2033, 9.9066], [34.4444, 8.7778]
    ];

    // Choisir une position aléatoire le long des routes + petite variation
    const basePosition = roadPositions[Math.floor(Math.random() * roadPositions.length)];
    const lat = basePosition[0] + (Math.random() - 0.5) * 0.02; // ±1.1km variation
    const lng = basePosition[1] + (Math.random() - 0.5) * 0.02; // ±1.1km variation

    const messages = this.getAlertMessages(randomType);
    const message = messages[Math.floor(Math.random() * messages.length)];

    const affectedTrucks = this.getRandomTrucks();

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: randomType,
      title: this.getAlertTitle(randomType),
      description: message,
      severity: alertConfig.severity,
      position: [lat, lng],
      location: location,
      icon: alertConfig.icon,
      color: alertConfig.color,
      affectedRoutes: affectedTrucks,
      timestamp: new Date().toISOString(),
      delay: Math.floor(Math.random() * 60) + 5, // 5-65 minutes
      realEvent: Math.random() > 0.7 // 30% chance d'être un événement temps réel
    };
  }

  getAlertTitle(type) {
    const titles = {
      'danger': 'Zone Dangereuse',
      'accident': 'Accident de la route',
      'accidentMinor': 'Accident mineur',
      'accidentMajor': 'Accident grave',
      'construction': 'Travaux en cours',
      'malinfrastructure': 'Infrastructure endommagée',
      'traffic': 'Embouteillage',
      'police': 'Contrôle police',
      'maintenance': 'Maintenance requise',
      'info': 'Information',
      'warning': 'Attention',
      'weatherRain': 'Pluie',
      'weatherThunderstorm': 'Orage',
      'weatherMist': 'Brouillard léger',
      'weatherClear': 'Temps clair',
      'weatherClouds': 'Nuageux',
      'weatherSnow': 'Neige',
      'weatherWind': 'Vent fort',
      'weatherFog': 'Brouillard dense',
      'weatherHail': 'Grêle',
      'weatherCold': 'Froid extrême',
      'weatherStorm': 'Tempête',
      'weatherFlood': 'Inondation',
      'weatherDrought': 'Sécheresse',
      'weatherSnowstorm': 'Tempête de neige',
      'weatherBlizzard': 'Blizzard',
      'weatherTornado': 'Tornade',
      'weatherHurricane': 'Ouragan',
      'weatherTyphoon': 'Typhon',
      'weatherVolcanic': 'Activité volcanique',
      'weatherLandslide': 'Glissement de terrain',
      'weatherAvalanche': 'Avalanche',
      'weatherWildfire': 'Feu de forêt',
      'weatherExtremeHeat': 'Canicule',
      'weatherExtremeCold': 'Froid polaire',
      'weatherTsunami': 'Tsunami',
      'weatherEarthquake': 'Séisme',
      'weatherLunar': 'Éclipse lunaire'
    };
    return titles[type] || 'Alerte';
  }

  getAlertMessages(type) {
    const messages = {
      'danger': [
        'Zone dangereuse détectée, ralentir immédiatement',
        'Risque élevé signalé, prudence recommandée'
      ],
      'accident': [
        'Accident sur la chaussée, circulation perturbée',
        'Véhicules accidentés bloquent la voie'
      ],
      'accidentMinor': [
        'Accrochage mineur, ralentissements possibles',
        'Léger accident, circulation ralentie'
      ],
      'accidentMajor': [
        'Accident grave, voie fermée',
        'Collision majeure, détournement obligatoire'
      ],
      'construction': [
        'Travaux de voirie en cours',
        'Zone de construction, circulation alternée'
      ],
      'malinfrastructure': [
        'Chaussée dégradée, rouler prudemment',
        'Infrastructure endommagée, vitesse réduite'
      ],
      'traffic': [
        'Embouteillage important, retards prévus',
        'Circulation dense, temps de parcours allongé'
      ],
      'police': [
        'Contrôle routier en cours',
        'Forces de l\'ordre présentes'
      ],
      'maintenance': [
        'Maintenance véhicule requise',
        'Vérification technique nécessaire'
      ],
      'weatherRain': [
        'Pluie modérée, chaussée glissante',
        'Précipitations, visibilité réduite'
      ],
      'weatherThunderstorm': [
        'Orage violent, danger électrique',
        'Tempête orageuse, s\'abriter'
      ],
      'weatherSnow': [
        'Chutes de neige, équiper des chaînes',
        'Neige au sol, conduite hivernale'
      ],
      'weatherFog': [
        'Brouillard dense, visibilité nulle',
        'Nappe de brouillard, allumer feux'
      ],
      'weatherWind': [
        'Vents forts, attention aux véhicules légers',
        'Rafales importantes, tenir le volant'
      ]
    };
    return messages[type] || ['Alerte générique'];
  }

  getRandomTrucks() {
    const trucks = ['TN-001', 'TN-002', 'TN-003', 'TN-004', 'TN-005'];
    const count = Math.floor(Math.random() * 2) + 1; // 1-2 camions affectés pour éviter surcharge
    const selected = [];

    // S'assurer que tous les camions peuvent être sélectionnés équitablement
    const shuffled = trucks.sort(() => 0.5 - Math.random());

    for (let i = 0; i < count && i < shuffled.length; i++) {
      selected.push(shuffled[i]);
    }

    return selected;
  }

  // Générer plusieurs alertes d'un coup avec distribution équitable
  generateAlertBatch(count = 8) {
    const alerts = [];
    const trucks = ['TN-001', 'TN-002', 'TN-003', 'TN-004', 'TN-005'];

    for (let i = 0; i < count; i++) {
      const alert = this.generateRandomAlert();
      // Assigner spécifiquement des camions pour assurer distribution
      const assignedTruck = trucks[i % trucks.length];
      alert.affectedRoutes = [assignedTruck];
      alerts.push(alert);
    }
    return alerts;
  }

  // Filtrer les alertes par type
  filterAlertsByType(alerts, types) {
    return alerts.filter(alert => types.includes(alert.type));
  }

  // Obtenir alertes par sévérité
  getAlertsBySeverity(alerts, severity) {
    return alerts.filter(alert => alert.severity === severity);
  }

  // Simuler alertes temps réel
  startRealTimeAlertSimulation(callback, interval = 30000) {
    return setInterval(() => {
      if (Math.random() > 0.6) { // 40% chance de nouvelle alerte
        const alert = this.generateRandomAlert();
        alert.realEvent = true;
        callback(alert);
      }
    }, interval);
  }
}

const extendedAlertsService = new ExtendedAlertsService();
export default extendedAlertsService;
