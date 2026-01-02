import 'dotenv/config';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { scrapeUrlWithRetry, checkCreditsBeforeExtraction } from '../lib/scrapers/scrapingbee-client';

const JURISDICTION_ID = 'covington-ky';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances', 'covington-ky');
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'civix-documents';
const S3_PREFIX = 'covington-ky/ordinances/';
const AMLEGAL_BASE = 'https://codelibrary.amlegal.com';

// Specific chapters we want to scrape (based on what's relevant for rental/property/zoning)
// URLs verified from TOC scrape on 2026-01-02
const TARGET_CHAPTERS = [
  // Business Regulations - Title XI
  { name: 'Chapter 127: Short-Term Rentals', url: '/codes/covington/latest/covington_ky/0-0-0-33543' },
  { name: 'Chapter 110: License Fees and Taxes', url: '/codes/covington/latest/covington_ky/0-0-0-22345' },

  // Land Usage - Title XV
  { name: 'Chapter 150: Building Code', url: '/codes/covington/latest/covington_ky/0-0-0-25686' },
  { name: 'Chapter 151: Fire and Safety Codes', url: '/codes/covington/latest/covington_ky/0-0-0-25822' },
  { name: 'Chapter 152: Property Maintenance Code', url: '/codes/covington/latest/covington_ky/0-0-0-25844' },
  { name: 'Chapter 153: Uniform Residential Landlord and Tenant Act', url: '/codes/covington/latest/covington_ky/0-0-0-25977' },
  { name: 'Chapter 155: Rental Dwelling Licensing', url: '/codes/covington/latest/covington_ky/0-0-0-26318' },
  { name: 'Chapter 157: Subdivisions', url: '/codes/covington/latest/covington_ky/0-0-0-26434' },
  { name: 'Chapter 158: Neighborhood Development Code', url: '/codes/covington/latest/covington_ky/0-0-0-27395' },
];

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface ChapterContent {
  name: string;
  url: string;
  fullText: string;
  textLength: number;
  creditCost: number;
  error?: string;
}

/**
 * Clean scraped HTML content to extract actual ordinance text
 */
function cleanContent(html: string): string {
  const $ = cheerio.load(html);

  // Remove all unwanted elements
  $('script, style, noscript, nav, header, footer, .sidebar, .navigation').remove();
  $('[class*="translate"], [class*="recaptcha"], [class*="google"]').remove();
  $('[class*="breadcrumb"], [class*="toc-nav"], [class*="menu"]').remove();

  // Try to find the main content area
  // AmLegal uses specific container classes
  let content = '';

  // First try: look for chunk/content containers with actual section text
  const contentAreas = [
    '.chunk-content',
    '.code-content',
    '.document-body',
    '[data-document-content]',
    '.content-wrapper',
    'main .content',
    '#main-content',
    'article',
  ];

  for (const selector of contentAreas) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 1000) {
      content = el.text();
      break;
    }
  }

  // Fallback: get body text but filter out navigation
  if (!content || content.length < 500) {
    // Get all text nodes from the body, excluding navigation
    $('body').find('*').each((i, el) => {
      const $el = $(el);
      const text = $el.clone().children().remove().end().text().trim();
      if (text.length > 20) {
        content += text + '\n';
      }
    });
  }

  // Clean up the content
  content = content
    // Remove common navigation/UI text
    .replace(/Powered by Translate/gi, '')
    .replace(/Skip to code content/gi, '')
    .replace(/Created with Sketch/gi, '')
    .replace(/\d{4} S-\d+ \(current\)/gi, '')
    .replace(/Compare to:.*?Versions/gi, '')
    .replace(/Covington Overview/gi, '')
    .replace(/Annotations Off/gi, '')
    .replace(/Follow Changes/gi, '')
    .replace(/Share.*?Print/gi, '')
    .replace(/Disclaimer:.*?800-445-5588\./gs, '')
    .replace(/Hosted by: American Legal Publishing/gi, '')
    .replace(/Back to Code Library/gi, '')
    .replace(/Previous Doc.*?Next Doc/gi, '')
    .replace(/Original text.*?Terms/gs, '')
    .replace(/Rate this translation.*$/gm, '')
    .replace(/reCAPTCHA.*$/gm, '')
    .replace(/Privacy - Terms/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return content;
}

/**
 * Scrape a single chapter and extract clean text
 */
async function scrapeChapter(name: string, urlPath: string): Promise<ChapterContent> {
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${AMLEGAL_BASE}${urlPath}`;
  console.log(`\n📖 Scraping: ${name}`);
  console.log(`   URL: ${fullUrl}`);

  const result = await scrapeUrlWithRetry(fullUrl, {
    renderJs: true,
    wait: 5000,  // Wait longer for JS to render
    blockResources: false,
    premiumProxy: false,
  });

  if (!result.success) {
    console.log(`   ❌ Failed: ${result.error}`);
    return {
      name,
      url: fullUrl,
      fullText: '',
      textLength: 0,
      creditCost: result.cost || 1,
      error: result.error,
    };
  }

  // Try to find chapter content by looking at the page structure
  const $ = cheerio.load(result.html || '');

  // Save raw HTML for debugging first chapter
  if (name.includes('Short-Term')) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'debug-str-raw.html'), result.html || '');
    console.log(`   📝 Saved debug HTML to debug-str-raw.html`);
  }

  // Look for section links within this chapter to get deeper content
  const sectionLinks: string[] = [];
  $('a[href*="/codes/covington/"]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    // Look for section links (e.g., "§ 127.01" or "127.01")
    if (href && (text.match(/§?\s*\d+\.\d+/) || text.toLowerCase().includes('section'))) {
      const fullHref = href.startsWith('http') ? href : `${AMLEGAL_BASE}${href}`;
      if (!sectionLinks.includes(fullHref)) {
        sectionLinks.push(fullHref);
      }
    }
  });

  console.log(`   Found ${sectionLinks.length} section links`);

  let fullText = '';
  let totalCredits = result.cost || 1;

  // If we found section links, scrape each section
  if (sectionLinks.length > 0 && sectionLinks.length <= 50) {
    console.log(`   Scraping individual sections...`);

    for (let i = 0; i < sectionLinks.length; i++) {
      const sectionUrl = sectionLinks[i];
      console.log(`   [${i + 1}/${sectionLinks.length}] Scraping section...`);

      const sectionResult = await scrapeUrlWithRetry(sectionUrl, {
        renderJs: true,
        wait: 3000,
        blockResources: false,
      });

      if (sectionResult.success) {
        const sectionContent = cleanContent(sectionResult.html || '');
        if (sectionContent.length > 100) {
          fullText += '\n\n' + sectionContent;
        }
        totalCredits += sectionResult.cost || 1;
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 1500));
    }
  } else {
    // No section links or too many - use the chapter page content
    fullText = cleanContent(result.html || '');
  }

  console.log(`   ✅ Extracted ${fullText.length} chars, ${totalCredits} credits`);

  return {
    name,
    url: fullUrl,
    fullText,
    textLength: fullText.length,
    creditCost: totalCredits,
  };
}

async function uploadToS3(localPath: string, s3Key: string, contentType: string): Promise<string> {
  const fileContent = fs.readFileSync(localPath);

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
    Metadata: {
      'uploaded-date': new Date().toISOString(),
      'jurisdiction': JURISDICTION_ID,
      'document-type': 'ordinance'
    }
  }));

  return `s3://${S3_BUCKET}/${s3Key}`;
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Covington, KY Deep Ordinance Scraper                          ║
║                                                                ║
║  Targets specific chapters relevant for rental/property        ║
║  compliance, matching Cincinnati format                        ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Check credits - we need more for deep scraping
  const hasCredits = await checkCreditsBeforeExtraction(200);
  if (!hasCredits) {
    console.error('❌ Insufficient ScrapingBee credits. Aborting.');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`📋 Targeting ${TARGET_CHAPTERS.length} chapters\n`);

  const scrapedChapters: ChapterContent[] = [];
  let totalCredits = 0;

  for (const chapter of TARGET_CHAPTERS) {
    const content = await scrapeChapter(chapter.name, chapter.url);
    scrapedChapters.push(content);
    totalCredits += content.creditCost;

    // Rate limiting between chapters
    await new Promise(r => setTimeout(r, 2000));
  }

  // Compile full ordinances text
  let fullText = `MUNICIPAL CODE
City of COVINGTON, KENTUCKY

Scraped: ${new Date().toISOString()}
Source: American Legal Publishing (codelibrary.amlegal.com)

${'='.repeat(80)}
`;

  for (const chapter of scrapedChapters) {
    fullText += `\n\n${'='.repeat(80)}\n`;
    fullText += `${chapter.name}\n`;
    fullText += `URL: ${chapter.url}\n`;
    fullText += `${'='.repeat(80)}\n\n`;

    if (chapter.error) {
      fullText += `[Error: ${chapter.error}]\n`;
    } else if (chapter.fullText.length > 100) {
      fullText += chapter.fullText;
    } else {
      fullText += `[Minimal content extracted - may need manual review]\n`;
    }
  }

  // Save full ordinances
  const fullOrdinancesPath = path.join(OUTPUT_DIR, 'full-ordinances.txt');
  fs.writeFileSync(fullOrdinancesPath, fullText);
  console.log(`\n📄 Saved: ${fullOrdinancesPath}`);
  console.log(`   Size: ${(fullText.length / 1024).toFixed(1)} KB`);

  // Save manifest
  const manifest = {
    jurisdiction: JURISDICTION_ID,
    source: 'amlegal',
    sourceUrl: 'https://codelibrary.amlegal.com/codes/covington/latest/overview',
    scrapedAt: new Date().toISOString(),
    totalChapters: scrapedChapters.length,
    totalCreditsUsed: totalCredits,
    chapters: scrapedChapters.map(ch => ({
      name: ch.name,
      url: ch.url,
      textLength: ch.textLength,
      creditCost: ch.creditCost,
      error: ch.error || null,
    })),
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📋 Saved: ${manifestPath}`);

  // Save individual chapter markdown files
  console.log(`\n📝 Saving individual chapter files...`);
  for (const chapter of scrapedChapters) {
    if (chapter.fullText.length > 100) {
      const cleanName = chapter.name
        .toLowerCase()
        .replace(/chapter \d+:\s*/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const mdPath = path.join(OUTPUT_DIR, `${cleanName}.md`);
      const mdContent = `# ${chapter.name}

**Jurisdiction**: Covington, KY
**Source**: [American Legal Publishing](${chapter.url})
**Scraped**: ${new Date().toISOString()}

---

${chapter.fullText}
`;
      fs.writeFileSync(mdPath, mdContent);
      console.log(`   ✓ ${cleanName}.md`);
    }
  }

  // Summary
  const successCount = scrapedChapters.filter(c => c.textLength > 100).length;
  const failedCount = scrapedChapters.filter(c => c.error || c.textLength <= 100).length;

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Summary                                                       ║
╚════════════════════════════════════════════════════════════════╝

📊 Scrape Statistics:
   • Chapters targeted: ${TARGET_CHAPTERS.length}
   • Successfully scraped: ${successCount}
   • Failed/minimal: ${failedCount}
   • Total credits used: ${totalCredits}
   • Full text size: ${(fullText.length / 1024).toFixed(1)} KB

📂 Output Files:
   • ${fullOrdinancesPath}
   • ${manifestPath}

${failedCount > 0 ? `
⚠️  Chapters with issues:
${scrapedChapters.filter(c => c.error || c.textLength <= 100).map(c => `   • ${c.name}: ${c.error || 'minimal content'}`).join('\n')}
` : ''}
✅ Covington, KY deep scrape complete!
`);
}

main().catch(console.error);
