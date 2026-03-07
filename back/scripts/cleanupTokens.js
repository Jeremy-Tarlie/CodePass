#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('../generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Script pour nettoyer les tokens de réinitialisation expirés
 */
async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Début du nettoyage des tokens expirés...');
    
    // Supprimer les tokens expirés
    const expiredTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true, usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Supprimer les tokens utilisés depuis plus de 24h
        ]
      }
    });

    console.log(`✅ ${expiredTokens.count} tokens expirés supprimés`);

    // Supprimer les sessions expirées
    const expiredSessions = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    console.log(`✅ ${expiredSessions.count} sessions expirées supprimées`);

    // Supprimer les anciens logs de sécurité (plus de 30 jours)
    const oldLogs = await prisma.securityLog.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    console.log(`✅ ${oldLogs.count} anciens logs de sécurité supprimés`);

    console.log('🎉 Nettoyage terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  cleanupExpiredTokens();
}

module.exports = { cleanupExpiredTokens };

