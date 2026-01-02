import 'dotenv/config';
import { scrapeUrlWithRetry } from '../lib/scrapers/scrapingbee-client';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const url = process.argv[2];

if (!url) {
  console.log('Usage: npx tsx scripts/scrape-single-city.ts <url>');
  process.exit(1);
}

async function scrape() {
  console.log('Scraping:', url);

  const result = await scrapeUrlWithRetry(url, {
    renderJs: true,
    wait: 5000,
    blockResources: false,
    premiumProxy: false,
  });

  if (!result.success) {
    console.log('Failed:', result.error);
    process.exit(1);
  }

  console.log('\nSuccess! HTML length:', result.html?.length);

  // Save raw HTML
  fs.writeFileSync('C:/Users/zinka/Documents/Civix/temp-scrape.html', result.html || '');
  console.log('Saved raw HTML to temp-scrape.html');

  // Parse and analyze
  const $ = cheerio.load(result.html || '');
  $('style, script, noscript').remove();

  // Look for TOC/navigation structure
  console.log('\n=== Page Title ===');
  console.log($('title').text());

  console.log('\n=== Main Content Areas ===');
  const selectors = ['.toc', '.nav-tree', '.tree', '#tree', '.sidebar', '.menu', 'nav'];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      console.log(`Found ${sel}: ${el.length} elements`);
    }
  }

  console.log('\n=== Links with "Title" or "Chapter" ===');
  $('a').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && (text.includes('Title') || text.includes('Chapter') || text.includes('TITLE') || text.includes('CHAPTER'))) {
      console.log(`  ${text.substring(0, 60)} -> ${href?.substring(0, 50) || 'no href'}`);
    }
  });

  console.log('\n=== Body Text Preview (first 3000 chars) ===');
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  console.log(bodyText.substring(0, 3000));
}

scrape();
