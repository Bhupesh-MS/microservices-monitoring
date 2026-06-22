FROM node:20-alpine

# Install dumb-init to handle PID 1 OS signals properly
RUN apk add --no-cache dumb-init

WORKDIR /app
COPY package*.json ./
COPY packages/env/package.json ./packages/env/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/redis/package.json ./packages/redis/package.json
COPY services/api/package.json ./services/api/package.json
COPY services/worker/package.json ./services/worker/package.json
COPY services/stats/package.json ./services/stats/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace services/api && \
    npm cache clean --force
COPY --chown=node:node packages/env ./packages/env
COPY --chown=node:node packages/logger ./packages/logger
COPY --chown=node:node packages/redis ./packages/redis
COPY --chown=node:node services/api ./services/api

ENV NODE_ENV=production
EXPOSE 3000
USER node
# Containers will shut down gracefully and instantly when Kubernetes scales them down or deploys a new version!
CMD ["dumb-init", "node", "services/api/src/server.js"] 
