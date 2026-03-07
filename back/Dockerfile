# Dockerfile optimisé pour la production
FROM node:20-alpine AS builder

# Installer OpenSSL pour Prisma (version non épinglée pour compatibilité Alpine variable selon le tag node:X-alpine)
# hadolint ignore=DL3018
RUN apk add --no-cache openssl

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris devDependencies pour la compilation)
RUN npm i && npm cache clean --force

# Copier le code source
COPY . .

# Prisma 6 : DATABASE_URL pour prisma generate (schéma + prisma.config.ts)
ARG DATABASE_URL=postgresql://localhost:5432/dummy
ENV DATABASE_URL=${DATABASE_URL}

# Générer Prisma (client dans ./generated), construire, copier le client dans dist pour require(), nettoyer
RUN npx prisma generate && npm run build && cp -r /app/generated /app/dist/ && npm prune --production

# Image de production
FROM node:20-alpine AS production

# Installer OpenSSL pour Prisma (version non épinglée pour compatibilité Alpine variable selon le tag node:X-alpine)
# hadolint ignore=DL3018
RUN apk add --no-cache openssl

# Créer un utilisateur non-root pour la sécurité (DL3059 consolidation)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
# prisma/ contient schema.prisma et migrations/ (obligatoire pour migrate deploy)
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/ensure-schema.js ./

# Installer le CLI Prisma en prod (prune l'a retiré) pour exécuter "prisma migrate deploy" au démarrage
RUN npm install && chown -R nodejs:nodejs /app/node_modules

# Créer le dossier logs avec les bonnes permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3001

# Au démarrage : migrations Prisma, puis colonnes manquantes (idempotent), puis l’app
CMD ["sh", "-c", "npx prisma migrate deploy && node ensure-schema.js && npm run start"]
