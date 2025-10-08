#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Script pour générer une clé API sécurisée
 */
function generateApiKey() {
  // Générer une clé de 32 bytes (256 bits)
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  console.log('🔑 Clé API générée avec succès !');
  console.log('');
  console.log('📋 Configuration requise :');
  console.log('');
  console.log('1. Backend (.env) :');
  console.log(`   API_KEY="${apiKey}"`);
  console.log('');
  console.log('2. Frontend (.env) :');
  console.log(`   API_KEY="${apiKey}"`);
  console.log('');
  console.log('3. Utilisation dans vos requêtes :');
  console.log('   Headers: { "X-API-Key": "' + apiKey + '" }');
  console.log('');
  console.log('⚠️  IMPORTANT :');
  console.log('   - Sauvegardez cette clé en sécurité');
  console.log('   - Ne la partagez jamais publiquement');
  console.log('   - Utilisez HTTPS en production');
  console.log('');
  console.log('🔒 Sécurité :');
  console.log('   - Clé de 256 bits (très sécurisée)');
  console.log('   - Génération cryptographiquement sécurisée');
  console.log('   - Comparaison timing-safe implémentée');
  
  return apiKey;
}

// Exécuter le script si appelé directement
if (require.main === module) {
  generateApiKey();
}

module.exports = { generateApiKey };
