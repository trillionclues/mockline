FROM node:22-alpine AS installer
WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=/usr/local/share/pnpm:$PATH

ARG CONTOUR_VERSION=1.2.0
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN pnpm add -g @trillionclues/contour@${CONTOUR_VERSION}
RUN chmod -R 755 /usr/local/share/pnpm

# ── runner ────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=/usr/local/share/pnpm:$PATH

COPY --from=installer /usr/local/share/pnpm /usr/local/share/pnpm
RUN chmod -R 755 /usr/local/share/pnpm

# Patch no longer needed — contour 1.2.0 binds to 0.0.0.0 by default
# RUN find /usr/local/share/pnpm ...

# Patch contour to bind to 0.0.0.0 (all interfaces) instead of 127.0.0.1
# RUN find /usr/local/share/pnpm -path "*/@trillionclues/contour/dist/*" -name "*.js" -exec sed -i "s/'127.0.0.1'/'0.0.0.0'/g" {} +

USER node
COPY --chown=node:node spec.yaml ./spec.yaml

EXPOSE 3001
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/_contour/health || exit 1

CMD ["contour", "start", "spec.yaml", "--port", "3001"]
