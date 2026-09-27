FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations (if any) and package.json
COPY packages/ ./packages/
COPY services/admin-service/package*.json ./services/admin-service/

WORKDIR /app/services/admin-service
RUN npm config set registry https://registry.npmmirror.com && npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retries 5 && npm install --install-links

WORKDIR /app
COPY . .

WORKDIR /app/services/admin-service
# Run prisma generate if prisma schema exists
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Build TypeScript
RUN npm run build

# Final runtime image
FROM node:20-alpine
WORKDIR /app/services/admin-service

# Copy node_modules and src/dist from builder
COPY --from=builder /app/services/admin-service .

# Copy local packages that are symlinked by npm
COPY --from=builder /app/packages /app/packages

CMD ["npm", "start"]
