FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Railway: set these as service variables so they are available at build time
ARG NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL
ARG NEXT_PUBLIC_KEYRA_AUTH_BACKEND_URL
ARG NEXT_PUBLIC_KEYRA_GET_STARTED_URL
ARG NEXT_PUBLIC_TRANSLATE_DEV_AUTH_BYPASS
ARG NEXT_PUBLIC_TRANSLATE_LOGIN_RETURN_URL
ARG NEXT_PUBLIC_TRANSLATE_LOGIN_POST_AUTH_PATH
ENV NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL=$NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL
ENV NEXT_PUBLIC_KEYRA_AUTH_BACKEND_URL=$NEXT_PUBLIC_KEYRA_AUTH_BACKEND_URL
ENV NEXT_PUBLIC_KEYRA_GET_STARTED_URL=$NEXT_PUBLIC_KEYRA_GET_STARTED_URL
ENV NEXT_PUBLIC_TRANSLATE_DEV_AUTH_BYPASS=$NEXT_PUBLIC_TRANSLATE_DEV_AUTH_BYPASS
ENV NEXT_PUBLIC_TRANSLATE_LOGIN_RETURN_URL=$NEXT_PUBLIC_TRANSLATE_LOGIN_RETURN_URL
ENV NEXT_PUBLIC_TRANSLATE_LOGIN_POST_AUTH_PATH=$NEXT_PUBLIC_TRANSLATE_LOGIN_POST_AUTH_PATH
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/split2 ./node_modules/split2
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/xtend ./node_modules/xtend

RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["./docker-entrypoint.sh"]
