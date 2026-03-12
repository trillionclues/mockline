FROM node:22-alpine AS installer
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

ARG CONTOUR_VERSION=1.1.1
RUN pnpm add -g @trillionclues/contour@${CONTOUR_VERSION}

# ── runner ────────────
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=installer /usr/local/bin/contour /usr/local/bin/contour
COPY --from=installer /usr/local/lib/node_modules /usr/local/lib/node_modules

USER node
COPY --chown=node:node spec.yaml ./spec.yaml

EXPOSE 3001
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["contour", "start", "spec.yaml", "--port", "3001"]
