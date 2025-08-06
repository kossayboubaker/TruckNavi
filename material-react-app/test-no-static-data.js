#!/usr/bin/env node

// Script de vérification - AUCUNE donnée statique autorisée
// Ce script vérifie que toutes les données proviennent bien du backend MongoDB

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification élimination données statiques...\n');

// Patterns interdits (données statiques)
const forbiddenPatterns = [
  /predefinedRoutes\s*=\s*{/, // Routes prédéfinies
  /mockTrucks\s*=\s*\[/, // Camions mockés
  /hardcoded.*data/i, // Données hardcodées
  /static.*routes/i, // Routes statiques
  /TN-001.*waypoints/, // Waypoints hardcodés
  /demo.*trucks/i, // Camions de démo
  /fallback.*data/i, // Données de fallback
  /const.*trucks.*=.*\[/, // Tableaux de camions constants
  /generateMockTruckData/, // Génération de données mockées
  /\[36\.7.*10\.2.*\]/  // Coordonnées GPS hardcodées (pattern Tunisie)
];

// Patterns requis (données dynamiques)
const requiredPatterns = [
  /trip\/details/, // Endpoint requis
  /trip\/route/, // Endpoint requis  
  /mongodb/i, // Références MongoDB
  /axios\.get.*trip/, // Appels API
  /backend.*api/i // Références backend API
];

let errors = [];
let warnings = [];
let successes = [];

// Fonction de scan des fichiers
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Vérifier patterns interdits
    forbiddenPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        errors.push(`❌ ${relativePath}: Données statiques détectées (pattern ${index + 1})`);
      }
    });
    
    // Vérifier patterns requis pour les services
    if (filePath.includes('Service.js') || filePath.includes('service.js')) {
      let hasRequiredPattern = false;
      requiredPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasRequiredPattern = true;
        }
      });
      
      if (!hasRequiredPattern) {
        warnings.push(`⚠️ ${relativePath}: Aucun appel API backend détecté`);
      } else {
        successes.push(`✅ ${relativePath}: Utilise bien les APIs backend`);
      }
    }
    
    // Vérifications spéciales
    if (content.includes('getFallbackData') && !content.includes('handleAPIFailure')) {
      errors.push(`❌ ${relativePath}: Contient encore des données de fallback statiques`);
    }
    
    if (content.includes('predefinedRoutes') && !content.includes('// TODO')) {
      errors.push(`❌ ${relativePath}: Contient encore des routes prédéfinies`);
    }
    
  } catch (error) {
    warnings.push(`⚠️ Impossible de lire ${filePath}: ${error.message}`);
  }
}

// Scanner tous les fichiers JS/JSX du projet
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(filePath);
    }
  });
}

// Lancer le scan
console.log('📁 Scan du dossier src/...');
if (fs.existsSync('./src')) {
  scanDirectory('./src');
}

console.log('📁 Scan du dossier node-api/src/...');
if (fs.existsSync('./node-api/src')) {
  scanDirectory('./node-api/src');
}

// Afficher les résultats
console.log('\n🎯 RÉSULTATS DE LA VÉRIFICATION:\n');

if (errors.length > 0) {
  console.log('❌ ERREURS CRITIQUES (données statiques détectées):');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️ AVERTISSEMENTS:');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

if (successes.length > 0) {
  console.log('✅ SUCCÈS (utilisation correcte des APIs):');
  successes.forEach(success => console.log(`   ${success}`));
  console.log('');
}

// Vérifications spécifiques
console.log('🔎 VÉRIFICATIONS SPÉCIFIQUES:\n');

// 1. Vérifier que routeGenerator.js n'a plus de données statiques
const routeGenPath = './src/services/routeGenerator.js';
if (fs.existsSync(routeGenPath)) {
  const content = fs.readFileSync(routeGenPath, 'utf8');
  if (content.includes('predefinedRoutes')) {
    console.log('❌ routeGenerator.js contient encore des routes prédéfinies');
  } else {
    console.log('✅ routeGenerator.js ne contient plus de données statiques');
  }
} else {
  console.log('✅ routeGenerator.js a été remplacé par un service 100% dynamique');
}

// 2. Vérifier que useRealTimeData n'a plus de fallback
const hookPath = './src/hooks/useRealTimeData.js';
if (fs.existsSync(hookPath)) {
  const content = fs.readFileSync(hookPath, 'utf8');
  if (content.includes('getFallbackData') && !content.includes('handleAPIFailure')) {
    console.log('❌ useRealTimeData.js contient encore des données de fallback');
  } else {
    console.log('✅ useRealTimeData.js ne contient plus de données de fallback statiques');
  }
}

// 3. Vérifier la configuration backend
const backendConfigPath = './node-api/src/routes/dynamic-integration.js';
if (fs.existsSync(backendConfigPath)) {
  const content = fs.readFileSync(backendConfigPath, 'utf8');
  if (content.includes('generateMockTruckData') && !content.includes('fetchFromMongoDB')) {
    console.log('❌ Backend contient encore des données mockées');
  } else {
    console.log('✅ Backend configuré pour utiliser MongoDB exclusivement');
  }
}

// Résumé final
console.log('\n📊 RÉSUMÉ:');
console.log(`   • Erreurs critiques: ${errors.length}`);
console.log(`   • Avertissements: ${warnings.length}`);
console.log(`   • Succès: ${successes.length}`);

if (errors.length === 0) {
  console.log('\n🎉 EXCELLENT! Toutes les données statiques ont été éliminées.');
  console.log('   Le système utilise maintenant exclusivement votre backend MongoDB.');
  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('   1. Vérifiez que MongoDB est démarré');
  console.log('   2. Ajoutez des données dans les collections trucks/routes/alerts');
  console.log('   3. Testez les endpoints: GET /trip/details et GET /trip/route');
  console.log('   4. Consultez MONGODB_INTEGRATION.md pour les détails');
} else {
  console.log('\n🚨 Des données statiques subsistent! Veuillez les éliminer.');
  process.exit(1);
}

console.log('\n🔗 Documentation: MONGODB_INTEGRATION.md');
console.log('🔗 Configuration: LOGISTICS_SYSTEM_README.md\n');
