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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if platform.system() == "Windows":
    KAFKA_BROKER = os.getenv("KAFKA_BROKERS", "localhost:9092")
else:
    KAFKA_BROKER = os.getenv("KAFKA_BROKERS", "kafka:9092")
UPDATE_TOPIC = 'truck-data'
MONGO_URI = "mongodb+srv://Exypnotech:EMj6oghYfCtAU2nX@cluster1.xipnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1"
# MONGO_URI = os.getenv("MONGO_URI", "mongodb://Exypnotech:EMj6oghYfCtAU2nX@mongo:27017/trucknavigation?authSource=admin")
DB_NAME = "test"
TRIP_COLLECTION = "trips"

LOCATIONS = {
    "Tunis": [10.18, 36.8],
    "Ariana": [10.11, 36.86],
    "Ben Arous": [10.23, 36.77],
    "Manouba": [10.09, 36.8],
    "Nabeul": [11.02, 36.45],
    "Zaghouan": [10.14, 36.4],
    "Bizerte": [9.87, 37.27],
    "Beja": [9.19, 36.73],
    "Jendouba": [8.79, 36.5],
    "Kef": [8.71, 36.18],
    "Siliana": [9.37, 36.08],
    "Sousse": [10.62, 35.83],
    "Monastir": [10.8, 35.77],
    "Mahdia": [11.06, 35.5],
    "Kairouan": [10.1, 35.67],
    "Kasserine": [8.75, 35.17],
    "Sidi Bouzid": [9.5, 35.03],
    "Sfax": [10.76, 34.74],
    "Gafsa": [8.78, 34.42],
    "Tozeur": [8.13, 33.92],
    "Kebili": [8.97, 33.7],
    "Gabes": [10.1, 33.88],
    "Medenine": [10.5, 33.35],
    "Tataouine": [10.45, 32.93]
}

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[TRIP_COLLECTION]

def create_kafka_producer(max_retries=20, retry_delay=2):
    for attempt in range(max_retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("Kafka connecté")
            return producer
        except NoBrokersAvailable:
            logger.warning(f"Kafka non disponible, tentative {attempt + 1}")
            time.sleep(retry_delay)
    logger.error("Impossible de se connecter à Kafka")
    sys.exit(1)

def get_active_trip_by_truck_id(truck_id):
    try:
        trip = collection.find_one({
            "truck": ObjectId(truck_id),
            "statusTrip": "in_progress",
            "isCompleted": False
        })

        if trip:
            logger.info(f"Trajet trouvé pour le camion {truck_id}")
        else:
            logger.warning(f"Aucun trajet actif trouvé pour le camion {truck_id}")
        return trip
    except Exception as e:
        logger.error(f"Erreur MongoDB: {e}")
        return None

def get_osrm_route(start_coords, end_coords):
    osrm_url = f"http://osrm:5000/route/v1/driving/{start_coords[0]},{start_coords[1]};{end_coords[0]},{end_coords[1]}?overview=full&geometries=geojson"
    logger.info(f"Requête OSRM : {osrm_url}")
    response = requests.get(osrm_url)
    if response.status_code == 200:
        logger.info("Route OSRM récupérée avec succès")
        return response.json()["routes"][0]["geometry"]["coordinates"]
    else:
        logger.error(f"Erreur OSRM: {response.text}")
        return None

def simulate_truck_route(trip, producer):
    truck_id = str(trip["truck"])
    start = LOCATIONS.get(trip["startPoint"])
    end = LOCATIONS.get(trip["destination"])

    if not start or not end:
        logger.error("Coordonnées GPS manquantes")
        return

    route = get_osrm_route(start, end)
    if not route:
        logger.error("Impossible de générer la route")
        return

    total_steps = len(route)
    logger.info(f"Lancement de la simulation ({total_steps} points)")

    for i, coord in enumerate(route):
        message = {
            "truck_id": truck_id,
            "location": {
                "lat": coord[1],
                "lng": coord[0]
            },
            "statusTrip": "arrived" if i == total_steps - 1 else "in_progress",
            "route_progress": round((i / (total_steps - 1)) * 100, 2),
            "startPoint": trip["startPoint"],
            "destination": trip["destination"]
        }

        try:
            producer.send(UPDATE_TOPIC, message)
            producer.flush()
            logger.info(f"[{i}/{total_steps - 1}] Position envoyée: {message}")
        except Exception as e:
            logger.error(f"Erreur Kafka: {e}")

        time.sleep(5)

def run(truck_id):
    producer = create_kafka_producer()
    trip = get_active_trip_by_truck_id(truck_id)

    if not trip:
        logger.error("Aucun trajet actif trouvé, arrêt.")
        return

    simulate_truck_route(trip, producer)
    logger.info("Simulation terminée.")

if __name__ == "__main__":
    # Remplace par l’ID réel du camion que tu veux simuler
    truck_id = "6880c935ad99694230ba3148"
    run(truck_id)