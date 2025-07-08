import { chromium, Browser, Page } from 'playwright';
import { CreatorData, YouTubeCreatorData, SocialMediaLink, ScrapingResult } from './types';

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

  private normalizeUrl(input: string, platform: 'twitch' | 'youtube' = 'twitch'): string {
    if (platform === 'twitch') {
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
    } else if (platform === 'youtube') {
      // Handle username only
      if (!input.includes('/')) {
        return `https://www.youtube.com/@${input}/about`;
      }
      
      // Handle various YouTube URL formats
      if (input.includes('youtube.com')) {
        let baseUrl = input;
        
        // Convert old channel URLs to new format
        if (input.includes('/channel/') || input.includes('/c/') || input.includes('/user/')) {
          // For these cases, we'll try to navigate and let YouTube redirect
          baseUrl = input.replace(/\/(about)?$/, '');
          return `${baseUrl}/about`;
        }
        
        // Handle @username format
        if (input.includes('/@')) {
          baseUrl = input.replace(/\/(about)?$/, '');
          return `${baseUrl}/about`;
        }
        
        // Handle direct channel links
        if (!input.includes('/about')) {
          baseUrl = input.replace(/\/$/, '');
          return `${baseUrl}/about`;
        }
        
        return input;
      }
      
      throw new Error(`Invalid input: ${input}. Expected username or YouTube URL.`);
    }
    
    throw new Error(`Unsupported platform: ${platform}`);
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

  async scrapeYouTubeCreator(input: string): Promise<ScrapingResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();
    
    try {
      const url = this.normalizeUrl(input, 'youtube');
      
      // Set user agent to avoid bot detection
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for the page to load - YouTube has dynamic content
      await page.waitForTimeout(5000);
      
      // Try multiple selectors to ensure page is loaded
      try {
        await page.waitForSelector('ytd-app', { timeout: 15000 });
      } catch {
        // Fallback - just wait a bit more
        await page.waitForTimeout(3000);
      }

      const creatorData = await this.extractYouTubeCreatorData(page);
      
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

  private async extractYouTubeCreatorData(page: Page): Promise<YouTubeCreatorData> {
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
          let url = anchor.href;
          
          // Handle YouTube redirect URLs
          if (url.includes('youtube.com/redirect')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const redirectUrl = urlParams.get('q');
            if (redirectUrl) {
              url = decodeURIComponent(redirectUrl);
            }
          }
          
          const label = anchor.textContent?.trim() || '';
          
          // Determine platform from URL
          let platform = 'other';
          if (url.includes('twitch.tv')) platform = 'twitch';
          else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'twitter';
          else if (url.includes('instagram.com')) platform = 'instagram';
          else if (url.includes('tiktok.com')) platform = 'tiktok';
          else if (url.includes('discord.gg') || url.includes('discord.com')) platform = 'discord';
          else if (url.includes('steamcommunity.com')) platform = 'steam';
          else if (url.includes('github.com')) platform = 'github';
          else if (url.includes('facebook.com')) platform = 'facebook';
          
          return { platform, url, label };
        }).filter(link => link.url && !link.url.includes('youtube.com') && link.url.startsWith('http'));
      };

      // Extract basic info
      const username = window.location.pathname.split('/')[1]?.replace('@', '') || '';
      
      // Try multiple selectors for display name
      let displayName = '';
      const nameSelectors = [
        'h1',
        '[class*="channel-name"]',
        'yt-formatted-string#text',
        '#channel-name #text',
        '.ytd-channel-name #text'
      ];
      
      for (const selector of nameSelectors) {
        displayName = getText(selector);
        if (displayName) break;
      }
      
      if (!displayName) displayName = username;
      
      // Extract subscriber count
      let subscribers = '';
      const subscriberElements = Array.from(document.querySelectorAll('*')).find((el: Element) => 
        el.textContent?.includes('subscribers') || el.textContent?.includes('subscriber')
      );
      if (subscriberElements) {
        const match = subscriberElements.textContent?.match(/([0-9.KM]+)\s*subscribers?/i);
        subscribers = match ? match[1] : '';
      }

      // Extract video count
      let videoCount = '';
      const videoElements = Array.from(document.querySelectorAll('*')).find((el: Element) => 
        el.textContent?.includes('videos') && el.textContent?.match(/[0-9,]+\s*videos/i)
      );
      if (videoElements) {
        const match = videoElements.textContent?.match(/([0-9,]+)\s*videos/i);
        videoCount = match ? match[1] : '';
      }

      // Extract view count
      let viewCount = '';
      const viewElements = Array.from(document.querySelectorAll('*')).find((el: Element) => 
        el.textContent?.includes('views') && el.textContent?.match(/[0-9,]+\s*views/i)
      );
      if (viewElements) {
        const match = viewElements.textContent?.match(/([0-9,]+)\s*views/i);
        viewCount = match ? match[1] : '';
      }

      // Extract join date
      let joinDate = '';
      const joinElements = Array.from(document.querySelectorAll('*')).find((el: Element) => 
        el.textContent?.includes('Joined') && el.textContent?.match(/Joined\s+.+/i)
      );
      if (joinElements) {
        const match = joinElements.textContent?.match(/Joined\s+(.+)/i);
        joinDate = match ? match[1] : '';
      }

      // Extract country
      let country = '';
      const countryElements = Array.from(document.querySelectorAll('*')).find((el: Element) => {
        const text = el.textContent?.trim() || '';
        // Look for common country names in the about section
        const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia', 'Brazil', 'Mexico', 'India', 'China', 'Russia', 'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Spain', 'Italy', 'Poland', 'Czech Republic', 'Austria', 'Switzerland', 'Belgium'];
        return countries.some(c => text === c);
      });
      country = countryElements?.textContent?.trim() || '';

      // Extract description
      let description = getText('[class*="description"]') || getText('meta[name="description"]');
      if (!description) {
        // Look for description in the about dialog
        const descElements = Array.from(document.querySelectorAll('*')).find((el: Element) => {
          const text = el.textContent?.trim() || '';
          return text.length > 20 && text.length < 500 && !text.includes('subscribers') && !text.includes('views');
        });
        description = descElements?.textContent?.trim() || '';
      }

      // Extract social media links - look in the about dialog
      const socialMediaLinks = getLinks('a[href*="twitch.tv"], a[href*="twitter.com"], a[href*="x.com"], a[href*="instagram.com"], a[href*="tiktok.com"], a[href*="discord"], a[href*="steamcommunity.com"], a[href*="facebook.com"]');
      
      // Extract additional links (websites, stores, etc.)
      const additionalLinks = getLinks('a').filter(link => 
        !socialMediaLinks.some(social => social.url === link.url) &&
        !link.url.includes('youtube.com') &&
        link.url.startsWith('http') &&
        !link.url.includes('google.com') &&
        !link.url.includes('accounts.google.com')
      );

      // Look for email in text content
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const pageText = document.body.textContent || '';
      const emailMatch = pageText.match(emailRegex);
      const email = emailMatch ? emailMatch.find(e => !e.includes('noreply') && !e.includes('youtube.com')) : undefined;

      // Check if verified
      const verified = !!document.querySelector('[title*="Verified"]') ||
                      !!document.querySelector('img[alt*="Verified"]') ||
                      !!document.querySelector('[aria-label*="Verified"]') ||
                      (document.body.textContent?.includes('verified')) || false;

      return {
        username,
        displayName,
        subscribers,
        videoCount,
        viewCount,
        joinDate,
        country,
        description,
        socialMediaLinks,
        email,
        additionalLinks,
        verified
      };
    });
  }
}