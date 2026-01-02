import 'dotenv/config';
import { scrapeTOC, scrapeChapter } from '../lib/scrapers/municode';
import { getCredits } from '../lib/scrapers/scrapingbee-client';

async function test() {
  console.log('='.repeat(60));
  console.log('Testing ScrapingBee Integration');
  console.log('='.repeat(60));

  // Check credits first
  console.log('\n1. Checking ScrapingBee credits...');
  const credits = await getCredits();
  console.log('Credits:', credits);

  // Test TOC scraping for Cincinnati
  console.log('\n2. Testing TOC scrape for cincinnati-oh...');
  try {
    const toc = await scrapeTOC('cincinnati-oh');
    console.log(`Found ${toc.length} chapters`);
    console.log('Relevant chapters:');
    toc.filter(ch => ch.isRelevant).forEach(ch => {
      console.log(`  - ${ch.title}`);
    });
  } catch (error: any) {
    console.error('TOC scrape failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

test().catch(console.error);
