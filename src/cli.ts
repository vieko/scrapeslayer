#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { ScrapeSlayer } from './scraper';
import { BatchProcessor } from './batch-processor';
import { OutputFormatter } from './formatters';
import { OutputFormat } from './types';

const program = new Command();

program
  .name('scrapeslayer')
  .description('ScrapeSlayer - Advanced social media scraping tool for Twitch creator pages')
  .version('1.0.0');

program
  .argument('[input]', 'Twitch username or URL to scrape')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'json')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('-b, --batch <creators>', 'Comma-separated list of creators')
  .option('--file <path>', 'File containing list of creators (one per line)')
  .action(async (input: string | undefined, options) => {
    const format = options.format as OutputFormat;
    
    if (!['json', 'markdown'].includes(format)) {
      console.error('Error: Format must be either "json" or "markdown"');
      process.exit(1);
    }

    // Validate input
    const hasInput = !!input;
    const hasBatch = !!options.batch;
    const hasFile = !!options.file;
    
    const inputCount = [hasInput, hasBatch, hasFile].filter(Boolean).length;
    
    if (inputCount === 0) {
      console.error('Error: Must provide either a creator input, --batch, or --file option');
      process.exit(1);
    }
    
    if (inputCount > 1) {
      console.error('Error: Cannot use multiple input methods simultaneously');
      process.exit(1);
    }

    const scraper = new ScrapeSlayer();
    
    try {
      await scraper.initialize();
      
      let output: string;
      
      if (hasInput) {
        // Single creator mode
        console.error(`Scraping: ${input}`);
        const result = await scraper.scrapeCreator(input!);
        
        if (result.success) {
          console.error(`✓ Successfully scraped: ${result.data?.displayName || input}`);
        } else {
          console.error(`✗ Failed to scrape: ${input} - ${result.error}`);
        }
        
        output = format === 'json' 
          ? OutputFormatter.formatAsJson(result)
          : OutputFormatter.formatAsMarkdown(result);
          
      } else {
        // Batch mode
        const batchProcessor = new BatchProcessor(scraper);
        
        const batchResult = hasFile 
          ? await batchProcessor.processFromFile(options.file!)
          : await batchProcessor.processFromString(options.batch!);
        
        output = format === 'json'
          ? OutputFormatter.formatAsJson(batchResult)
          : OutputFormatter.formatAsMarkdown(batchResult);
      }
      
      // Output results
      if (options.output) {
        await fs.writeFile(options.output, output, 'utf-8');
        console.error(`Results written to: ${options.output}`);
      } else {
        console.log(output);
      }
      
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
      process.exit(1);
    } finally {
      await scraper.close();
    }
  });

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

program.parse();