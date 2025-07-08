FROM node:18-bullseye-slim

# Install dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Create output directory
RUN mkdir -p /output

# Create a non-root user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app /output

# Switch to non-root user
USER nodejs

# Install Playwright browsers
RUN npx playwright install chromium

# Set the entrypoint
ENTRYPOINT ["node", "dist/cli.js"]