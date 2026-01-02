import 'dotenv/config';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { scrapeUrlWithRetry } from '../lib/scrapers/scrapingbee-client';

const AMLEGAL_BASE = 'https://codelibrary.amlegal.com';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances', 'covington-ky');

// Just test Chapter 127: Short-Term Rentals
const CHAPTER_URL = '/codes/covington/latest/covington_ky/0-0-0-33543';

function cleanSectionContent(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, noscript, nav, header, footer').remove();

  // Try to find main content
  let content = '';

  // Look for specific AmLegal content areas
  const mainContent = $('.chunk, .document-content, article, main').first();
  if (mainContent.length) {
    content = mainContent.text();
  } else {
    content = $('body').text();
  }

  // Clean up
  return content
    .replace(/Powered by Translate.*?language version is the official version of the code\./gs, '')
    .replace(/Skip to.*?content/gi, '')
    .replace(/Created with Sketch/gi, '')
    .replace(/\d{4} S-\d+ \(current\)/gi, '')
    .replace(/Annotations Off|Follow Changes|Share|Download|Bookmark|Print/gi, '')
    .replace(/Disclaimer:.*?800-445-5588\./gs, '')
    .replace(/Hosted by: American Legal Publishing/gi, '')
    .replace(/Back to Code Library/gi, '')
    .replace(/Previous Doc.*?Next Doc/gi, '')
    .replace(/0 items available/gi, '')
    .replace(/Original text.*$/gm, '')
    .replace(/reCAPTCHA.*$/gm, '')
    .replace(/Privacy - Terms/gi, '')
    .replace(/COVINGTON, KENTUCKY CODE OF ORDINANCES.*?PARALLEL REFERENCES/gs, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('Testing Short-Term Rentals chapter scrape...\n');

  // Create output dir
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // First get the chapter TOC
  const fullUrl = `${AMLEGAL_BASE}${CHAPTER_URL}`;
  console.log(`Scraping chapter TOC: ${fullUrl}\n`);

  const tocResult = await scrapeUrlWithRetry(fullUrl, {
    renderJs: true,
    wait: 5000,
    blockResources: false,
  });

  if (!tocResult.success) {
    console.error('Failed to scrape TOC:', tocResult.error);
    return;
  }

  const $ = cheerio.load(tocResult.html || '');

  // Find section links
  const sectionLinks: { text: string; url: string }[] = [];
  const seenUrls = new Set<string>();

  $('a[href*="/codes/covington/"]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();

    // Match section patterns like "§ 127.01" or "127.01"
    if (href && text.match(/^§?\s*\d+\.\d+/)) {
      const baseHref = href.split('#')[0];
      const fullHref = baseHref.startsWith('http') ? baseHref : `${AMLEGAL_BASE}${baseHref}`;

      if (!seenUrls.has(fullHref)) {
        seenUrls.add(fullHref);
        sectionLinks.push({ text, url: fullHref });
      }
    }
  });

  console.log(`Found ${sectionLinks.length} unique sections to scrape\n`);

  // Scrape each section
  let fullText = `# CHAPTER 127: SHORT-TERM RENTALS\n\n`;
  fullText += `**Jurisdiction**: Covington, KY\n`;
  fullText += `**Source**: American Legal Publishing\n`;
  fullText += `**Scraped**: ${new Date().toISOString()}\n\n---\n\n`;

  let totalCredits = tocResult.cost || 5;

  for (let i = 0; i < sectionLinks.length; i++) {
    const section = sectionLinks[i];
    console.log(`[${i + 1}/${sectionLinks.length}] Scraping: ${section.text}`);

    const sectionResult = await scrapeUrlWithRetry(section.url, {
      renderJs: true,
      wait: 3000,
      blockResources: false,
    });

    if (sectionResult.success) {
      const content = cleanSectionContent(sectionResult.html || '');
      if (content.length > 50) {
        fullText += `\n## ${section.text}\n\n`;
        fullText += content + '\n';
        console.log(`   ✓ ${content.length} chars`);
      } else {
        console.log(`   ⚠ Minimal content (${content.length} chars)`);
      }
      totalCredits += sectionResult.cost || 5;
    } else {
      console.log(`   ❌ Failed: ${sectionResult.error}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  // Save output
  const outputPath = path.join(OUTPUT_DIR, 'short-term-rentals.md');
  fs.writeFileSync(outputPath, fullText);

  console.log(`\n✅ Done!`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Size: ${(fullText.length / 1024).toFixed(1)} KB`);
  console.log(`   Credits used: ~${totalCredits}`);
}

main().catch(console.error);
