# syntax=docker/dockerfile:1

FROM oven/bun:1.3.13 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.13-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && npm install --global @sern/cli \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

CMD ["sh", "-c", "bun run db:gen && bun run db:push && exec bun run start"]