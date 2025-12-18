# ---------- Build stage ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install deps (include dev deps for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install prod deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist

# If you have any runtime-needed files outside dist, copy them too (usually not needed)

# Zeabur will provide PORT env; your app should listen on process.env.PORT
EXPOSE 3000

CMD ["npm", "run", "start:prod"]