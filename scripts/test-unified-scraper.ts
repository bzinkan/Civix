import 'dotenv/config';
import {
  scrapeJurisdiction,
  scrapeTOC,
  getKnownSource,
  getSourceUrl,
  getSupportedJurisdictions,
} from '../lib/scrapers/unified-scraper';

async function testUnifiedScraper() {
  console.log('='.repeat(60));
  console.log('Testing Unified Scraper');
  console.log('='.repeat(60));

  // Show all supported jurisdictions
  console.log('\n1. Supported Jurisdictions:');
  const supported = getSupportedJurisdictions();
  const bySource: Record<string, string[]> = {};

  for (const j of supported) {
    if (!bySource[j.source]) bySource[j.source] = [];
    bySource[j.source].push(j.id);
  }

  for (const [source, ids] of Object.entries(bySource)) {
    console.log(`\n  ${source.toUpperCase()}: ${ids.length} cities`);
    ids.slice(0, 3).forEach((id) => console.log(`    - ${id}`));
    if (ids.length > 3) console.log(`    ... and ${ids.length - 3} more`);
  }

  // Test TOC scrape for cities (most are AmLegal now)
  const testCities = [
    'cincinnati-oh',    // Municode
    'covington-ky',     // AmLegal - KY
    'blue-ash-oh',      // AmLegal - OH
    'mason-oh',         // AmLegal - OH
  ];

  console.log('\n\n2. Testing TOC Scrapes:');
  console.log('-'.repeat(40));

  for (const city of testCities) {
    const source = getKnownSource(city);
    const url = getSourceUrl(city);

    console.log(`\n  ${city}:`);
    console.log(`    Source: ${source}`);
    console.log(`    URL: ${url || 'unknown'}`);

    try {
      const { chapters } = await scrapeTOC(city);
      console.log(`    Chapters: ${chapters.length}`);
      console.log(`    Relevant: ${chapters.filter((c) => c.isRelevant).length}`);

      // Show first 3 relevant chapters
      const relevant = chapters.filter((c) => c.isRelevant).slice(0, 3);
      if (relevant.length > 0) {
        console.log('    Sample chapters:');
        relevant.forEach((ch) => console.log(`      - ${ch.title.substring(0, 50)}`));
      }
    } catch (error: any) {
      console.log(`    ERROR: ${error.message}`);
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

testUnifiedScraper().catch(console.error);
