# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY styles ./styles
COPY components.json ./components.json
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY next-env.d.ts ./
RUN pnpm build

FROM base AS runner
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
WORKDIR /app
ENV PORT=3000 \
    HOST=0.0.0.0 \
    HOSTNAME=0.0.0.0 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN corepack enable
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "start"]
