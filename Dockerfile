# Undox public demo — API + fixtures + MCP in one process (UI on Vercel web/)
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
# Overridden at runtime; required for MCP
ENV UNDOX_MCP_TOKEN=changeme
ENV UNDOX_SESSION_STORE=/data/.undox-session-state.json

# Seed is committed (deploy/seed-sessions.json); do not regenerate from local .undox-session-state.json
RUN mkdir -p /data && cp deploy/seed-sessions.json /data/.undox-session-state.json

EXPOSE 8080

CMD ["node", "--import", "tsx", "scripts/serve-public.ts"]
