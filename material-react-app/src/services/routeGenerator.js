// Générateur de routes avec trajectoires réalistes pour éviter les probl��mes d'API
class RouteGenerator {
  constructor() {
    // Système de notification des pauses actives
    this.activeBreakTimers = new Map();
    this.breakNotificationCallbacks = [];
    this.shownBreakNotifications = new Set(); // Éviter les doublons
    this.pausedTrucks = new Map(); // Camions en pause avec leur position sauvegardée

    // Routes prédéfinies pour la Tunisie (trajectoires réalistes)
   this.predefinedRoutes = {
  'TN-001': {
    // Ben Arous vers Manouba (trajet réel)
    startPoint: [36.770032, 10.23034], // Départ: Ben Arous
    endPoint: [36.8098, 10.1085],   // Arrivée: Manouba
    color: '#1e90ff',
    status: 'active',
    waypoints: [
      [36.770032, 10.23034],   // Départ: Ben Arous
      [36.769864, 10.230412],
      [36.76971, 10.230519],
      [36.769617, 10.230688],
      [36.7695, 10.230955],
      [36.76992, 10.231291],
      [36.769929, 10.231298],
      [36.770286, 10.231558],
      [36.77028, 10.231578],
      [36.77028, 10.231604],
      [36.77029, 10.231633],
      [36.770304, 10.231648],
      [36.770325, 10.231657],
      [36.770345, 10.231655],
      [36.770361, 10.231646],
      [36.770374, 10.23163],
      [36.770383, 10.231604],
      [36.770382, 10.231573],
      [36.770373, 10.231551],
      [36.770355, 10.231533],
      [36.770336, 10.231526],
      [36.770839, 10.22987],
      [36.770979, 10.229404],
      [36.771269, 10.228444],
      [36.77131, 10.228315],
      [36.771862, 10.226537],
      [36.77202, 10.225994],
      [36.772141, 10.22556],
      [36.772176, 10.225495],
      [36.77227, 10.225205],
      [36.7723, 10.225067],
      [36.772312, 10.224953],
      [36.772329, 10.224935],
      [36.772352, 10.224895],
      [36.772366, 10.224848],
      [36.772368, 10.224799],
      [36.772352, 10.224735],
      [36.772318, 10.224683],
      [36.772271, 10.224652],
      [36.772224, 10.224644],
      [36.772177, 10.224658],
      [36.772123, 10.224608],
      [36.772075, 10.224539],
      [36.772014, 10.224423],
      [36.77197, 10.224319],
      [36.771945, 10.22425],
      [36.771773, 10.2238],   // Point de pause 1 (45min)
      [36.771742, 10.223719],
      [36.77148, 10.223044],
      [36.771433, 10.222943],
      [36.771388, 10.222861],
      [36.771337, 10.222816],
      [36.77129, 10.222681],
      [36.771171, 10.222352],
      [36.771073, 10.222106],
      [36.77098, 10.221936],
      [36.770889, 10.221799],
      [36.77074, 10.221637],
      [36.770595, 10.221506],
      [36.770243, 10.221274],
      [36.769939, 10.22106],
      [36.769597, 10.220829],
      [36.769459, 10.220734],
      [36.769435, 10.22068],
      [36.769431, 10.220675],
      [36.769424, 10.220665],
      [36.769148, 10.220462],
      [36.768641, 10.22011],
      [36.768229, 10.219836],
      [36.768018, 10.219691],
      [36.768004, 10.219683],
      [36.767918, 10.219624],
      [36.767656, 10.219452],
      [36.767469, 10.219323],
      [36.767331, 10.219264],
      [36.767255, 10.219231],
      [36.767173, 10.2192],
      [36.767165, 10.219178],
      [36.767187, 10.219017],
      [36.767235, 10.218864],
      [36.767268, 10.218764],
      [36.767359, 10.218531],
      [36.767443, 10.218327],
      [36.767745, 10.217629],   // Point de pause 2 (45min)
      [36.768036, 10.216922],
      [36.768317, 10.216267],
      [36.768606, 10.21562],
      [36.768622, 10.215579],
      [36.768639, 10.215534],
      [36.768738, 10.215307],
      [36.769047, 10.21461],
      [36.769231, 10.214169],
      [36.770297, 10.211615],
      [36.770656, 10.210761],
      [36.771088, 10.20973],
      [36.77128, 10.209263],
      [36.771665, 10.208327],
      [36.771697, 10.208246],
      [36.771742, 10.208134],
      [36.771917, 10.207724],
      [36.772022, 10.207482],
      [36.772844, 10.205514],
      [36.772869, 10.205454],
      [36.772899, 10.205394],
      [36.772924, 10.205349],
      [36.77294, 10.205326],
      [36.772957, 10.205306],
      [36.772972, 10.20526],
      [36.772986, 10.205244],
      [36.772995, 10.205223],
      [36.772999, 10.2052],
      [36.772999, 10.205176],
      [36.773034, 10.205005],
      [36.77338, 10.20411],
      [36.773987, 10.20271],
      [36.774176, 10.202245],
      [36.774253, 10.202139],
      [36.774281, 10.202117],
      [36.774301, 10.202084],
      [36.774312, 10.202045],
      [36.77438, 10.201926],
      [36.774552, 10.201731],
      [36.774693, 10.20159],
      [36.774841, 10.201462],
      [36.775045, 10.201266],   // Point de pause 3 (45min)
      [36.775381, 10.200956],
      [36.775704, 10.200666],
      [36.776212, 10.200201],
      [36.776404, 10.20002],
      [36.777087, 10.199384],
      [36.77734, 10.199155],
      [36.777598, 10.198909],
      [36.778099, 10.198437],
      [36.779083, 10.197536],
      [36.779288, 10.197323],
      [36.779631, 10.196937],
      [36.779879, 10.196658],
      [36.780321, 10.1962],
      [36.780545, 10.195952],
      [36.780974, 10.195479],
      [36.78152, 10.194889],
      [36.781529, 10.194879],
      [36.781801, 10.194548],
      [36.782008, 10.194265],
      [36.782435, 10.193704],
      [36.783006, 10.192939],
      [36.783124, 10.192783],
      [36.783234, 10.192638],
      [36.78364, 10.19208],
      [36.783862, 10.191774],
      [36.78403, 10.191549],
      [36.784227, 10.191317],
      [36.784436, 10.191122],
      [36.784491, 10.191064],
      [36.784649, 10.190954],
      [36.784912, 10.190801],
      [36.7998, 10.1234],  // Approche Manouba
      [36.8056, 10.1156],  // Manouba Nord
      [36.8098, 10.1085]   // Manouba Centre (arrivée)
    ],
    breakPoints: [46, 76, 116] // Index des points de pause (45min)
  },
  'TN-002': {
    // Tunis vers Sousse (Autoroute A1 via Ben Arous)
    startPoint: [36.8065, 10.1815], // Tunis
    endPoint: [35.8256, 10.6369],   // Sousse
    color: '#22c55e',
    status: 'active',
    waypoints: [
      [36.8065, 10.1815], // Tunis centre départ
      [36.7923, 10.1934], // Direction sud via Ben Arous
      [36.7756, 10.2089], // Ben Arous zone
      [36.7634, 10.2234], // Autoroute A1 entrée
      [36.7456, 10.2456], // Pont Radès A1
      [36.7234, 10.2678], // Fouchana
      [36.7012, 10.2901], // Mornag
      [36.6789, 10.3123], // Bir el Kassaa
      [36.6567, 10.3345], // Enfidha - Point pause 1
      [36.6345, 10.3567], // Takrouna
      [36.6123, 10.3789], // Hergla
      [36.5901, 10.4012], // Chott Meriem
      [36.5678, 10.4234], // Sousse Nord approche
      [36.5456, 10.4456], // Kalaa Kebira
      [36.5234, 10.4678], // M'saken
      [36.5012, 10.4901], // Ksibet Thrayet - Point pause 2
      [36.4789, 10.5123], // Akouda
      [36.4567, 10.5345], // Hammam Sousse
      [36.4345, 10.5567], // Port Kantaoui
      [36.1234, 10.5789], // Sousse Medina approche
      [35.8256, 10.6369]  // Sousse centre arrivée
    ],
    breakPoints: [8, 15] // Points de pause
  },
  'TN-003': {
    // Ariana vers Kairouan (Route GP4 intérieure)
    startPoint: [36.4098, 10.1398], // Ariana
    endPoint: [35.6786, 10.0963],   // Kairouan
    color: '#1e90ff',
    status: 'active',
    waypoints: [
      [36.4098, 10.1398], // Ariana centre départ
      [36.4034, 10.1289], // Sortie ouest Ariana
      [36.3967, 10.1167], // Route vers Mornaguia
      [36.3889, 10.1034], // Mornaguia entrée
      [36.3823, 10.0923], // Mornaguia centre
      [36.3756, 10.0812], // Oued Ellil
      [36.3678, 10.0689], // Tebourba direction
      [36.3612, 10.0578], // Jedeida
      [36.3534, 10.0445], // Medjez el-Bab - Point pause 1
      [36.3467, 10.0334], // Route GP4 continuer
      [36.3389, 10.0201], // Testour approche
      [36.3323, 10.0090], // Testour centre
      [36.3245, 9.9957], // Goubellat
      [36.3178, 9.9846], // Bou Arada direction
      [36.3100, 9.9713], // Bou Arada centre
      [36.3034, 9.9602], // Route vers Siliana
      [36.2956, 9.9469], // Siliana approche - Point pause 2
      [36.2889, 9.9358], // Siliana centre
      [36.2812, 9.9225], // Makthar direction
      [36.2745, 9.9114], // Makthar centre
      [36.2667, 9.8981], // Sbikha direction
      [36.2600, 9.8870], // Sbikha centre
      [36.2523, 9.8737], // Kairouan approche
      [36.2456, 9.8626], // Kairouan Nord
      [35.6786, 10.0963]  // Kairouan centre arrivée
    ],
    breakPoints: [8, 16] // Points de pause
  },
  'TN-004': {
    // La Goulette vers Nabeul (Route côtière touristique)
    startPoint: [36.7538, 10.2286], // La Goulette
    endPoint: [36.4561, 10.7376],   // Nabeul
    color: '#1e90ff',
    status: 'active',
    waypoints: [
      [36.7538, 10.2286], // La Goulette départ
      [36.7556, 10.2323], // Port direction
      [36.7578, 10.2367], // Khereddine
      [36.7598, 10.2423], // Carthage entrée
      [36.7623, 10.2478], // Carthage musée
      [36.7645, 10.2534], // Sidi Bou Said
      [36.7667, 10.2589], // Villa Blanche
      [36.7689, 10.2645], // La Marsa
      [36.7712, 10.2701], // Gammarth - Point pause 1
      [36.7734, 10.2756], // Route côtière
      [36.7756, 10.2812], // Raoued
      [36.7778, 10.2867], // Zone touristique
      [36.7801, 10.2923], // Kalâat el-Andalous
      [36.7823, 10.2978], // Soliman
      [36.7845, 10.3034], // Menzel Bouzelfa
      [36.7867, 10.3089], // Bou Argoub
      [36.7889, 10.3145], // Hammamet Nord - Point pause 2
      [36.7912, 10.3201],
      [36.7934, 10.3256], // Hammamet centre
      [36.7956, 10.3312], // Yasmine Hammamet
      [36.7978, 10.3367], // Nabeul direction
      [36.8001, 10.3423], // Nabeul Nord
      [36.8023, 10.3478], // Centre artisanal
      [36.8045, 10.3534], // Béni Khiar
      [36.4561, 10.7376]  // Nabeul centre
    ],
    breakPoints: [8, 16] // Points de pause
  },
  'TN-005': {
    // Sfax vers Gabès (Route GP1 du Sud)
    startPoint: [34.7406, 10.7603], // Sfax
    endPoint: [33.8869, 10.0982],   // Gabès
    color: '#f59e0b',
    status: 'maintenance',
    waypoints: [
      [34.7406, 10.7603], // Sfax centre départ
      [34.7334, 10.7456], // Sortie Sfax Sud
      [34.7267, 10.7323], // Route GP1
      [34.7189, 10.7178], // Sakiet Ezzit
      [34.7123, 10.7045], // El Amra
      [34.7056, 10.6912], // Mahres direction
      [34.6989, 10.6778], // Mahres centre
      [34.6923, 10.6645], // Skhira approche
      [34.6856, 10.6512], // Skhira - Point pause 1
      [34.6789, 10.6378],
      [34.6723, 10.6245], // Ghraiba
      [34.6656, 10.6112],
      [34.6589, 10.5978], // El Hencha
      [34.6523, 10.5845],
      [34.6456, 10.5712], // Bouchemma
      [34.6389, 10.5578],
      [34.6323, 10.5445], // Gafsa junction
      [34.6256, 10.5312], // Métarech - Point pause 2
      [34.6189, 10.5178],
      [34.6123, 10.5045], // Gabès Nord
      [34.6056, 10.4912],
      [34.5989, 10.4778], // Chenini Nahal
      [34.5923, 10.4645],
      [34.5856, 10.4512], // Oudhref
      [34.5789, 10.4378],
      [34.5723, 10.4245], // Métouia
      [34.5656, 10.4112],
      [33.8869, 10.0982]  // Gabès centre
    ],
    breakPoints: [8, 17] // Points de pause
  }
};
  }

  // Générer route avec animation progressive
  generateRouteWithProgress(truckId, progress = 0) {
    const routeData = this.predefinedRoutes[truckId];
    if (!routeData) {
      console.warn(`⚠️ Route non trouvée pour ${truckId}`);
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
      color: routeData.color,
      status: routeData.status,
      progress: progress
    };
  }

  // Générer toutes les routes avec couleurs appropriées
  generateAllRoutes(trucks) {
    const routes = {};
    
    trucks.forEach(truck => {
      const routeInfo = this.generateRouteWithProgress(
        truck.truck_id, 
        truck.route_progress || 0
      );
      
      if (routeInfo) {
        // Déterminer couleur selon état
        let routeColor = routeInfo.color;
        if (truck.state === 'En Route') {
          routeColor = '#1e90ff'; // Bleu pour actifs
        } else if (truck.state === 'At Destination') {
          routeColor = '#22c55e'; // Vert pour terminés
        } else if (truck.state === 'Maintenance') {
          routeColor = '#f59e0b'; // Orange pour maintenance
        } else if (truck.state === 'Delayed') {
          routeColor = '#ef4444'; // Rouge pour retardés
        } else {
          routeColor = '#9ca3af'; // Gris pour autres états
        }
        routes[truck.truck_id] = {
          ...routeInfo,
          color: routeColor,
          truck: truck
        };
      }
    });
    
    return routes;
  }

  // Créer ligne de route avec style selon état
  createRoutePolyline(routeInfo, isSelected = false) {
    if (!routeInfo || !routeInfo.fullRoute) return null;

    const baseWeight = isSelected ? 6 : 4;
    const opacity = routeInfo.status === 'completed' ? 0.7 : 0.9;
    
    // Style selon état
    const lineStyle = {
      color: routeInfo.color,
      weight: baseWeight,
      opacity: opacity,
      lineCap: 'round',
      lineJoin: 'round'
    };
    
    // Ligne discontinue pour trajets terminés
    if (routeInfo.status === 'completed') {
      lineStyle.dashArray = '12, 8';
    }
    
    // Style statique pour tous les trajets (plus d'animation)
    if (routeInfo.status === 'active' && isSelected) {
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
    
    // Points d'étapes intermédiaires (tous les 2-3 points)
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
    const routeInfo = this.generateRouteWithProgress(truckId, progress);
    return routeInfo ? routeInfo.currentPosition : null;
  }

  // Calculer direction du camion (pour orientation de l'icône)
  calculateBearing(truckId, progress) {
    const routeInfo = this.generateRouteWithProgress(truckId, progress);
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

  // Système de points de pause de 45min
  checkBreakPoint(truckId, progress) {
    const routeData = this.predefinedRoutes[truckId];
    if (!routeData || !routeData.breakPoints) return null;

    const waypoints = routeData.waypoints;
    const totalPoints = waypoints.length;
    const currentIndex = Math.floor((progress / 100) * (totalPoints - 1));

    // Vérifier si le camion approche d'un point de pause
    const nearBreakPoint = routeData.breakPoints.find(breakIndex => {
      const distance = Math.abs(currentIndex - breakIndex);
      return distance <= 2; // Dans un rayon de 2 points
    });

    if (nearBreakPoint) {
      const breakPosition = waypoints[nearBreakPoint];
      const breakNumber = routeData.breakPoints.indexOf(nearBreakPoint) + 1;

      return {
        required: true,
        position: breakPosition,
        breakNumber: breakNumber,
        message: `Pause requise: 45min avant de continuer (Point ${breakNumber})`,
        duration: 45, // minutes
        type: 'mandatory_break'
      };
    }

    return null;
  }

  // Générer notification de pause (max 2 fois par point)
  generateBreakNotification(truckId, progress) {
    const breakInfo = this.checkBreakPoint(truckId, progress);
    if (!breakInfo) return null;

    const notificationKey = `${truckId}-break-${breakInfo.breakNumber}`;

    // Vérifier si cette notification a déjà été montrée plus de 2 fois
    const showCount = this.shownBreakNotifications.has(notificationKey) ?
      parseInt(notificationKey.split('-')[3] || '0') : 0;

    if (showCount >= 2) return null; // Maximum 2 affichages

    // Marquer comme affiché
    this.shownBreakNotifications.add(`${notificationKey}-${showCount + 1}`);

    return {
      id: `break-${truckId}-${breakInfo.breakNumber}-${Date.now()}`,
      type: 'break_notification',
      title: '🚦 Pause Obligatoire',
      message: breakInfo.message,
      truckId: truckId,
      position: breakInfo.position,
      duration: breakInfo.duration,
      severity: 'warning',
      icon: '⏳',
      timestamp: new Date().toISOString(),
      autoClose: false,
      showCount: showCount + 1
    };
  }

  // Obtenir les marqueurs de pause pour la carte
  getBreakPointMarkers(truckId) {
    const routeData = this.predefinedRoutes[truckId];
    if (!routeData || !routeData.breakPoints) return [];

    return routeData.breakPoints.map((breakIndex, idx) => {
      const position = routeData.waypoints[breakIndex];
      return {
        position: position,
        type: 'break_point',
        icon: '��',
        popup: `<div style="text-align: center; font-family: sans-serif;">
          <strong>🚦 Point de Pause ${idx + 1}</strong><br>
          <span style="font-size: 12px; color: #f59e0b;">Durée: 45 minutes</span><br>
          <span style="font-size: 10px; color: #6b7280;">Obligatoire pour sécurité</span>
        </div>`
      };
    });
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

  // Vérifier si un camion est en pause
  isTruckPaused(truckId) {
    return this.pausedTrucks.has(truckId);
  }

  // Obtenir les données de pause d'un camion
  getTruckPauseData(truckId) {
    return this.pausedTrucks.get(truckId);
  }
}

const routeGenerator = new RouteGenerator();
export default routeGenerator;
