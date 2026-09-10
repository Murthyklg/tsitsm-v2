FROM node:22-bookworm-slim AS build

WORKDIR /app
 
# Copy package files
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source files
COPY tsconfig*.json vite.config.ts eslint.config.js index.html ./
COPY src ./src
COPY public ./public

ARG VITE_MICROSOFT_CLIENT_ID
ARG VITE_MICROSOFT_TENANT_ID
ARG VITE_API_SCOPE
ARG VITE_API_URL=/api
ENV VITE_MICROSOFT_CLIENT_ID=$VITE_MICROSOFT_CLIENT_ID
ENV VITE_MICROSOFT_TENANT_ID=$VITE_MICROSOFT_TENANT_ID
ENV VITE_API_SCOPE=$VITE_API_SCOPE
ENV VITE_API_URL=$VITE_API_URL

# Build the application with production environment
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY database ./database

# Create non-root user for security
RUN groupadd --system app && useradd --system --gid app app

# Change ownership to non-root user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => { if (r.statusCode !== 200) process.exit(1) })"

# Start the application
CMD ["node", "--import", "tsx", "server/index.ts"]