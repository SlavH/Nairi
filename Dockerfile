FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

CMD ["npm", "start"]
