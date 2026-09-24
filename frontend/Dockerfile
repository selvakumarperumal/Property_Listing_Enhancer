# syntax=docker/dockerfile:1

# ---------- Dependencies: production-only node_modules ----------
FROM node:24-alpine AS deps

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci --omit=dev

# ---------- Runtime ----------
FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    BACKEND_URL=http://backend:8000

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
