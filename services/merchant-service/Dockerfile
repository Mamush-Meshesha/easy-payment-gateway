FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations (if any) and package.json
COPY packages/ ./packages/
COPY services/merchant-service/package*.json ./services/merchant-service/

WORKDIR /app/services/merchant-service
RUN npm config set registry https://registry.npmjs.org/ && npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retries 5 && npm install --no-audit --no-fund --legacy-peer-deps

WORKDIR /app
COPY . .

WORKDIR /app/services/merchant-service
# Run prisma generate if prisma schema exists
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Build TypeScript
RUN npm run build

# Final runtime image
FROM node:20-alpine
WORKDIR /app/services/merchant-service

# Copy node_modules and src/dist from builder
COPY --from=builder /app/services/merchant-service .

# Copy local packages that are symlinked by npm
COPY --from=builder /app/packages /app/packages

CMD ["npm", "start"]
