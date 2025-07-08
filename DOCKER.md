# Docker Configuration

This project includes two Docker configurations:

## Dockerfile (Default)
- **Base**: `node:18-bullseye-slim` (Debian-based)
- **Browser**: Downloads Playwright Chromium via `npx playwright install`
- **Size**: Larger (~500MB+)
- **Compatibility**: Better compatibility with Playwright features
- **Use case**: Development and full feature support

## Dockerfile.simple
- **Base**: `node:18-alpine` (Alpine Linux)
- **Browser**: Uses system Chromium package
- **Size**: Smaller (~200MB)
- **Compatibility**: Basic Chromium functionality
- **Use case**: Production deployments where size matters

## Building

```bash
# Default Dockerfile
docker build -t scrapeslayer .

# Simple/Alpine version
docker build -f Dockerfile.simple -t scrapeslayer:alpine .
```

## Running

```bash
docker run -v $(pwd)/output:/output scrapeslayer [options]
```