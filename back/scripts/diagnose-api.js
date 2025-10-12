#!/usr/bin/env node

/**
 * Script de diagnostic pour l'API
 * 
 * Ce script permet de diagnostiquer les problèmes d'API
 * et de vérifier la configuration du serveur
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Charger les variables d'environnement
dotenv.config();

console.log('🔍 Diagnostic de l\'API - Gestionnaire de Mots de Passe');
console.log('=====================================================');
console.log('');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('⚙️  Configuration actuelle:');
console.log('==========================');
console.log(`API_URL: ${API_URL}`);
console.log(`API_KEY: ${API_KEY ? '***' + API_KEY.slice(-8) : 'Non défini'}`);
console.log(`FRONTEND_URL: ${FRONTEND_URL}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Non défini'}`);
console.log('');

// Fonction pour tester un endpoint
async function testEndpoint(method, endpoint, body = null, headers = {}) {
  try {
    const url = `${API_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`🧪 Test: ${method} ${endpoint}`);
    console.log(`   URL: ${url}`);
    console.log(`   Headers: ${JSON.stringify(options.headers, null, 2)}`);
    if (body) {
      console.log(`   Body: ${JSON.stringify(body, null, 2)}`);
    }
    
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response: ${responseText}`);
    
    if (response.ok) {
      console.log('   ✅ Succès');
    } else {
      console.log('   ❌ Erreur');
    }
    
    console.log('');
    return { success: response.ok, status: response.status, data: responseText };
    
  } catch (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
    console.log('');
    return { success: false, error: error.message };
  }
}

// Fonction pour diagnostiquer les problèmes
async function diagnoseAPI() {
  console.log('🔍 Diagnostic des endpoints API...');
  console.log('');
  
  // Test 1: Health check
  await testEndpoint('GET', '/health');
  
  // Test 2: Test email config
  await testEndpoint('GET', '/api/password-reset/test-email');
  
  // Test 3: Demande de réinitialisation (avec email valide)
  await testEndpoint('POST', '/api/password-reset/request', {
    email: 'test@example.com'
  });
  
  // Test 4: Validation de token (avec tokens de test)
  await testEndpoint('GET', '/api/password-reset/validate?token=test123&csrf=test456');
  
  // Test 5: Test sans clé API
  await testEndpoint('GET', '/api/password-reset/test-email', null, { 'x-api-key': '' });
  
  // Test 6: Test avec mauvaise clé API
  await testEndpoint('GET', '/api/password-reset/test-email', null, { 'x-api-key': 'wrong-key' });
}

// Fonction pour vérifier la configuration
function checkConfiguration() {
  console.log('🔧 Vérification de la configuration...');
  console.log('');
  
  const issues = [];
  
  if (!API_KEY) {
    issues.push('❌ API_KEY non définie dans .env');
  }
  
  if (!process.env.DATABASE_URL) {
    issues.push('❌ DATABASE_URL non définie dans .env');
  }
  
  if (!process.env.SMTP_USER) {
    issues.push('⚠️  SMTP_USER non définie (emails en mode simulation)');
  }
  
  if (!process.env.SMTP_PASS) {
    issues.push('⚠️  SMTP_PASS non définie (emails en mode simulation)');
  }
  
  if (issues.length === 0) {
    console.log('✅ Configuration correcte');
  } else {
    console.log('Problèmes détectés:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  console.log('');
}

// Fonction pour afficher les solutions
function showSolutions() {
  console.log('💡 Solutions possibles:');
  console.log('======================');
  console.log('');
  console.log('1. 🔑 Vérifier la clé API:');
  console.log('   - Vérifiez que API_KEY est définie dans .env');
  console.log('   - Vérifiez que VITE_API_KEY est définie dans frontend/.env');
  console.log('   - Les deux clés doivent être identiques');
  console.log('');
  console.log('2. 🌐 Vérifier l\'URL de l\'API:');
  console.log('   - Vérifiez que VITE_API_URL pointe vers votre serveur');
  console.log('   - En production: https://votre-domaine.com');
  console.log('   - En développement: http://localhost:3001');
  console.log('');
  console.log('3. 🚀 Vérifier que le serveur est démarré:');
  console.log('   cd back && npm run dev');
  console.log('');
  console.log('4. 📧 Vérifier la configuration email:');
  console.log('   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  console.log('   - Ou laissez vide pour le mode simulation');
  console.log('');
  console.log('5. 🔍 Vérifier les logs du serveur:');
  console.log('   - Regardez la console du serveur backend');
  console.log('   - Vérifiez les logs dans back/logs/');
  console.log('');
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node diagnose-api.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h        Affiche cette aide');
    console.log('  --config, -c      Vérifie la configuration');
    console.log('  --test, -t        Teste les endpoints API');
    console.log('  --solutions, -s   Affiche les solutions');
    console.log('  --all, -a         Exécute tous les tests');
    console.log('');
    return;
  }
  
  if (args.includes('--config') || args.includes('-c')) {
    checkConfiguration();
    return;
  }
  
  if (args.includes('--test') || args.includes('-t')) {
    await diagnoseAPI();
    return;
  }
  
  if (args.includes('--solutions') || args.includes('-s')) {
    showSolutions();
    return;
  }
  
  if (args.includes('--all') || args.includes('-a')) {
    checkConfiguration();
    await diagnoseAPI();
    showSolutions();
    return;
  }
  
  // Par défaut, afficher l'aide
  console.log('🔍 Diagnostic de l\'API - Gestionnaire de Mots de Passe');
  console.log('');
  console.log('Utilisez --help pour voir les options disponibles');
  console.log('Utilisez --all pour exécuter tous les tests');
}

// Exécuter le script
main().catch(console.error);
