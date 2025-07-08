import { CreatorData, YouTubeCreatorData, ScrapingResult, BatchResult, SocialMediaLink } from './types';

export class OutputFormatter {
  static formatAsJson(result: ScrapingResult | BatchResult): string {
    return JSON.stringify(result, null, 2);
  }

  static formatAsMarkdown(result: ScrapingResult | BatchResult): string {
    if ('results' in result) {
      return this.formatBatchAsMarkdown(result);
    } else {
      return this.formatSingleAsMarkdown(result);
    }
  }

  private static formatSingleAsMarkdown(result: ScrapingResult): string {
    if (!result.success || !result.data) {
      return `# Error\n\n**URL**: ${result.url}\n**Error**: ${result.error}\n`;
    }

    const data = result.data;
    const isYouTube = 'subscribers' in data;
    let markdown = `# ${data.displayName}\n\n`;
    
    if (data.verified) {
      markdown += `**Status**: Verified ${isYouTube ? 'Channel' : 'Partner'} ✓\n`;
    }
    
    if (isYouTube) {
      const youtubeData = data as YouTubeCreatorData;
      if (youtubeData.subscribers) {
        markdown += `**Subscribers**: ${youtubeData.subscribers}\n`;
      }
      if (youtubeData.videoCount) {
        markdown += `**Videos**: ${youtubeData.videoCount}\n`;
      }
      if (youtubeData.viewCount) {
        markdown += `**Total Views**: ${youtubeData.viewCount}\n`;
      }
      if (youtubeData.joinDate) {
        markdown += `**Joined**: ${youtubeData.joinDate}\n`;
      }
      if (youtubeData.country) {
        markdown += `**Country**: ${youtubeData.country}\n`;
      }
    } else {
      const twitchData = data as CreatorData;
      if (twitchData.followers) {
        markdown += `**Followers**: ${twitchData.followers}\n`;
      }
      if (twitchData.team) {
        markdown += `**Team**: ${twitchData.team}\n`;
      }
    }
    
    if (data.description) {
      markdown += `**Description**: ${data.description}\n`;
    }
    
    if (isYouTube) {
      markdown += `\n**YouTube**: https://www.youtube.com/@${data.username}\n\n`;
    } else {
      markdown += `\n**Twitch**: https://www.twitch.tv/${data.username}\n\n`;
    }

    if (data.socialMediaLinks.length > 0) {
      markdown += `## Social Media Links\n\n`;
      data.socialMediaLinks.forEach(link => {
        const platformName = this.capitalizePlatform(link.platform);
        const label = link.label || platformName;
        markdown += `- **${platformName}**: [${label}](${link.url})\n`;
      });
      markdown += '\n';
    }

    if (data.additionalLinks.length > 0) {
      markdown += `## Additional Links\n\n`;
      data.additionalLinks.forEach(link => {
        const label = link.label || link.url;
        markdown += `- [${label}](${link.url})\n`;
      });
      markdown += '\n';
    }

    if (data.email) {
      markdown += `## Contact\n\n**Email**: ${data.email}\n\n`;
    }

    return markdown;
  }

  private static formatBatchAsMarkdown(result: BatchResult): string {
    let markdown = `# Creator Social Media Report\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Creators**: ${result.summary.total}\n`;
    markdown += `- **Successfully Scraped**: ${result.summary.successful}\n`;
    markdown += `- **Failed**: ${result.summary.failed}\n\n`;

    if (result.summary.failed > 0) {
      const failedResults = result.results.filter(r => !r.success);
      markdown += `## Failed Scrapes\n\n`;
      failedResults.forEach(failed => {
        markdown += `- **${failed.url}**: ${failed.error}\n`;
      });
      markdown += '\n';
    }

    const successfulResults = result.results.filter(r => r.success && r.data);
    if (successfulResults.length > 0) {
      markdown += `## Creator Details\n\n`;
      successfulResults.forEach((result, index) => {
        if (index > 0) markdown += '---\n\n';
        markdown += this.formatSingleAsMarkdown(result);
      });
    }

    return markdown;
  }

  private static capitalizePlatform(platform: string): string {
    const platformMap: { [key: string]: string } = {
      'youtube': 'YouTube',
      'twitter': 'Twitter',
      'instagram': 'Instagram',
      'tiktok': 'TikTok',
      'discord': 'Discord',
      'steam': 'Steam',
      'github': 'GitHub',
      'twitch': 'Twitch',
      'facebook': 'Facebook'
    };
    
    return platformMap[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  }
}