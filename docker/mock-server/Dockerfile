FROM node:22-alpine

WORKDIR /app

# contour CLI - mock engine
ARG CONTOUR_VERSION=1.1.1
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm add -g @trillionclues/contour@${CONTOUR_VERSION}

# Switch to non-root AFTER install
USER node

# spec file is baked in at build time (not mounted)
# immutability - same image = same mock behavior
COPY --chown=node:node spec.yaml ./spec.yaml

# contour's port
EXPOSE 3001

# ping local server with wget(5sec interval, 3sec timeout, 5 retries)
# so Docker (and Mockline) knows when it's ready or unhealthy
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["contour", "start", "spec.yaml", "--port", "3001"]
