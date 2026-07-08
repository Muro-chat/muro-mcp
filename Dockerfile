# Runs the muro MCP stdio bridge. The actual MCP server is hosted at
# https://muro.chat/api/mcp; this container just bridges stdio <-> HTTP.
#   docker build -t muro-mcp .
#   docker run -i -e MURO_API_KEY=mr_live_... muro-mcp
FROM node:20-alpine
WORKDIR /app
COPY package.json index.js ./
RUN npm install --omit=dev --no-audit --no-fund
ENTRYPOINT ["node", "/app/index.js"]
