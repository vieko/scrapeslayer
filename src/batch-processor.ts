import { promises as fs } from 'fs';
import { ScrapeSlayer } from './scraper';
import { BatchResult, ScrapingResult } from './types';

export class BatchProcessor {
  private scraper: ScrapeSlayer;

  constructor(scraper: ScrapeSlayer) {
    this.scraper = scraper;
  }

  async processFromFile(filePath: string): Promise<BatchResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const inputs = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
      
      return await this.processBatch(inputs);
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processFromString(batchString: string): Promise<BatchResult> {
    const inputs = batchString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return await this.processBatch(inputs);
  }

  private async processBatch(inputs: string[]): Promise<BatchResult> {
    const results: ScrapingResult[] = [];
    let successful = 0;
    let failed = 0;

    console.error(`Processing ${inputs.length} creators...`);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      console.error(`[${i + 1}/${inputs.length}] Processing: ${input}`);
      
      try {
        const result = await this.scraper.scrapeCreator(input);
        results.push(result);
        
        if (result.success) {
          successful++;
          console.error(`✓ Successfully scraped: ${result.data?.displayName || input}`);
        } else {
          failed++;
          console.error(`✗ Failed to scrape: ${input} - ${result.error}`);
        }
      } catch (error) {
        failed++;
        const errorResult: ScrapingResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          url: input
        };
        results.push(errorResult);
        console.error(`✗ Error processing: ${input} - ${errorResult.error}`);
      }

      // Add a small delay between requests to be respectful
      if (i < inputs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.error(`\nCompleted: ${successful} successful, ${failed} failed`);

    return {
      results,
      summary: {
        total: inputs.length,
        successful,
        failed
      }
    };
  }
}