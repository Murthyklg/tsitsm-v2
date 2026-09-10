# Build stage for Cloud Functions
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build the functions
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built functions from builder
COPY --from=builder /app/lib ./lib

# Expose port for local emulator or custom server
EXPOSE 5001

# Note: This is a reference setup. Firebase Cloud Functions are typically
# deployed directly to Firebase, not run in containers. This is useful for
# local development or testing.
CMD ["npm", "start"]
