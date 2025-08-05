import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import routeGenerator from '../../services/routeGenerator';
import roleManager from '../../services/roleManager';

const WEATHER_API_KEY = '4437791bbdc183036e4e04dc15c92cb8';

const MapCanvas = ({
  deliveries = [],
  selectedDelivery,
  onSelectDelivery,
  alerts = [],
  allAlerts = [], // Toutes les alertes (statiques + générées)
  mapStyle = 'standard',
  onMapReady,
  showAlerts = false,
  showRoutes = true,
  showWeather = false,
  followTruck = false,
  deletedAlerts = [],
  onAlertClick
}) => {
  const [map, setMap] = useState(null);
  const [trucksData, setTrucksData] = useState(deliveries);
  const [weatherLayer, setWeatherLayer] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);

  const configureLeafletIcons = () => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  };



  // Système de cache pour éviter les appels API redondants
  const routeCache = useRef(new Map());
  const lastApiCall = useRef(0);
  const API_COOLDOWN = 5000; // 5 secondes entre les appels

  // Récupérer vraie route avec système de cache et gestion d'erreurs améliorée
  const getTomTomRoute = async (startCoord, endCoord) => {
    const cacheKey = `${startCoord[0]},${startCoord[1]}-${endCoord[0]},${endCoord[1]}`;

    // Vérifier le cache d'abord
    if (routeCache.current.has(cacheKey)) {
      console.log('📦 Route récupérée depuis le cache');
      return routeCache.current.get(cacheKey);
    }

    // Respecter le cooldown API
    const now = Date.now();
    if (now - lastApiCall.current < API_COOLDOWN) {
      console.log('⏱️ Cooldown API actif, utilisation du fallback');
      return getRealRoute(startCoord, endCoord);
    }

    const TOMTOM_API_KEY = 'EYzVkdZCbYKTsmoxBiz17rpTQnN3qxz0';
    const startLatLng = `${startCoord[0]},${startCoord[1]}`;
    const endLatLng = `${endCoord[0]},${endCoord[1]}`;

    try {
      lastApiCall.current = now;

      const response = await Promise.race([
        fetch(`https://api.tomtom.com/routing/1/calculateRoute/${startLatLng}:${endLatLng}/json?key=${TOMTOM_API_KEY}&travelMode=truck&traffic=true&routeType=fastest&avoid=unpavedRoads&vehicleMaxSpeed=90&vehicleWeight=15000`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
      ]);

      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes[0] && data.routes[0].legs) {
          const route = [];
          data.routes[0].legs.forEach(leg => {
            if (leg.points) {
              leg.points.forEach(point => {
                route.push([point.latitude, point.longitude]);
              });
            }
          });

          // Valider que la route est terrestre
          const isValidRoute = route.every(point =>
            point[0] >= 30.5 && point[0] <= 37.5 &&
            point[1] >= 8.0 && point[1] <= 11.8
          );

          if (isValidRoute && route.length > 0) {
            console.log(`✅ TomTom route réelle récupérée: ${route.length} points`);
            // Mettre en cache pour 30 minutes
            routeCache.current.set(cacheKey, route);
            setTimeout(() => routeCache.current.delete(cacheKey), 1800000);
            return route;
          }
        }
      } else if (response.status === 429) {
        console.warn('🚫 TomTom API rate limit atteint - utilisation cache/fallback');
        // Augmenter le cooldown en cas de rate limit
        lastApiCall.current = now + API_COOLDOWN * 3;
      } else {
        console.warn(`⚠️ TomTom API erreur ${response.status}`);
      }
    } catch (error) {
      console.warn('🔄 TomTom API indisponible, fallback activé:', error.message);
    }

    // Fallback vers route intelligente terrestre
    const fallbackRoute = getRealRoute(startCoord, endCoord);
    // Mettre le fallback en cache aussi
    routeCache.current.set(cacheKey, fallbackRoute);
    setTimeout(() => routeCache.current.delete(cacheKey), 900000); // 15 min pour fallback
    return fallbackRoute;
  };

  const getRealRoute = (startCoord, endCoord, waypoints = []) => {
    // Trajectoires TERRESTRES uniquement - pas de mer
    const route = [startCoord];

    // Fonction pour vérifier si un point est sur terre (Tunisie)
    const isOnLand = (lat, lng) => {
      // Limites approximatives de la Tunisie continentale
      return lat >= 30.5 && lat <= 37.5 && lng >= 8.0 && lng <= 11.8 &&
             !(lat > 36.5 && lng < 9.5) && // Éviter mer au nord-ouest
             !(lat > 35.5 && lng > 11.2) && // Éviter mer à l'est
             !(lat < 33.0 && lng < 9.0); // Éviter mer au sud-ouest
    };

    // Points de passage forcés sur terre
    const safeWaypoints = waypoints.map(wp => {
      let lat = wp.lat || wp[0];
      let lng = wp.lng || wp[1];

      // Forcer sur terre si dans la mer
      if (!isOnLand(lat, lng)) {
        // Ramener vers l'intérieur des terres
        lat = Math.max(30.8, Math.min(37.2, lat));
        lng = Math.max(8.2, Math.min(11.5, lng));
      }
      return [lat, lng];
    });

    safeWaypoints.forEach(wp => route.push(wp));

    const interpolatedRoute = [];
    for (let i = 0; i < route.length - 1; i++) {
      const currentPoint = route[i];
      const nextPoint = route[i + 1];

      interpolatedRoute.push(currentPoint);

      const steps = 15; // Moins de points pour éviter la mer

      for (let step = 1; step < steps; step++) {
        const ratio = step / steps;
        let lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * ratio;
        let lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * ratio;

        // Très légère courbure vers l'intérieur
        const inlandCurvature = 0.003 * Math.sin(ratio * Math.PI);
        lat += inlandCurvature; // Toujours vers l'intérieur

        // Vérification stricte - si point dans mer, le ramener sur terre
        if (!isOnLand(lat, lng)) {
          lat = Math.max(30.8, Math.min(37.2, lat));
          lng = Math.max(8.2, Math.min(11.5, lng));
        }

        interpolatedRoute.push([lat, lng]);
      }
    }

    interpolatedRoute.push(endCoord);
    return interpolatedRoute;
  };

  const generateRealRoutes = useCallback(async () => {
    const routesMap = {};

    // Limiter le nombre d'appels simultanés pour éviter le rate limiting
    const MAX_CONCURRENT_CALLS = 2;
    const routePromises = [];

    for (let i = 0; i < trucksData.length; i += MAX_CONCURRENT_CALLS) {
      const batch = trucksData.slice(i, i + MAX_CONCURRENT_CALLS);
      const batchPromises = batch.map(async (truck) => {
      let startCoord, endCoord, waypoints = [];

      switch (truck.truck_id) {
        case 'TN-001': // Tunis vers Sfax
          startCoord = [36.770032, 10.23034];
          endCoord = [36.785403, 10.190556];
          break;
        case 'TN-002': // Tunis vers Sousse
          startCoord = [36.8065, 10.1815];
          endCoord = [35.8256, 10.6369];
          break;
        case 'TN-003': // Ariana vers Kairouan
          startCoord = [36.4098, 10.1398];
          endCoord = [35.6786, 10.0963];
          break;
        case 'TN-004': // La Goulette vers Nabeul
          startCoord = [36.7538, 10.2286];
          endCoord = [36.4561, 10.7376];
          break;
        case 'TN-005': // Sfax vers Gabes
          startCoord = [34.7406, 10.7603];
          endCoord = [33.8869, 10.0982];
          break;
        default:
          startCoord = truck.pickup?.coordinates || truck.position;
          endCoord = truck.destinationCoords || truck.destination?.coordinates || truck.position;
      }

        // Priorité au générateur de routes intégré pour éviter les appels API excessifs
        const routeInfo = routeGenerator.generateRouteWithProgress(truck.truck_id, 0);
        if (routeInfo && routeInfo.fullRoute) {
          console.log(`🎯 Route pré-générée utilisée pour ${truck.truck_id}`);
          return { truckId: truck.truck_id, route: routeInfo.fullRoute };
        }

        // Essayer TomTom API seulement si pas de route pré-générée
        try {
          const tomtomRoute = await getTomTomRoute(startCoord, endCoord);
          return { truckId: truck.truck_id, route: tomtomRoute };
        } catch (error) {
          console.warn(`🔄 Fallback route pour ${truck.truck_id}:`, error.message);

          // Fallback avec waypoints prédéfinis
          const fallbackWaypoints = {
            'TN-001': [[36.7500, 10.1200], [36.3000, 10.0000], [35.9000, 9.9500], [35.5000, 10.2000]],
            'TN-002': [[36.7000, 10.0800], [36.5000, 10.0000], [36.2000, 10.1000]],
            'TN-003': [[36.3500, 10.0800], [36.2000, 10.0500], [36.0000, 10.0000]],
            'TN-004': [[36.7000, 10.1500], [36.6000, 10.2000], [36.5500, 10.4000]],
            'TN-005': [[34.6500, 10.5000], [34.4000, 10.3000], [34.2000, 10.2000]]
          };

          waypoints = fallbackWaypoints[truck.truck_id] || [];
          const fallbackRoute = getRealRoute(startCoord, endCoord, waypoints);
          return { truckId: truck.truck_id, route: fallbackRoute };
        }
      });

      // Traitement par batch avec délai
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        routesMap[result.truckId] = result.route;
      });

      // Délai entre les batches pour respecter les limites API
      if (i + MAX_CONCURRENT_CALLS < trucksData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Le traitement est déjà fait dans la boucle ci-dessus
    console.log(`📍 ${Object.keys(routesMap).length} routes générées avec système de cache`);

    return routesMap;
  }, [trucksData]);

  const createTruckIcon = useCallback((truck) => {
    const isSelected = selectedDelivery && selectedDelivery.truck_id === truck.truck_id;
    const speed = truck.speed || 0;
    const state = truck.state || 'Unknown';
    const bearing = truck.bearing || 0;
    const hasAlerts = alerts.filter(alert =>
      alert.affectedRoutes && alert.affectedRoutes.includes(truck.truck_id)
    ).length > 0;

    let primaryColor = '#6B7280';
    if (isSelected) primaryColor = '#3B82F6';
    else if (state === 'En Route') primaryColor = '#10B981';
    else if (state === 'At Destination') primaryColor = '#8B5CF6';
    else if (state === 'Maintenance') primaryColor = '#F59E0B';

    const baseSize = isSelected ? 36 : 32;
    const zoom = map ? map.getZoom() : 13;
    const scaleFactor = Math.max(0.6, Math.min(1.4, zoom / 10));
    const adjustedSize = [baseSize * scaleFactor, baseSize * scaleFactor];

    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: ${adjustedSize[0]}px;
          height: ${adjustedSize[1]}px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${bearing}deg);
          transition: all 0.3s ease;
        ">
          <div style="
            width: ${adjustedSize[0] - 4}px;
            height: ${adjustedSize[1] - 4}px;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            border: 3px solid white;
            ${hasAlerts ? 'animation: alertPulse 2s infinite;' : ''}
            backdrop-filter: blur(10px);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1v-3c0-.6-.4-1-1-1h-5z"/>
              <circle cx="7" cy="18" r="2"/>
              <path d="M15 18H9"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
          </div>
          ${speed > 0 && isSelected ? `
            <div style="
              position: absolute;
              top: -12px;
              left: 50%;
              transform: translateX(-50%);
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white;
              padding: 2px 6px;
              border-radius: 6px;
              font-size: 9px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              border: 1px solid white;
            ">
              ${Math.round(speed)} km/h
            </div>
          ` : ''}
        </div>
        <style>
          @keyframes alertPulse {
            0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.8); }
          }
        </style>
      `,
      className: '',
      iconSize: adjustedSize,
      iconAnchor: [adjustedSize[0] / 2, adjustedSize[1] / 2],
    });
  }, [selectedDelivery, alerts, map]);

  const createAlertIcon = (alert) => {
    // Styles complètes pour tous les types d'alertes (TAILLE RÉDUITE)
    const alertStyles = {
      // Trafic & Accidents
      accident: { color: '#EF4444', icon: '⚠️', bgColor: '#FEE2E2', borderColor: '#EF4444' },
      accidentMinor: { color: '#F59E0B', icon: '🚗', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
      accidentMajor: { color: '#DC2626', icon: '🚨', bgColor: '#FEE2E2', borderColor: '#DC2626' },
      construction: { color: '#F59E0B', icon: '🚧', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
      traffic: { color: '#3B82F6', icon: '🚦', bgColor: '#DBEAFE', borderColor: '#3B82F6' },
      police: { color: '#8B5CF6', icon: '👮', bgColor: '#EDE9FE', borderColor: '#8B5CF6' },
      maintenance: { color: '#10B981', icon: '🔧', bgColor: '#D1FAE5', borderColor: '#10B981' },
      info: { color: '#6B7280', icon: 'ℹ️', bgColor: '#F3F4F6', borderColor: '#6B7280' },
      danger: { color: '#DC2626', icon: '🚨', bgColor: '#FEE2E2', borderColor: '#DC2626' },
      warning: { color: '#F59E0B', icon: '⚠️', bgColor: '#FEF3C7', borderColor: '#F59E0B' },

      // Météo complète
      weather: { color: '#6B7280', icon: alert.icon || '🌤️', bgColor: '#F3F4F6', borderColor: '#6B7280' },
      weatherRain: { color: '#3B82F6', icon: '🌧️', bgColor: '#DBEAFE', borderColor: '#3B82F6' },
      weatherThunderstorm: { color: '#7C3AED', icon: '⛈️', bgColor: '#EDE9FE', borderColor: '#7C3AED' },
      weatherMist: { color: '#9CA3AF', icon: '🌫️', bgColor: '#F9FAFB', borderColor: '#9CA3AF' },
      weatherClear: { color: '#F59E0B', icon: '☀️', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
      weatherClouds: { color: '#6B7280', icon: '☁️', bgColor: '#F3F4F6', borderColor: '#6B7280' },
      weatherSnow: { color: '#06B6D4', icon: '❄️', bgColor: '#CFFAFE', borderColor: '#06B6D4' },
      weatherWind: { color: '#10B981', icon: '🌬️', bgColor: '#D1FAE5', borderColor: '#10B981' },
      weatherFog: { color: '#9CA3AF', icon: '🌫️', bgColor: '#F9FAFB', borderColor: '#9CA3AF' },
      weatherHail: { color: '#06B6D4', icon: '🧊', bgColor: '#CFFAFE', borderColor: '#06B6D4' },
      weatherHeat: { color: '#EF4444', icon: '🔥', bgColor: '#FEE2E2', borderColor: '#EF4444' },
      weatherCold: { color: '#06B6D4', icon: '🥶', bgColor: '#CFFAFE', borderColor: '#06B6D4' },
      weatherStorm: { color: '#7C3AED', icon: '🌪️', bgColor: '#EDE9FE', borderColor: '#7C3AED' },
      weatherFlood: { color: '#3B82F6', icon: '🌊', bgColor: '#DBEAFE', borderColor: '#3B82F6' },
      weatherSnowstorm: { color: '#06B6D4', icon: '❄️', bgColor: '#CFFAFE', borderColor: '#06B6D4' },
      weatherBlizzard: { color: '#06B6D4', icon: '🌨️', bgColor: '#CFFAFE', borderColor: '#06B6D4' },
      weatherTornado: { color: '#7C3AED', icon: '🌪️', bgColor: '#EDE9FE', borderColor: '#7C3AED' },
      weatherHurricane: { color: '#7C3AED', icon: '🌀', bgColor: '#EDE9FE', borderColor: '#7C3AED' },
      weatherVolcanic: { color: '#EF4444', icon: '🌋', bgColor: '#FEE2E2', borderColor: '#EF4444' },
      weatherWildfire: { color: '#EF4444', icon: '🔥', bgColor: '#FEE2E2', borderColor: '#EF4444' },
      weatherEarthquake: { color: '#92400E', icon: '🌍', bgColor: '#FEF3C7', borderColor: '#92400E' },
      weatherTsunami: { color: '#3B82F6', icon: '🌊', bgColor: '#DBEAFE', borderColor: '#3B82F6' },
      weatherPollution: { color: '#6B7280', icon: '🏭', bgColor: '#F3F4F6', borderColor: '#6B7280' },
      weatherPollen: { color: '#F59E0B', icon: '🌸', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
      weatherDust: { color: '#92400E', icon: '💨', bgColor: '#FEF3C7', borderColor: '#92400E' },
      weatherSmoke: { color: '#6B7280', icon: '💨', bgColor: '#F3F4F6', borderColor: '#6B7280' },
      weatherIce: { color: '#06B6D4', icon: '🧊', bgColor: '#CFFAFE', borderColor: '#06B6D4' }
    };

    const style = alertStyles[alert.type] || alertStyles.accident;

    // TAILLE RÉDUITE pour ne pas masquer les camions (30% plus petit)
    const baseSize = alert.severity === 'danger' ? 28 : alert.severity === 'warning' ? 26 : 24;
    const fontSize = alert.severity === 'danger' ? 14 : alert.severity === 'warning' ? 13 : 12;

    return L.divIcon({
      html: `
        <div style="
          width: ${baseSize}px;
          height: ${baseSize}px;
          background: linear-gradient(135deg, ${style.bgColor} 0%, ${style.bgColor}CC 100%);
          border: 2px solid ${style.borderColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${fontSize}px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          animation: alertPulse 2.5s ease-in-out infinite;
          backdrop-filter: blur(3px);
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%);
            border-radius: 50%;
          "></div>
          <span style="position: relative; z-index: 2;">${style.icon}</span>
        </div>
      `,
      className: '',
      iconSize: [baseSize, baseSize],
      iconAnchor: [baseSize / 2, baseSize / 2],
    });
  };

  const handleMapStyleChange = useCallback((style) => {
    if (!map) return;
    
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer && layer !== weatherLayer) {
        map.removeLayer(layer);
      }
    });

    const tileLayers = {
      standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
      }),
      terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap',
      }),
    };

    tileLayers[style].addTo(map);
  }, [map, weatherLayer]);

  // Suivi des mouvements de souris pour les tooltips
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    if (map) return; // Éviter la double initialisation

    configureLeafletIcons();

    const leafletMap = L.map('map-container', {
      center: [36.8065, 10.1815],
      zoom: 7,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    const tileLayers = {
      standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
      }),
      terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap',
      }),
    };

    tileLayers.standard.addTo(leafletMap);
    setMap(leafletMap);

    if (onMapReady) {
      onMapReady(leafletMap);
    }

    // Générer les routes avec le système amélioré et cache
    setTimeout(async () => {
      try {
        const routes = await generateRealRoutes();
        setTrucksData(prev => prev.map(truck => {
          // Priorité: routes générées > routes par défaut
          const routeToUse = routes[truck.truck_id] || routeGenerator.generateRouteWithProgress(truck.truck_id, 0)?.fullRoute;

          const fallbackRoute = [
            truck.position,
            truck.destinationCoords || truck.destination?.coordinates || truck.position
          ];

          return {
            ...truck,
            realRoute: routeToUse || fallbackRoute
          };
        }));
        console.log('✅ Toutes les routes initialisées avec succès');
      } catch (error) {
        console.warn('🔄 Erreur routes, utilisation générateur intégré');
        // Utiliser le générateur de routes intégré en cas d'échec complet
        setTrucksData(prev => prev.map(truck => {
          const routeInfo = routeGenerator.generateRouteWithProgress(truck.truck_id, 0);
          const fallbackRoute = [
            truck.position,
            truck.destinationCoords || truck.destination?.coordinates || truck.position
          ];
          return {
            ...truck,
            realRoute: routeInfo?.fullRoute || fallbackRoute
          };
        }));
      }
    }, 100); // Réduction du délai

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Mise à jour du style de carte
  useEffect(() => {
    if (map) {
      handleMapStyleChange(mapStyle);
    }
  }, [mapStyle, map, handleMapStyleChange]);

  // Affichage des camions et alertes avec système amélioré + gestion des rôles
  useEffect(() => {
    if (!map) return;

    // Nettoyer uniquement les marqueurs dynamiques (garder la carte de base)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Filtrer les camions selon le rôle utilisateur
    const visibleTrucks = roleManager.filterTrucks(trucksData);
    console.log(`🚛 Affichage ${visibleTrucks.length} camions (rôle: ${roleManager.getCurrentRole()})`);

    // Ajouter les camions avec positions mises à jour
    visibleTrucks.forEach((truck) => {
      // Mettre à jour position selon route réaliste
      const currentPosition = routeGenerator.getCurrentTruckPosition(
        truck.truck_id,
        truck.route_progress || 0
      );

      const truckPosition = currentPosition || truck.position;
      if (!truckPosition || truckPosition.length < 2) return;

      // Calculer orientation du camion
      const bearing = routeGenerator.calculateBearing(
        truck.truck_id,
        truck.route_progress || 0
      );

      const marker = L.marker(truckPosition, {
        icon: createTruckIcon({...truck, bearing: bearing}),
        zIndexOffset: 1000 // Camions au-dessus des alertes
      }).addTo(map);

      marker.on('mouseover', () => {
        setHoveredItem({
          type: 'truck',
          data: truck,
          alerts: alerts.filter(alert => 
            alert.affectedRoutes && alert.affectedRoutes.includes(truck.truck_id)
          )
        });
      });

      marker.on('mouseout', () => {
        setHoveredItem(null);
      });

      marker.on('click', () => {
        onSelectDelivery(truck);

        // Animation de suivi améliorée
        map.flyTo(truck.position, Math.max(map.getZoom(), 13), {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.25
        });

        console.log(`🚛 Camion sélectionné: ${truck.truck_id} - Suivi activé: ${followTruck}`);
      });

      // ROUTES AMÉLIORÉES avec générateur de trajectoires réalistes
      if (showRoutes) {
        const routeInfo = routeGenerator.generateRouteWithProgress(
          truck.truck_id,
          truck.route_progress || 0
        );

        if (routeInfo && routeInfo.fullRoute && routeInfo.fullRoute.length > 1) {
          const isSelected = selectedDelivery && selectedDelivery.truck_id === truck.truck_id;

          // Couleur selon état (BLEU pour actif, VERT pour terminé)
          let routeColor = routeInfo.color;
          if (truck.state === 'En Route') {
            routeColor = '#1e90ff'; // Bleu pour trajets actifs
          } else if (truck.state === 'At Destination') {
            routeColor = '#22c55e'; // Vert pour trajets terminés
          } else if (truck.state === 'Maintenance') {
            routeColor = '#f59e0b'; // Orange pour maintenance
          }

          // Style de ligne selon état
          const lineStyle = {
            color: routeColor,
            weight: isSelected ? 6 : 4,
            opacity: truck.state === 'At Destination' ? 0.7 : 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          };

          // Ligne discontinue pour trajets terminés
          if (truck.state === 'At Destination') {
            lineStyle.dashArray = '12, 8';
          }

          // Créer la polyline
          const routeLine = L.polyline(routeInfo.fullRoute, lineStyle).addTo(map);

          // Pas d'animation pour les trajectoires (performance améliorée)

          // Points d'étapes pour le camion sélectionné
          if (isSelected) {
            const markers = routeGenerator.createRouteMarkers({
              ...routeInfo,
              truck: truck
            });

            markers.forEach(markerInfo => {
              L.circleMarker(markerInfo.position, {
                radius: markerInfo.type === 'waypoint' ? 6 : 8,
                color: markerInfo.type === 'start' ? '#10B981' :
                       markerInfo.type === 'end' ? '#EF4444' : '#3B82F6',
                fillColor: markerInfo.type === 'start' ? '#10B981' :
                           markerInfo.type === 'end' ? '#EF4444' : '#3B82F6',
                fillOpacity: 0.8,
                weight: 3,
                stroke: true,
                strokeColor: '#fff',
              }).addTo(map).bindPopup(markerInfo.popup);
            });
          }
        }
      }
    });

    // Affichage intelligent des alertes avec gestion des rôles
    const alertsToShow = allAlerts.length > 0 ? allAlerts : alerts;
    if (alertsToShow && alertsToShow.length > 0) {
      let filteredAlerts = alertsToShow.filter(alert =>
        alert &&
        alert.position &&
        Array.isArray(alert.position) &&
        alert.position.length === 2 &&
        !deletedAlerts?.includes(alert.id)
      );

      // Filtrer selon le rôle utilisateur
      filteredAlerts = roleManager.filterAlerts(filteredAlerts, visibleTrucks);

      console.log(`🗺️ Affichage ${filteredAlerts.length} alertes sur carte (rôle: ${roleManager.getCurrentRole()})`);

      filteredAlerts.forEach((alert, index) => {
        try {
          const alertMarker = L.marker(alert.position, {
            icon: createAlertIcon(alert),
            zIndexOffset: alert.realEvent ? 1000 : 500 // Priorité aux alertes temps réel
          }).addTo(map);

          // Tooltip détaillé au survol avec informations étendues
          alertMarker.on('mouseover', () => {
            setHoveredItem({
              type: 'alert',
              data: {
                ...alert,
                showDetailed: true,
                isRealTime: alert.realEvent || false,
                alertIndex: index + 1
              }
            });
          });

          alertMarker.on('mouseout', () => {
            setHoveredItem(null);
          });

          // Clic pour centrer et afficher détails
          alertMarker.on('click', () => {
            if (onAlertClick) {
              onAlertClick(alert);
            }

            // Animation de focus améliorée
            const targetZoom = alert.realEvent ? 15 : 14;
            map.flyTo(alert.position, Math.max(map.getZoom(), targetZoom), {
              animate: true,
              duration: 1.8,
              easeLinearity: 0.25
            });

            console.log(`🎯 Focus alerte: ${alert.title} - ${alert.city || alert.location}`);
          });

        } catch (error) {
          console.warn(`⚠️ Erreur affichage alerte ${alert.id}:`, error);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, trucksData, selectedDelivery, showRoutes, alerts, showAlerts, createTruckIcon, onSelectDelivery]);

  // Couche météo
  useEffect(() => {
    if (!map) return;

    if (showWeather && !weatherLayer) {
      const wLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${WEATHER_API_KEY}`, {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.6,
      });
      wLayer.addTo(map);
      setWeatherLayer(wLayer);
    } else if (!showWeather && weatherLayer) {
      map.removeLayer(weatherLayer);
      setWeatherLayer(null);
    }
  }, [showWeather, map, weatherLayer]);

  // Animation des camions avec routes réalistes
  useEffect(() => {
    setTrucksData(deliveries);

    const interval = setInterval(() => {
      setTrucksData((prev) =>
        prev.map((truck) => {
          if (truck.state === 'En Route') {
            // Augmenter progressivement la progression
            const newProgress = Math.min(100, truck.route_progress + Math.random() * 1.2);

            // Obtenir la nouvelle position sur la route réaliste
            const currentPosition = routeGenerator.getCurrentTruckPosition(
              truck.truck_id,
              newProgress
            );

            // Calculer la nouvelle orientation
            const newBearing = routeGenerator.calculateBearing(
              truck.truck_id,
              newProgress
            );

            // Varier légèrement la vitesse
            const newSpeed = Math.max(25, Math.min(85, truck.speed + (Math.random() - 0.5) * 6));

            return {
              ...truck,
              position: currentPosition || truck.position,
              speed: newSpeed,
              route_progress: newProgress,
              bearing: newBearing,
            };
          }
          return truck;
        })
      );
    }, 5000); // Animation toutes les 5 secondes

    return () => clearInterval(interval);
  }, [deliveries]);

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      width: '100%', 
      overflow: 'hidden',
      background: '#f1f5f9'
    }}>
      <div
        id="map-container"
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          minHeight: '400px',
          borderRadius: '0',
          overflow: 'hidden'
        }}
      />

      {/* Tooltip au survol */}
      {hoveredItem && (
        <div
          style={{
            position: 'fixed',
            left: mousePosition.x + 20,
            top: mousePosition.y - 10,
            zIndex: 10000,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '2px solid rgba(255,255,255,0.3)',
            minWidth: '250px',
            maxWidth: '350px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {hoveredItem.type === 'truck' ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  🚛
                </div>
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: '#1f2937' 
                  }}>
                    {hoveredItem.data.truck_id}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#6b7280' 
                  }}>
                    {hoveredItem.data.vehicle}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>👤 Conducteur:</span><br/>
                    <strong style={{ color: '#1f2937' }}>{hoveredItem.data.driver.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>📍 Destination:</span><br/>
                    <strong style={{ color: '#1f2937' }}>{hoveredItem.data.destination}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>⚡ Vitesse:</span><br/>
                    <strong style={{ color: '#1f2937' }}>{Math.round(hoveredItem.data.speed)} km/h</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>📊 Progression:</span><br/>
                    <strong style={{ color: '#1f2937' }}>{hoveredItem.data.route_progress}%</strong>
                  </div>
                </div>
              </div>

              {hoveredItem.alerts && hoveredItem.alerts.length > 0 && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  borderLeft: '4px solid #ef4444'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>
                    ⚠️ {hoveredItem.alerts.length} alerte{hoveredItem.alerts.length > 1 ? 's' : ''} active{hoveredItem.alerts.length > 1 ? 's' : ''}
                  </div>
                  {hoveredItem.alerts.slice(0, 2).map((alert, index) => (
                    <div key={index} style={{ fontSize: '11px', color: '#7f1d1d', marginBottom: '2px' }}>
                      {alert.icon} {alert.title} (+{alert.delay}min)
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  position: 'relative',
                  fontSize: '32px'
                }}>
                  {hoveredItem.data.icon}
                  {hoveredItem.data.isRealTime && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#10b981',
                      borderRadius: '50%',
                      width: '12px',
                      height: '12px',
                      border: '2px solid white',
                      animation: 'alertPulse 2s infinite'
                    }}></div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#1f2937'
                    }}>
                      {hoveredItem.data.title}
                    </h4>
                    {hoveredItem.data.isRealTime && (
                      <span style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        fontSize: '8px',
                        fontWeight: '700',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }}>LIVE</span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {hoveredItem.data.location}
                  </p>
                  {hoveredItem.data.city && (
                    <p style={{
                      margin: '2px 0 0 0',
                      fontSize: '10px',
                      color: '#9ca3af',
                      fontWeight: '600'
                    }}>
                      🏢 {hoveredItem.data.city}
                    </p>
                  )}
                </div>
              </div>
              
              <p style={{ 
                margin: '0 0 12px 0', 
                fontSize: '13px', 
                color: '#4b5563',
                lineHeight: '1.4'
              }}>
                {hoveredItem.data.description}
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: '#9ca3af'
              }}>
                <span>��� {hoveredItem.data.affectedRoutes?.join(', ')}</span>
                <span style={{ 
                  background: hoveredItem.data.severity === 'danger' ? '#ef4444' : 
                             hoveredItem.data.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  +{hoveredItem.data.delay}min
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes alertPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            }
            50% {
              transform: scale(1.1);
              box-shadow: 0 8px 30px rgba(0,0,0,0.35);
            }
          }

          @keyframes alertFocus {
            0%, 100% {
              transform: scale(1);
              filter: brightness(1);
            }
            25% {
              transform: scale(1.3);
              filter: brightness(1.5);
            }
            50% {
              transform: scale(1.1);
              filter: brightness(1.2);
            }
            75% {
              transform: scale(1.2);
              filter: brightness(1.3);
            }
          }

          @keyframes truckSelected {
            0%, 100% {
              transform: scale(1) rotate(0deg);
            }
            50% {
              transform: scale(1.15) rotate(5deg);
            }
          }

          .leaflet-marker-icon {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .leaflet-marker-icon:hover {
            transform: scale(1.1);
            filter: brightness(1.1);
          }

          /* Trajectoires statiques - animations supprimées */

          /* Amélioration visuelle des lignes de route */
          .leaflet-interactive {
            transition: all 0.3s ease;
          }

          .leaflet-interactive:hover {
            filter: brightness(1.2);
          }
        `}
      </style>
    </div>
  );
};

export default MapCanvas;
