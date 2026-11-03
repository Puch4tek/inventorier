FROM node:24-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate --config prisma-bootstrap.config.ts
RUN npm run build

FROM base AS production-deps

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma-bootstrap.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --config prisma-bootstrap.config.ts && exec node server.js"]