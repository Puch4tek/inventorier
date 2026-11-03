FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN DATABASE_USER=build DATABASE_PASSWORD=build npx prisma generate
RUN APP_ENCRYPTION_KEY="$(openssl rand -base64 32)" npm run build

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
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/src/lib/db/database-config.ts ./src/lib/db/database-config.ts


EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --config prisma7.config.ts && exec node server.js"]