#!/usr/bin/env node
'use strict';

/**
 * Applique les colonnes manquantes (idempotent).
 * À lancer après "prisma migrate deploy" au cas où la table _prisma_migrations
 * est en avance sur le schéma réel (migration marquée appliquée mais colonne absente).
 */
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn('[ensure-schema] DATABASE_URL manquante, skip.');
  process.exit(0);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
    `);
    console.log('[ensure-schema] Colonnes vérifiées.');
  } catch (e) {
    console.error('[ensure-schema] Erreur:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
