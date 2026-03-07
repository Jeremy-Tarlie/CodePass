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

# Prisma 7 : prisma.config.ts exige DATABASE_URL (valeur factice au build, réelle au runtime)
ARG DATABASE_URL=postgresql://localhost:5432/dummy
ENV DATABASE_URL=${DATABASE_URL}

# Générer Prisma (client dans ./generated), construire et nettoyer (DL3059 consolidation)
RUN npx prisma generate && npm run build && npm prune --production

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
COPY --from=builder --chown=nodejs:nodejs /app/generated ./generated
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Créer le dossier logs avec les bonnes permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3001

# Commande de démarrage avec migration Prisma
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
