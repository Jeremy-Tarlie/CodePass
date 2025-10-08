// Script de diagnostic pour vérifier la configuration
console.log('=== DIAGNOSTIC DE CONFIGURATION ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_API_KEY:', import.meta.env.VITE_API_KEY ? 'Définie' : 'NON DÉFINIE');
console.log('Mode:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);

// Test de connectivité
async function testConnection() {
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;
  
  if (!API_URL) {
    console.error('❌ VITE_API_URL n\'est pas définie');
    return;
  }
  
  if (!API_KEY) {
    console.error('❌ VITE_API_KEY n\'est pas définie');
    return;
  }
  
  try {
    console.log('🔄 Test de connexion vers:', API_URL);
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Connexion réussie, status:', response.status);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('Détails:', error);
  }
}

testConnection();

