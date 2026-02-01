FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Use npm install: frontend may not have its own package-lock.json in a workspace monorepo
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Клиенту — пустые = относительные URL (/api-focus, /api-kids). Прокси — на сервисы Docker.
ARG NEXT_PUBLIC_FOCUS_API_URL=
ARG NEXT_PUBLIC_KIDS_API_URL=
ARG REWRITE_FOCUS_URL=http://focus-service:3000
ARG REWRITE_KIDS_URL=http://focus-kids-service:8000
ARG NEXT_PUBLIC_TELEGRAM_BOT_NAME
ENV NEXT_PUBLIC_FOCUS_API_URL=$NEXT_PUBLIC_FOCUS_API_URL
ENV NEXT_PUBLIC_KIDS_API_URL=$NEXT_PUBLIC_KIDS_API_URL
ENV REWRITE_FOCUS_URL=$REWRITE_FOCUS_URL
ENV REWRITE_KIDS_URL=$REWRITE_KIDS_URL
ENV NEXT_PUBLIC_TELEGRAM_BOT_NAME=$NEXT_PUBLIC_TELEGRAM_BOT_NAME
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Next.js standalone expects public; ensure it exists in builder (frontend/public/.gitkeep)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
