import { chromium, Browser, Page } from 'playwright';
import { CreatorData, SocialMediaLink, ScrapingResult } from './types';

export class ScrapeSlayer {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH ? '/usr/bin/chromium-browser' : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private normalizeUrl(input: string): string {
    // Handle username only
    if (!input.includes('/')) {
      return `https://www.twitch.tv/${input}/about`;
    }
    
    // Handle full URL
    if (input.includes('twitch.tv')) {
      // Ensure it ends with /about
      if (!input.includes('/about')) {
        const baseUrl = input.replace(/\/$/, '');
        return `${baseUrl}/about`;
      }
      return input;
    }
    
    throw new Error(`Invalid input: ${input}. Expected username or Twitch URL.`);
  }

  async scrapeCreator(input: string): Promise<ScrapingResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();
    
    try {
      const url = this.normalizeUrl(input);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for the about section to load
      await page.waitForSelector('[data-test-selector="about-panel"]', { timeout: 10000 }).catch(() => {
        // Fallback selector if the main one doesn't exist
        return page.waitForSelector('main', { timeout: 5000 });
      });

      const creatorData = await this.extractCreatorData(page);
      
      return {
        success: true,
        data: creatorData,
        url
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        url: input
      };
    } finally {
      await page.close();
    }
  }

  private async extractCreatorData(page: Page): Promise<CreatorData> {
    return await page.evaluate(() => {
      interface SocialMediaLink {
        platform: string;
        url: string;
        label?: string;
      }

      // Helper function to extract text content safely
      const getText = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };

      // Helper function to extract all links matching a pattern
      const getLinks = (selector: string): SocialMediaLink[] => {
        const links = Array.from(document.querySelectorAll(selector));
        return links.map(link => {
          const anchor = link as HTMLAnchorElement;
          const url = anchor.href;
          const label = anchor.textContent?.trim() || '';
          
          // Determine platform from URL
          let platform = 'other';
          if (url.includes('youtube.com')) platform = 'youtube';
          else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'twitter';
          else if (url.includes('instagram.com')) platform = 'instagram';
          else if (url.includes('tiktok.com')) platform = 'tiktok';
          else if (url.includes('discord.gg') || url.includes('discord.com')) platform = 'discord';
          else if (url.includes('steamcommunity.com')) platform = 'steam';
          else if (url.includes('github.com')) platform = 'github';
          
          return { platform, url, label };
        }).filter(link => link.url && !link.url.includes('twitch.tv'));
      };

      // Extract basic info
      const username = window.location.pathname.split('/')[1] || '';
      const displayName = getText('h1') || username;
      
      // Extract followers count - try multiple selectors
      let followersText = getText('[data-test-selector="followers-count"]');
      if (!followersText) {
        const followersElements = Array.from(document.querySelectorAll('*')).find((el: Element) => 
          el.textContent?.includes('followers')
        );
        followersText = followersElements?.textContent || '';
      }
      const followers = followersText.replace(/[^0-9.KM]/g, '');

      // Extract description - try multiple selectors
      let description = getText('[data-test-selector="about-panel"] p');
      if (!description) {
        description = getText('p');
      }

      // Extract social media links from the about section
      const socialMediaLinks = getLinks('a[href*="youtube.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="instagram.com"], a[href*="tiktok.com"], a[href*="discord"], a[href*="steamcommunity.com"]');
      
      // Extract additional links (websites, stores, etc.)
      const additionalLinks = getLinks('a').filter(link => 
        !socialMediaLinks.some(social => social.url === link.url) &&
        !link.url.includes('twitch.tv') &&
        (link.url.includes('http') || link.url.includes('https'))
      );

      // Look for email in text content
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const pageText = document.body.textContent || '';
      const emailMatch = pageText.match(emailRegex);
      const email = emailMatch ? emailMatch[0] : undefined;

      // Check if verified
      const verified = !!document.querySelector('[data-test-selector="verified-badge"]') ||
                      !!document.querySelector('img[alt*="Verified"]') ||
                      (document.body.textContent?.includes('Verified Partner')) || false;

      // Extract team info
      const teamElement = document.querySelector('a[href*="/team/"]');
      const team = teamElement?.textContent?.trim();

      return {
        username,
        displayName,
        followers,
        description,
        socialMediaLinks,
        email,
        additionalLinks,
        team,
        verified
      };
    });
  }
}