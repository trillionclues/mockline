FROM node:22-alpine

WORKDIR /app

# contour CLI - mock engine
ARG CONTOUR_VERSION=latest
RUN pnpm add -g @trillionclues/contour@${CONTOUR_VERSION}

# Run as non-root user for security
USER node

# spec file is baked in at build time (not mounted)
# ensures immutability - same image = same mock behavior
COPY --chown=node:node spec.yaml ./spec.yaml

# contour's default port
EXPOSE 3001

# ping local server with wget(5sec interval, 3sec timeout, 5 retries)
# so Docker (and Mockline) knows when it's ready or unhealthy
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["contour", "start", "spec.yaml", "--port", "3001"]
