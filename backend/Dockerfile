# Build stage: compile TypeScript
#
# NODE_ENV is pinned to development here on purpose. Hosts (Railway, Render)
# inject their service variables into the BUILD as well as the run, and under
# NODE_ENV=production `npm ci` silently skips devDependencies — which is where
# typescript and @types/* live.
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --include=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Fail here with a readable message rather than at the COPY below. A tsconfig
# that emits nothing (an inherited "noEmit", a bad "include") leaves dist/
# missing, and the runtime stage then dies with the far more cryptic
# "failed to compute cache key: /app/dist: not found".
RUN test -f dist/server.js || { \
      echo "ERROR: tsc completed but produced no dist/server.js."; \
      echo "Check outDir/rootDir/include in backend/tsconfig.json, and that"; \
      echo "nothing it extends turns on noEmit."; \
      exit 1; \
    }
RUN npm prune --omit=dev

# Runtime stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Hosts inject PORT; the app reads it from the environment (defaults to 3001)
EXPOSE 3001
CMD ["node", "dist/server.js"]
