# ---------- Build stage ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# optional: if you have runtime files outside dist, copy them
# COPY --from=builder /app/package.json ./package.json

CMD ["npm", "run", "start:prod"]