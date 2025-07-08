export interface SocialMediaLink {
  platform: string;
  url: string;
  label?: string;
}

export interface CreatorData {
  username: string;
  displayName: string;
  description: string;
  socialMediaLinks: SocialMediaLink[];
  email?: string;
  additionalLinks: SocialMediaLink[];
  team?: string;
  verified: boolean;
  error?: string;
}

export interface YouTubeCreatorData extends Omit<CreatorData, 'team'> {
  subscribers: string;
  videoCount: string;
  viewCount: string;
  joinDate: string;
  country?: string;
}

export interface ScrapingResult {
  success: boolean;
  data?: CreatorData | YouTubeCreatorData;
  error?: string;
  url: string;
}

export interface BatchResult {
  results: ScrapingResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export type OutputFormat = 'json' | 'markdown';