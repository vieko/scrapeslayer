# ScrapeSlayer

A TypeScript CLI tool that scrapes social media links and contact information from Twitch and YouTube creator pages using Playwright. Designed to run in Docker for cross-platform compatibility.

## Features

- 🎯 **Multi-Platform Scraping**: Scrape Twitch and YouTube creators by username or URL
- 📦 **Batch Processing**: Process multiple Twitch creators from comma-separated list or file
- 📄 **Multiple Output Formats**: JSON and Markdown output formats
- 🐳 **Docker Support**: Runs in Docker for consistent cross-platform behavior
- 📁 **File I/O**: Output to files or stdout for piping
- 🛡️ **Error Handling**: Continues processing on failures, reports errors clearly
- ⏱️ **Rate Limiting**: Built-in delays between requests to be respectful

## Installation

### Docker (Recommended)

```bash
# Build the Docker image
docker build -t scrapeslayer .

# Or pull from registry (if published)
# docker pull your-registry/scrapeslayer
```

### Local Development

```bash
npm install
npm run build
```

## Usage

### Docker Usage

#### Twitch Creators
```bash
# By username
docker run scrapeslayer twitch cohhcarnage --format json

# By URL
docker run scrapeslayer twitch "https://twitch.tv/seum/about" --format markdown

# Output to file (using volume mount)
docker run -v $(pwd):/output scrapeslayer twitch cohhcarnage --format markdown --output /output/report.md
```

#### YouTube Creators
```bash
# By username
docker run scrapeslayer youtube @MrBeast --format json

# By URL
docker run scrapeslayer youtube "https://youtube.com/@MrBeast/about" --format markdown

# Output to file (using volume mount)
docker run -v $(pwd):/output scrapeslayer youtube @MrBeast --format json --output /output/youtube-report.json
```

#### Batch Processing (Twitch Only)
```bash
# Comma-separated list
docker run scrapeslayer twitch --batch "cohhcarnage,seum,ninja" --format json

# From file (using volume mount)
docker run -v $(pwd):/output scrapeslayer twitch --file /output/creators.txt --format markdown --output /output/batch-report.md
```

### Local Usage

#### Twitch Creators
```bash
# Single creator
npm run dev -- twitch cohhcarnage --format json
npm run dev -- twitch "https://twitch.tv/seum/about" --format markdown

# Batch processing
npm run dev -- twitch --batch "cohhcarnage,seum" --format json
npm run dev -- twitch --file creators.txt --format markdown --output report.md
```

#### YouTube Creators
```bash
# Single creator
npm run dev -- youtube @MrBeast --format json
npm run dev -- youtube "https://youtube.com/@MrBeast/about" --format markdown

# Output to file
npm run dev -- youtube @MrBeast --format json --output youtube-report.json
```

## CLI Options

### Main Command
```
Usage: scrapeslayer [options] [command]

ScrapeSlayer - Advanced social media scraping tool for Twitch and YouTube creator pages

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  twitch [options] [input]   Scrape Twitch creator pages
  youtube [options] [input]  Scrape YouTube creator pages
  help [command]             display help for command
```

### Twitch Command
```
Usage: scrapeslayer twitch [options] [input]

Scrape Twitch creator pages

Arguments:
  input                   Twitch username or URL to scrape

Options:
  -f, --format <format>   Output format (json|markdown) (default: "json")
  -o, --output <file>     Output file (default: stdout)
  -b, --batch <creators>  Comma-separated list of creators
  --file <path>           File containing list of creators (one per line)
  -h, --help              display help for command
```

### YouTube Command
```
Usage: scrapeslayer youtube [options] [input]

Scrape YouTube creator pages

Arguments:
  input                    YouTube username or URL to scrape

Options:
  -f, --format <format>   Output format (json|markdown) (default: "json")
  -o, --output <file>     Output file (default: stdout)
  -h, --help              display help for command
```

**Note**: Batch processing is currently only available for Twitch creators.

## Input Formats

### Twitch Creators
- **Username**: `cohhcarnage`
- **Full URL**: `https://www.twitch.tv/cohhcarnage/about`
- **Short URL**: `http://twitch.tv/seum/about`

### YouTube Creators
- **Username with @**: `@MrBeast`
- **Username without @**: `MrBeast`
- **Full URL**: `https://www.youtube.com/@MrBeast/about`
- **Channel URL**: `https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA/about`
- **Custom URL**: `https://www.youtube.com/c/MrBeast/about`
- **User URL**: `https://www.youtube.com/user/MrBeast6000/about`

### Batch File Format (Twitch Only)
Create a text file with one creator per line:
```
cohhcarnage
seum
https://twitch.tv/ninja/about
shroud
# This is a comment and will be ignored
```

## Output Formats

### Twitch JSON Output
```json
{
  "success": true,
  "data": {
    "username": "cohhcarnage",
    "displayName": "CohhCarnage",
    "description": "Browse",
    "socialMediaLinks": [
      {
        "platform": "youtube",
        "url": "http://www.youtube.com/CohhCarnage",
        "label": ""
      },
      {
        "platform": "twitter",
        "url": "http://www.twitter.com/CohhCarnage",
        "label": ""
      }
    ],
    "email": null,
    "additionalLinks": [
      {
        "platform": "other",
        "url": "https://www.cohhilition.com/",
        "label": "The Cohhilition Website"
      }
    ],
    "team": "Loaded",
    "verified": false
  },
  "url": "https://www.twitch.tv/cohhcarnage/about"
}
```

### YouTube JSON Output
```json
{
  "success": true,
  "data": {
    "username": "MrBeast",
    "displayName": "MrBeast",
    "subscribers": "28.1M",
    "videoCount": "883",
    "viewCount": "75,871,132",
    "joinDate": "19 Feb 2012",
    "country": "United States",
    "description": "SUBSCRIBE FOR A COOKIE!",
    "socialMediaLinks": [
      {
        "platform": "twitter",
        "url": "https://twitter.com/MrBeast",
        "label": "twitter.com/MrBeast"
      },
      {
        "platform": "instagram",
        "url": "https://www.instagram.com/mrbeast/",
        "label": "instagram.com/mrbeast"
      },
      {
        "platform": "facebook",
        "url": "https://facebook.com/mrbeast/",
        "label": "facebook.com/mrbeast"
      }
    ],
    "email": "chucky@mrbeastbusiness.com",
    "additionalLinks": [
      {
        "platform": "other",
        "url": "https://www.beastgames.com",
        "label": "beastgames.com"
      },
      {
        "platform": "other",
        "url": "https://mrbeast.store/",
        "label": "https://mrbeast.store"
      }
    ],
    "verified": true
  },
  "url": "https://www.youtube.com/@MrBeast/about"
}
```

### Twitch Markdown Output
```markdown
# CohhCarnage

**Team**: Loaded
**Description**: Browse

**Twitch**: https://www.twitch.tv/cohhcarnage

## Social Media Links

- **YouTube**: [](http://www.youtube.com/CohhCarnage)
- **Twitter**: [](http://www.twitter.com/CohhCarnage)
- **TikTok**: [](https://www.tiktok.com/@cohhcarnage)

## Additional Links

- [The Cohhilition Website](https://www.cohhilition.com/)
- [](https://lurkit.cc/7DaysCohhcarnage)
```

### YouTube Markdown Output
```markdown
# MrBeast

**Status**: Verified Channel ✓
**Subscribers**: 28.1M
**Videos**: 883
**Total Views**: 75,871,132
**Joined**: 19 Feb 2012
**Country**: United States
**Description**: SUBSCRIBE FOR A COOKIE!

**YouTube**: https://www.youtube.com/@MrBeast

## Social Media Links

- **Twitter**: [twitter.com/MrBeast](https://twitter.com/MrBeast)
- **Instagram**: [instagram.com/mrbeast](https://www.instagram.com/mrbeast/)
- **Facebook**: [facebook.com/mrbeast](https://facebook.com/mrbeast/)

## Additional Links

- [beastgames.com](https://www.beastgames.com)
- [https://mrbeast.store](https://mrbeast.store/)

## Contact

**Email**: chucky@mrbeastbusiness.com
```

## Docker Examples

### Basic Usage
```bash
# Twitch scraping
docker run scrapeslayer twitch cohhcarnage
docker run scrapeslayer twitch seum --format markdown

# YouTube scraping
docker run scrapeslayer youtube @MrBeast
docker run scrapeslayer youtube @MrBeast --format markdown
```

### File Operations
```bash
# Create input file
echo -e "cohhcarnage\\nseum\\nninja" > creators.txt

# Process batch and save to file
docker run -v $(pwd):/output scrapeslayer twitch \\
  --file /output/creators.txt \\
  --format markdown \\
  --output /output/report.md
```

### Pipeline Usage
```bash
# Twitch - Pipe JSON output to jq for processing
docker run scrapeslayer twitch cohhcarnage --format json | jq '.data.socialMediaLinks'
docker run scrapeslayer twitch seum --format json | jq -r '.data.email // "No email found"'

# YouTube - Extract specific data
docker run scrapeslayer youtube @MrBeast --format json | jq '.data.subscribers'
docker run scrapeslayer youtube @MrBeast --format json | jq '.data.socialMediaLinks'
```

## Error Handling

The tool handles various error scenarios gracefully:

- **Invalid URLs/usernames**: Reports clear error messages
- **Network failures**: Retries and reports connection issues
- **Missing pages**: Handles 404s and redirects
- **Batch failures**: Continues processing remaining creators
- **Rate limiting**: Built-in delays between requests

## Development

### Project Structure
```
src/
├── cli.ts              # Main CLI interface
├── scraper.ts          # Core scraping logic
├── batch-processor.ts  # Batch processing functionality
├── formatters.ts       # Output formatting (JSON/Markdown)
└── types.ts           # TypeScript type definitions
```

### Building
```bash
npm run build    # Compile TypeScript
npm run dev      # Run in development mode
```

### Docker Development
```bash
# Build image
docker build -t scrapeslayer .

# Test locally
docker run scrapeslayer --help
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.