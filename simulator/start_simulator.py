#!/usr/bin/env python3
"""
Script de démarrage du simulateur dynamique multi-camions
Lance la simulation en arrière-plan et gère les camions automatiquement
"""

import subprocess
import sys
import os
import signal
import time
import threading
from dynamic_truck_simulator import TruckSimulator
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimulatorManager:
    def __init__(self):
        self.simulator = None
        self.running = False
        self.simulation_thread = None
        
    def start_simulator(self):
        """Démarre le simulateur principal"""
        try:
            logger.info("🚀 Démarrage du simulateur multi-camions...")
            
            self.simulator = TruckSimulator()
            
            if not self.simulator.producer:
                logger.error("❌ Impossible de démarrer sans Kafka")
                return False
            
            # Démarrer la simulation en arrière-plan
            self.simulation_thread = self.simulator.start_simulation()
            self.running = True
            
            logger.info("✅ Simulateur démarré avec succès")
            logger.info("📡 Écoute des camions actifs...")
            logger.info("🔄 Simulation toutes les 5 secondes")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur démarrage simulateur: {e}")
            return False
    
    def stop_simulator(self):
        """Arrête le simulateur proprement"""
        logger.info("🛑 Arrêt du simulateur...")
        
        if self.simulator:
            self.simulator.simulation_running = False
            
        if self.simulation_thread:
            self.simulation_thread.join(timeout=10)
            
        self.running = False
        logger.info("✅ Simulateur arrêté")
    
    def get_status(self):
        """Retourne le statut du simulateur"""
        if not self.running or not self.simulator:
            return {
                "status": "stopped",
                "active_trucks": 0,
                "uptime": 0
            }
        
        return {
            "status": "running",
            "active_trucks": len(self.simulator.active_trucks),
            "uptime": time.time() - getattr(self.simulator, 'start_time', time.time()),
            "trucks": list(self.simulator.active_trucks.keys())
        }
    
    def add_test_truck(self, truck_id="TEST-001"):
        """Ajoute un camion de test pour vérifier le système"""
        if not self.simulator:
            logger.error("Simulateur non démarré")
            return False
            
        # Créer un camion de test avec trajet prédéfini
        test_truck = {
            "_id": "test_object_id",
            "truckId": truck_id,
            "truckType": "Box",
            "weight": 8000,
            "status": "in_service",
            "location": {
                "lat": 36.8065,
                "lon": 10.1815
            }
        }
        
        try:
            self.simulator.initialize_truck_simulation(test_truck)
            logger.info(f"✅ Camion de test {truck_id} ajouté")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur ajout camion test: {e}")
            return False

def signal_handler(signum, frame):
    """Gestionnaire de signaux pour arrêt propre"""
    logger.info("📡 Signal d'arrêt reçu")
    manager.stop_simulator()
    sys.exit(0)

def main():
    """Point d'entrée principal"""
    global manager
    manager = SimulatorManager()
    
    # Gestionnaire de signaux
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Démarrer le simulateur
    if not manager.start_simulator():
        logger.error("❌ Échec du démarrage")
        sys.exit(1)
    
    # Ajouter un camion de test si argument fourni
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        logger.info("🧪 Mode test activé")
        time.sleep(2)  # Attendre que le simulateur soit prêt
        manager.add_test_truck("TEST-DEMO")
    
    try:
        # Boucle principale avec monitoring
        while manager.running:
            status = manager.get_status()
            
            if status["active_trucks"] > 0:
                logger.info(f"📊 Simulation active: {status['active_trucks']} camions, uptime: {status['uptime']:.0f}s")
                if status.get("trucks"):
                    logger.info(f"🚛 Camions actifs: {', '.join(status['trucks'])}")
            else:
                logger.info("⏳ En attente de camions actifs...")
            
            time.sleep(30)  # Status toutes les 30 secondes
            
    except KeyboardInterrupt:
        logger.info("⌨️ Interruption clavier")
    except Exception as e:
        logger.error(f"❌ Erreur inattendue: {e}")
    finally:
        manager.stop_simulator()

def check_dependencies():
    """Vérifie que les dépendances sont disponibles"""
    required_packages = ['kafka', 'pymongo', 'requests']
    missing = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        logger.error(f"❌ Packages manquants: {', '.join(missing)}")
        logger.info("Installez avec: pip install " + " ".join(missing))
        return False
    
    return True

if __name__ == "__main__":
    # Vérifications préalables
    if not check_dependencies():
        sys.exit(1)
    
    # Informations de démarrage
    logger.info("=" * 50)
    logger.info("🚛 SIMULATEUR DYNAMIQUE MULTI-CAMIONS")
    logger.info("=" * 50)
    logger.info("📍 Surveillance des camions en base MongoDB")
    logger.info("📡 Transmission via Kafka vers Socket.IO")
    logger.info("🔄 Mise à jour temps réel toutes les 5 secondes")
    logger.info("🛑 Ctrl+C pour arrêter")
    logger.info("=" * 50)
    
    # Démarrage
    main()
