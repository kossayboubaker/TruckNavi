#!/usr/bin/env node

/**
 * Script de test pour vérifier la communication Socket.IO complète
 * Simulateur → Kafka → Backend → Socket.IO → Frontend
 */

import { io } from 'socket.io-client';
import { Kafka } from 'kafkajs';

const API_URL = 'http://localhost:8080';
const KAFKA_BROKER = 'localhost:9092';

console.log('🧪 Test de communication Socket.IO démarré\n');

// 1. Tester la connexion Socket.IO au backend
console.log('1️⃣ Test de connexion Socket.IO...');
const socket = io(API_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connecté au backend:', socket.id);
  
  // S'abonner aux événements
  socket.join('truck_updates');
  console.log('🚛 Abonné aux mises à jour des camions');
  
  // Écouter les mises à jour
  socket.on('truckUpdate', (data) => {
    console.log('📡 Mise à jour camion reçue:', data.id);
  });
  
  socket.on('trucks_list_update', (data) => {
    console.log('📋 Liste complète reçue:', data.count, 'camions');
  });
  
  socket.on('truck_alert', (alert) => {
    console.log('🚨 Alerte reçue:', alert.title);
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur connexion Socket.IO:', error.message);
});

socket.on('disconnect', () => {
  console.log('❌ Socket.IO déconnecté');
});

// 2. Tester l'envoi de données via Kafka (simulateur)
console.log('\n2️⃣ Test d\'envoi de données Kafka...');

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();

async function testKafkaProducer() {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connecté');
    
    // Simuler envoi de données de camion
    const testTruckData = {
      truck_id: 'TEST-001',
      position: [36.8, 10.18],
      location: {
        lat: 36.8,
        lng: 10.18
      },
      speed: 60,
      bearing: 90,
      route_progress: 50,
      state: 'En Route',
      timestamp: new Date().toISOString()
    };
    
    await producer.send({
      topic: 'truck-data',
      messages: [{
        value: JSON.stringify(testTruckData)
      }]
    });
    
    console.log('📤 Données test envoyées via Kafka pour camion:', testTruckData.truck_id);
    
  } catch (error) {
    console.error('❌ Erreur test Kafka:', error.message);
  }
}

// 3. Tester l'API REST
console.log('\n3️⃣ Test API REST...');

async function testAPI() {
  try {
    const response = await fetch(`${API_URL}/api/trucks/active-trucks`, {
      headers: {
        'Authorization': 'Bearer test-token' // Token de test
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API REST accessible - Camions trouvés:', data.count || 0);
    } else {
      console.log('⚠️ API REST accessible mais nécessite authentification');
    }
  } catch (error) {
    console.error('❌ API REST non accessible:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('\n🚀 Démarrage des tests...\n');
  
  // Attendre un peu pour la connexion Socket.IO
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test API
  await testAPI();
  
  // Test Kafka
  await testKafkaProducer();
  
  console.log('\n📊 Résumé des tests:');
  console.log('- Socket.IO: Connexion testée');
  console.log('- Kafka: Envoi de données test');
  console.log('- API REST: Accessibilité vérifiée');
  
  console.log('\n💡 Pour vérifier le flux complet:');
  console.log('1. Démarrez le backend: npm run start:dev');
  console.log('2. Démarrez le simulateur: python dynamic_truck_simulator.py');
  console.log('3. Ouvrez le frontend et regardez les mises à jour temps réel');
  
  // Nettoyer
  setTimeout(async () => {
    await producer.disconnect();
    socket.disconnect();
    console.log('\n✅ Test terminé - Connexions fermées');
    process.exit(0);
  }, 5000);
}

runTests().catch(console.error);
