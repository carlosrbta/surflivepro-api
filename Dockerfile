FROM node:22-alpine AS base

WORKDIR /usr/src/app

# Copia só os manifests primeiro
COPY package*.json ./

###################
# DEVELOPMENT
###################
FROM base AS development

# Instala TODAS as deps (dev + prod) para desenvolvimento
RUN npm ci

# Copia o restante do código
COPY . .

USER node

###################
# BUILD
###################
FROM base AS build

# Instala TODAS as deps (dev + prod) para compilar o Nest
RUN npm ci

COPY . .

# Gera o build do NestJS (gera dist/main.js e, se existir, dist/main-worker.js)
RUN npm run build

###################
# PRODUCTION
###################
FROM node:22-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copia package.json para conseguir reconstruir node_modules de prod
COPY package*.json ./

# Instala APENAS dependências de produção
RUN npm ci --omit=dev && npm cache clean --force

# Copia os arquivos compilados (dist) do estágio de build
COPY --from=build /usr/src/app/dist ./dist

# Copia o script de entrypoint
COPY --from=build /usr/src/app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER node


# Container de API: (no Dokploy você usa esse comando por padrão)
ENTRYPOINT ["./docker-entrypoint.sh"]