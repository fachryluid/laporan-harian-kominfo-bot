# Stage 1: Build
FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: Production
FROM node:22

WORKDIR /app

COPY --from=builder /app /app

# Install only production dependencies
RUN npm install --omit=dev

# Default command (will be overridden by compose)
CMD ["node", "server.js"]