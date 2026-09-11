# ==========================================
# Base Image
# ==========================================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ==========================================
# Development Target (Hot-reload, full deps)
# ==========================================
FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ==========================================
# Builder Stage (Compile TypeScript)
# ==========================================
FROM base AS builder
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==========================================
# Production Target (Minimal, hardened image)
# ==========================================
FROM base AS production
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output and database migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Use unprivileged user for security
USER node

EXPOSE 3000

# Execute database migrations then start production server
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]