FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=512"
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=256"
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/opencode.json ./
COPY --from=builder /app/scripts ./scripts

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
