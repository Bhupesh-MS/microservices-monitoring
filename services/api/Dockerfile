FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY packages/env/package.json ./packages/env/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/redis/package.json ./packages/redis/package.json
COPY services/api/package.json ./services/api/package.json
COPY services/worker/package.json ./services/worker/package.json
COPY services/stats/package.json ./services/stats/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace services/api
COPY --chown=node:node packages/env ./packages/env
COPY --chown=node:node packages/logger ./packages/logger
COPY --chown=node:node packages/redis ./packages/redis
COPY --chown=node:node services/api ./services/api

ENV NODE_ENV=production
EXPOSE 3000
USER 1000
CMD ["node", "services/api/src/server.js"]
