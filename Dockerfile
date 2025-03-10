# Use Node.js LTS as the base image
FROM node:18-alpine AS base

# Create a stage for dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Create a stage for building the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG GIT_COMMIT_HASH
ENV NEXT_PUBLIC_GIT_COMMIT_HASH=$GIT_COMMIT_HASH

# Build the Next.js application
RUN npm run build

# Create the production image
FROM base AS runner
WORKDIR /app

# Install curl for healthchecks
RUN apk --no-cache add curl

# Set to production environment
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy only the necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app will run on
EXPOSE 3000

# Set the command to run the app
CMD ["node", "server.js"]