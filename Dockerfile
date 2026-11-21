# syntax=docker/dockerfile:1

# ---- build the static site ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

COPY . .
# These are baked into the site at build time (they are public, never put secrets here).
ARG VITE_USE_MOCK=true
ARG VITE_API_URL=/api
ENV VITE_USE_MOCK=$VITE_USE_MOCK VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve with nginx (runs as non-root, listens on 8080) ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
