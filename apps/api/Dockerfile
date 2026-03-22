FROM node:22-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── pruner ─────────
FROM base AS pruner
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @mockline/api --docker

# ── deps ───────────
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/full/packages/db/prisma/schema.prisma ./packages/db/prisma/schema.prisma
RUN pnpm install --frozen-lockfile -r

# ── builder ───────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json
RUN pnpm --filter=@mockline/api build
RUN pnpm --filter=@mockline/db prisma generate

# ── runner ───────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 honojs

COPY --chown=honojs:nodejs --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=honojs:nodejs --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --chown=honojs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=honojs:nodejs --from=builder /app/packages/db ./packages/db
COPY --chown=honojs:nodejs --from=builder /app/package.json ./

USER honojs
EXPOSE 4000
CMD ["sh", "-c", "packages/db/node_modules/.bin/prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/api/dist/index.mjs"]
