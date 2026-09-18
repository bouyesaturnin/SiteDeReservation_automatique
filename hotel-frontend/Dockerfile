# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy the rest of the frontend source
COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY public ./public
COPY src ./src

# Build the production bundle
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Lightweight static file server
RUN npm install -g serve

COPY --from=build /app/dist ./dist

ENV PORT=5173
EXPOSE 5173

CMD ["sh", "-c", "serve -s dist -l ${PORT:-5173}"]
