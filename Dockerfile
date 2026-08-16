# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# better-sqlite3 ships prebuilt binaries for most platforms, but these let it
# fall back to compiling from source when no prebuilt matches the host arch.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci

COPY client client
COPY server server
RUN npm run build

# Drop dev-only deps (typescript, vite, tsx, @types/*) before shipping.
RUN npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/client/dist client/dist

# SQLite data and uploaded files live here - mount volumes over just these
# two directories (not the whole server/ dir) so code updates from a fresh
# image aren't shadowed by old persisted volume content on rebuild.
RUN mkdir -p server/uploads server/data && chown -R node:node /app
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/index.js"]
