FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY public ./public
COPY src ./src
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
