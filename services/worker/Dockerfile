FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY packages/env/package.json ./packages/env/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/redis/package.json ./packages/redis/package.json
COPY services/api/package.json ./services/api/package.json
COPY services/worker/package.json ./services/worker/package.json
COPY services/stats/package.json ./services/stats/package.json
RUN npm install --omit=dev --workspace services/worker
COPY packages/env ./packages/env
COPY packages/logger ./packages/logger
COPY packages/redis ./packages/redis
COPY services/worker ./services/worker

ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start", "--workspace", "services/worker"]
