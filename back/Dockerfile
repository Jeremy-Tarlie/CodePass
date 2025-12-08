# Dockerfile optimisé pour la production
FROM node:18-alpine AS builder

# Installer OpenSSL pour Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris devDependencies pour la compilation)
RUN npm i && npm cache clean --force

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Construire l'application
RUN npm run build

# Nettoyer les devDependencies après la compilation
RUN npm prune --production

# Image de production
FROM node:18-alpine AS production

# Installer OpenSSL pour Prisma
RUN apk add --no-cache openssl

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
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
