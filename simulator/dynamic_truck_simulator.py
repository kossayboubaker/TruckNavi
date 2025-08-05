import json
import time
import logging
import sys
import requests
from pymongo import MongoClient
from bson import ObjectId
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
import os
import platform
import threading
import random
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if platform.system() == "Windows":
    KAFKA_BROKER = os.getenv("KAFKA_BROKERS", "localhost:9092")
else:
    KAFKA_BROKER = os.getenv("KAFKA_BROKERS", "kafka:9092")

UPDATE_TOPIC = 'truck-data'
ROUTE_TOPIC = 'truck-route-updates'
MONGO_URI = "mongodb+srv://Exypnotech:EMj6oghYfCtAU2nX@cluster1.xipnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1"
DB_NAME = "test"
CAMION_COLLECTION = "camions"

# Positions réelles en Tunisie avec vraies routes
REAL_ROUTES = {
    "TN-001": {
        "name": "Ben Arous → Manouba",
        "startPoint": "Ben Arous",
        "destination": "Manouba",
        "route": [
            [36.770032, 10.23034],  # Ben Arous Centre
            [36.775000, 10.220000],  # Sortie Ben Arous
            [36.780000, 10.210000],  # Route vers Tunis
            [36.785000, 10.200000],  # Entrée Tunis Sud
            [36.790000, 10.195000],  # Centre Tunis
            [36.795000, 10.190000],  # Tunis Nord
            [36.800000, 10.170000],  # Route vers Manouba
            [36.805000, 10.150000],  # Approche Manouba
            [36.8098, 10.1085]       # Manouba Centre
        ],
        "distance_km": 25,
        "duration_hours": 0.7
    },
    "TN-002": {
        "name": "Tunis → Sousse",
        "startPoint": "Tunis",
        "destination": "Sousse",
        "route": [
            [36.8065, 10.1815],      # Tunis Centre
            [36.800000, 10.200000],  # Sortie Tunis
            [36.750000, 10.250000],  # Autoroute A1 Début
            [36.650000, 10.350000],  # A1 Section 1
            [36.500000, 10.450000],  # A1 Section 2
            [36.350000, 10.500000],  # A1 Section 3
            [36.200000, 10.550000],  # A1 Section 4
            [36.050000, 10.600000],  # Approche Sousse
            [35.9000, 10.620000],    # Sousse Nord
            [35.8256, 10.6369]       # Sousse Port
        ],
        "distance_km": 145,
        "duration_hours": 2.5
    },
    "TN-003": {
        "name": "Ariana → Hammamet",
        "startPoint": "Ariana",
        "destination": "Hammamet",
        "route": [
            [36.4098, 10.1398],      # Ariana
            [36.400000, 10.160000],  # Sortie Ariana
            [36.380000, 10.200000],  # Route vers Est
            [36.350000, 10.250000],  # Vers Nabeul
            [36.300000, 10.350000],  # Route côtière
            [36.250000, 10.450000],  # Approche Cap Bon
            [36.200000, 10.500000],  # Nabeul Nord
            [36.150000, 10.550000],  # Vers Hammamet
            [36.100000, 10.580000],  # Hammamet Nord
            [35.6786, 10.0963]       # Hammamet Centre
        ],
        "distance_km": 85,
        "duration_hours": 1.8
    },
    "TN-004": {
        "name": "La Goulette → Nabeul",
        "startPoint": "La Goulette",
        "destination": "Nabeul",
        "route": [
            [36.7538, 10.2286],      # Port La Goulette
            [36.760000, 10.250000],  # Sortie port
            [36.770000, 10.300000],  # Route côtière
            [36.750000, 10.400000],  # Vers Cap Bon
            [36.700000, 10.500000],  # Route Cap Bon
            [36.650000, 10.600000],  # Approche Nabeul
            [36.600000, 10.650000],  # Nabeul Ouest
            [36.550000, 10.700000],  # Centre Nabeul
            [36.4561, 10.7376]       # Nabeul Industrial
        ],
        "distance_km": 72,
        "duration_hours": 1.5
    },
    "TN-005": {
        "name": "Sfax → Gabès",
        "startPoint": "Sfax",
        "destination": "Gabès",
        "route": [
            [34.7406, 10.7603],      # Hôpital Sfax
            [34.720000, 10.740000],  # Sortie Sfax
            [34.650000, 10.650000],  # Route vers Sud
            [34.550000, 10.550000],  # GP1 Section 1
            [34.450000, 10.450000],  # GP1 Section 2
            [34.350000, 10.350000],  # GP1 Section 3
            [34.250000, 10.250000],  # GP1 Section 4
            [34.150000, 10.200000],  # Approche Gabès
            [34.050000, 10.150000],  # Gabès Nord
            [33.8869, 10.0982]       # Hôpital Gabès
        ],
        "distance_km": 135,
        "duration_hours": 2.2
    }
}

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
camion_collection = db[CAMION_COLLECTION]

class TruckSimulator:
    def __init__(self):
        self.producer = self.create_kafka_producer()
        self.active_trucks = {}
        self.simulation_running = True
        
    def create_kafka_producer(self, max_retries=20, retry_delay=2):
        for attempt in range(max_retries):
            try:
                producer = KafkaProducer(
                    bootstrap_servers=[KAFKA_BROKER],
                    value_serializer=lambda v: json.dumps(v).encode('utf-8')
                )
                logger.info("Kafka connecté avec succès")
                return producer
            except NoBrokersAvailable:
                logger.warning(f"Kafka non disponible, tentative {attempt + 1}")
                time.sleep(retry_delay)
        logger.error("Impossible de se connecter à Kafka")
        return None

    def get_all_active_trucks(self):
        """Récupère tous les camions actifs depuis MongoDB"""
        try:
            trucks = list(camion_collection.find({
                "status": "in_service"
            }))
            logger.info(f"Récupération de {len(trucks)} camions actifs")
            return trucks
        except Exception as e:
            logger.error(f"Erreur MongoDB: {e}")
            return []

    def initialize_truck_simulation(self, truck):
        """Initialise la simulation pour un camion"""
        truck_id = truck.get('truckId', str(truck.get('_id')))
        
        # Obtenir la route prédéfinie ou créer une route par défaut
        route_info = REAL_ROUTES.get(truck_id)
        if not route_info:
            # Route par défaut si pas dans les routes prédéfinies
            current_location = truck.get('location', {})
            start_lat = current_location.get('lat', 36.8)
            start_lon = current_location.get('lon', 10.2)
            
            route_info = {
                "route": [
                    [start_lat, start_lon],
                    [start_lat + 0.1, start_lon + 0.1],
                    [start_lat + 0.2, start_lon + 0.2]
                ],
                "distance_km": 50,
                "duration_hours": 1.0,
                "startPoint": "Position actuelle",
                "destination": truck.get('destination', 'Destination inconnue')
            }
        
        self.active_trucks[truck_id] = {
            "truck_data": truck,
            "route_info": route_info,
            "current_step": 0,
            "progress": 0.0,
            "speed": random.randint(45, 75),
            "status": "in_progress",
            "last_update": time.time(),
            "bearing": 0
        }
        
        logger.info(f"Simulation initialisée pour {truck_id}: {route_info['startPoint']} → {route_info['destination']}")

    def calculate_bearing(self, lat1, lon1, lat2, lon2):
        """Calcule l'orientation entre deux points"""
        import math
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360
        return bearing

    def get_current_position(self, truck_id):
        """Calcule la position actuelle du camion sur sa route"""
        if truck_id not in self.active_trucks:
            return None
            
        truck_sim = self.active_trucks[truck_id]
        route = truck_sim["route_info"]["route"]
        progress = truck_sim["progress"]
        
        if progress >= 100:
            truck_sim["status"] = "arrived"
            return route[-1]  # Position finale
        
        # Interpolation linéaire sur la route
        total_segments = len(route) - 1
        current_segment_float = (progress / 100.0) * total_segments
        current_segment = int(current_segment_float)
        segment_progress = current_segment_float - current_segment
        
        if current_segment >= total_segments:
            return route[-1]
        
        # Position interpolée
        start_point = route[current_segment]
        end_point = route[current_segment + 1]
        
        lat = start_point[0] + (end_point[0] - start_point[0]) * segment_progress
        lon = start_point[1] + (end_point[1] - start_point[1]) * segment_progress
        
        # Calculer l'orientation
        bearing = self.calculate_bearing(start_point[0], start_point[1], end_point[0], end_point[1])
        truck_sim["bearing"] = bearing
        
        return [lat, lon]

    def update_truck_position(self, truck_id):
        """Met à jour la position d'un camion"""
        if truck_id not in self.active_trucks:
            return
            
        truck_sim = self.active_trucks[truck_id]
        
        if truck_sim["status"] == "arrived":
            return
        
        # Progression basée sur la vitesse (simulation réaliste)
        duration_hours = truck_sim["route_info"]["duration_hours"]
        speed_factor = truck_sim["speed"] / 60.0  # Vitesse en km/h vers progression
        
        # Augmentation de la progression (5 secondes = update interval)
        progress_increment = (5.0 / 3600.0) / duration_hours * 100 * speed_factor
        
        truck_sim["progress"] = min(100, truck_sim["progress"] + progress_increment)
        current_position = self.get_current_position(truck_id)
        
        if current_position:
            # Créer message pour Kafka
            message = {
                "truck_id": truck_id,
                "position": current_position,
                "location": {
                    "lat": current_position[0],
                    "lng": current_position[1]
                },
                "speed": truck_sim["speed"],
                "bearing": truck_sim["bearing"],
                "route_progress": round(truck_sim["progress"], 2),
                "status": truck_sim["status"],
                "state": "En Route" if truck_sim["status"] == "in_progress" else "At Destination",
                "startPoint": truck_sim["route_info"]["startPoint"],
                "destination": truck_sim["route_info"]["destination"],
                "timestamp": datetime.now().isoformat(),
                "route": truck_sim["route_info"]["route"]
            }
            
            # Envoyer via Kafka
            if self.producer:
                try:
                    self.producer.send(UPDATE_TOPIC, message)
                    self.producer.flush()
                    logger.info(f"Position mise à jour pour {truck_id}: {truck_sim['progress']:.1f}% - {current_position}")
                except Exception as e:
                    logger.error(f"Erreur Kafka pour {truck_id}: {e}")
            
            # Mettre à jour MongoDB
            try:
                camion_collection.find_one_and_update(
                    {"truckId": truck_id},
                    {
                        "$set": {
                            "location": {
                                "lat": current_position[0],
                                "lon": current_position[1]
                            },
                            "speed": truck_sim["speed"],
                            "bearing": truck_sim["bearing"],
                            "routeProgress": truck_sim["progress"],
                            "status": truck_sim["status"],
                            "lastUpdate": datetime.now(),
                            "route": truck_sim["route_info"]["route"]
                        }
                    }
                )
            except Exception as e:
                logger.error(f"Erreur mise à jour MongoDB pour {truck_id}: {e}")

    def simulate_all_trucks(self):
        """Simulation continue de tous les camions"""
        while self.simulation_running:
            try:
                # Récupérer les camions actifs
                active_trucks = self.get_all_active_trucks()
                
                # Initialiser nouveaux camions
                for truck in active_trucks:
                    truck_id = truck.get('truckId', str(truck.get('_id')))
                    if truck_id not in self.active_trucks:
                        self.initialize_truck_simulation(truck)
                
                # Mettre à jour positions
                for truck_id in list(self.active_trucks.keys()):
                    self.update_truck_position(truck_id)
                    
                    # Varier la vitesse de façon réaliste
                    truck_sim = self.active_trucks[truck_id]
                    if random.random() < 0.1:  # 10% de chance de changer vitesse
                        speed_change = random.randint(-5, 5)
                        truck_sim["speed"] = max(30, min(80, truck_sim["speed"] + speed_change))
                
                # Nettoyer les camions arrivés (après 1 minute)
                current_time = time.time()
                for truck_id in list(self.active_trucks.keys()):
                    truck_sim = self.active_trucks[truck_id]
                    if (truck_sim["status"] == "arrived" and 
                        current_time - truck_sim["last_update"] > 60):
                        del self.active_trucks[truck_id]
                        logger.info(f"Simulation terminée pour {truck_id}")
                
                time.sleep(5)  # Mise à jour toutes les 5 secondes
                
            except Exception as e:
                logger.error(f"Erreur simulation: {e}")
                time.sleep(10)

    def start_simulation(self):
        """Démarre la simulation en arrière-plan"""
        simulation_thread = threading.Thread(target=self.simulate_all_trucks)
        simulation_thread.daemon = True
        simulation_thread.start()
        logger.info("Simulateur de camions démarré")
        return simulation_thread

def main():
    """Point d'entrée principal"""
    logger.info("Démarrage du simulateur dynamique multi-camions")
    
    simulator = TruckSimulator()
    
    if not simulator.producer:
        logger.error("Impossible de démarrer sans Kafka")
        return
    
    # Démarrer la simulation
    simulation_thread = simulator.start_simulation()
    
    try:
        # Maintenir le script en vie
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Arrêt du simulateur")
        simulator.simulation_running = False
        simulation_thread.join(timeout=5)

if __name__ == "__main__":
    main()
