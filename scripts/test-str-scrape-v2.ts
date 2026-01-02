import 'dotenv/config';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { scrapeUrlWithRetry } from '../lib/scrapers/scrapingbee-client';

const AMLEGAL_BASE = 'https://codelibrary.amlegal.com';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances', 'covington-ky');

// Just test Chapter 127: Short-Term Rentals
const CHAPTER_URL = '/codes/covington/latest/covington_ky/0-0-0-33543';

function cleanSectionContent(html: string, sectionNumber: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, noscript, nav, header, footer').remove();
  $('[class*="sidebar"], [class*="navigation"], [class*="menu"]').remove();
  $('[class*="toc"], [class*="breadcrumb"]').remove();

  // Get body text
  let content = $('body').text();

  // Find the actual section content - it appears after the section header
  // The section text comes after "§ XXX.XX TITLE." and before the next section or Disclaimer
  const escapedSection = sectionNumber.replace('.', '\\.');
  const sectionPattern = new RegExp(`(§\\s*${escapedSection}[^§]+?)(?=§\\s*\\d+\\.\\d+|Disclaimer:|$)`, 'gs');
  const matches = content.match(sectionPattern);

  if (matches && matches.length > 0) {
    // Get the longest match (actual content, not TOC reference)
    content = matches.reduce((a, b) => a.length > b.length ? a : b);
  }

  // Clean up remaining noise
  return content
    .replace(/Powered by Translate.*$/gm, '')
    .replace(/Skip to.*?content/gi, '')
    .replace(/Created with Sketch/gi, '')
    .replace(/\d{4} S-\d+ \(current\)/gi, '')
    .replace(/Compare to:.*?Versions/gi, '')
    .replace(/Covington Overview/gi, '')
    .replace(/Annotations Off|Follow Changes/gi, '')
    .replace(/ShareDownloadBookmarkPrint/gi, '')
    .replace(/Disclaimer:.*?800-445-5588\./gs, '')
    .replace(/Hosted by: American Legal Publishing/gi, '')
    .replace(/Back to Code Library/gi, '')
    .replace(/Previous Doc.*?Next Doc/gi, '')
    .replace(/0 items available/gi, '')
    .replace(/Original text.*$/gm, '')
    .replace(/reCAPTCHA.*$/gm, '')
    .replace(/Privacy - Terms/gi, '')
    .replace(/COVINGTON, KENTUCKY CODE OF ORDINANCES/gi, '')
    .replace(/Parėmė Vertėjas/gi, '')  // Lithuanian translation artifact
    .replace(/\(skip section selection\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('Testing Short-Term Rentals chapter scrape v2...\n');

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
  const sectionLinks: { text: string; url: string; number: string }[] = [];
  const seenUrls = new Set<string>();

  $('a[href*="/codes/covington/"]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();

    // Match section patterns like "§ 127.01" or "127.01"
    const match = text.match(/^§?\s*(\d+\.\d+)/);
    if (href && match) {
      const baseHref = href.split('#')[0];
      const fullHref = baseHref.startsWith('http') ? baseHref : `${AMLEGAL_BASE}${baseHref}`;

      if (!seenUrls.has(fullHref)) {
        seenUrls.add(fullHref);
        sectionLinks.push({ text, url: fullHref, number: match[1] });
      }
    }
  });

  console.log(`Found ${sectionLinks.length} unique sections to scrape\n`);

  // Scrape each section
  let fullText = `# CHAPTER 127: SHORT-TERM RENTALS\n\n`;
  fullText += `**Jurisdiction**: Covington, KY\n`;
  fullText += `**Source**: American Legal Publishing\n`;
  fullText += `**URL**: https://codelibrary.amlegal.com/codes/covington/latest/covington_ky/0-0-0-33543\n`;
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
      const content = cleanSectionContent(sectionResult.html || '', section.number);
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
