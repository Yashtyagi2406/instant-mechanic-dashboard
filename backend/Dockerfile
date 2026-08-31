# Multi-stage build for production efficiency
# Stage 1: Build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

# Stage 2: Production image — only ship compiled JS + prod deps
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy only what's needed at runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Ensure Prisma client is generated for the target platform
RUN npm run db:generate

# Expose the API port
EXPOSE 4000

# dumb-init handles signals properly (important for Docker stop/restart)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
