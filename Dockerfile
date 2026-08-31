FROM node:24.19.0-bookworm-slim AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

FROM node:24.19.0-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HEALTH_ENABLED=true \
    HEALTH_HOST=0.0.0.0 \
    HEALTH_PORT=3000 \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    BOT_SESSION_DIR=/app/BotSession \
    SUBBOT_SESSION_DIR=/app/jadibot \
    TMP_DIR=/app/tmp \
    BACKUP_DIR=/app/backups \
    DATA_DIR=/app/data

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ffmpeg tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p BotSession jadibot tmp backups data \
    && chown -R node:node BotSession jadibot tmp backups data

USER node
EXPOSE 3000
VOLUME ["/app/BotSession", "/app/jadibot", "/app/backups", "/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.HEALTH_PORT||3000)+'/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--max-old-space-size=512", "index.js"]
