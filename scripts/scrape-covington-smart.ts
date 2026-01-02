import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  scrapeSmartWithRetry,
  scrapeAsTextWithRetry,
  checkCreditsBeforeExtraction,
  getCredits,
} from '../lib/scrapers/scrapingbee-client';

const JURISDICTION_ID = 'covington-ky';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances', 'covington-ky');
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'civix-documents';
const S3_PREFIX = 'covington-ky/ordinances/';
const AMLEGAL_BASE = 'https://codelibrary.amlegal.com';

// Target chapters for rental/property/zoning compliance
const TARGET_CHAPTERS = [
  { name: 'Chapter 127: Short-Term Rentals', url: '/codes/covington/latest/covington_ky/0-0-0-33543' },
  { name: 'Chapter 110: License Fees and Taxes', url: '/codes/covington/latest/covington_ky/0-0-0-22345' },
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
 * Clean text output - remove navigation noise that appears even in text-only mode
 */
function cleanText(text: string): string {
  let cleaned = text;

  // Try to extract just the section content by finding where actual ordinance text starts
  // Look for the pattern "§ XXX.XX" which marks actual section content
  const sectionMatch = cleaned.match(/§\s*\d+\.\d+\s+[A-Z]/);
  if (sectionMatch) {
    const startIndex = cleaned.indexOf(sectionMatch[0]);
    if (startIndex > 500) { // Only trim if there's significant content before
      cleaned = cleaned.substring(startIndex);
    }
  }

  return cleaned
    // Remove language selector menu (appears at start of many pages)
    .replace(/Parėmė\s+Vertėjas[\s\S]*?PDF documents are not translated\./g, '')
    .replace(/English Select Language[\s\S]*?Help Center/g, '')
    .replace(/Select Language\s+English[\s\S]*?PDF documents are not translated\./g, '')

    // Remove navigation and UI elements
    .replace(/Skip to main content/gi, '')
    .replace(/Skip to code content/gi, '')
    .replace(/\(skip section selection\)/gi, '')
    .replace(/Back to Library/gi, '')
    .replace(/Back to Code Library/gi, '')
    .replace(/Search Login Login/gi, '')
    .replace(/Created with Sketch\./gi, '')
    .replace(/Resources Sitemap Accessibility Help Center/gi, '')

    // Remove version/compare UI
    .replace(/\d{4} S-\d+ \(current\)/gi, '')
    .replace(/Compare to:[\s\S]*?Earlier Versions -/gi, '')
    .replace(/- No Earlier Versions -/gi, '')

    // Remove TOC sidebar content (full chapter list that repeats)
    .replace(/Covington Overview[\s\S]*?PARALLEL REFERENCES/g, '')
    .replace(/COVINGTON, KENTUCKY CODE OF ORDINANCES[\s\S]*?TITLE XV: LAND USAGE/g, '')
    .replace(/KY Covington[\s\S]*?Code of Ordinances/gi, '')

    // Remove action buttons
    .replace(/Annotations Off/gi, '')
    .replace(/Follow Changes/gi, '')
    .replace(/Share\s*Download\s*Bookmark\s*Print/gi, '')
    .replace(/Previous Doc\s*Next Doc/gi, '')
    .replace(/0 items available/gi, '')

    // Remove footer content
    .replace(/Hosted by:\s*American Legal Publishing/gi, '')
    .replace(/Disclaimer:[\s\S]*?800-445-5588\./g, '')

    // Remove translation artifacts (Lithuanian, German, etc.)
    .replace(/Originalus tekstas[\s\S]*?tobulinti/g, '')
    .replace(/Įvertinkite šį vertimą[\s\S]*$/g, '')
    .replace(/Originaltext[\s\S]*?verbessern/g, '')  // German
    .replace(/Diese Übersetzung bewerten[\s\S]*$/g, '')  // German
    .replace(/Recaptcha requires verification\.[\s\S]*?protected by/g, '')
    .replace(/reCAPTCHA[\s\S]*$/gm, '')
    .replace(/Privacy\s*-\s*Terms/gi, '')

    // Remove duplicate section listings in TOC format
    .replace(/Section\s+(\d+\.\d+)\s+[A-Za-z\s,]+\n(?=\s*Section)/gm, '')

    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+$/gm, '')
    .trim();
}

/**
 * Scrape a single chapter using smart text extraction
 */
async function scrapeChapter(name: string, urlPath: string): Promise<ChapterContent> {
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${AMLEGAL_BASE}${urlPath}`;
  console.log(`\n📖 Scraping: ${name}`);
  console.log(`   URL: ${fullUrl}`);

  // Use smart scraping - tries light first (10 credits), falls back to full JS (15 credits)
  const result = await scrapeSmartWithRetry(fullUrl, { wait: 3000 });

  if (!result.success || !result.text) {
    console.log(`   ❌ Failed: ${result.error}`);
    return {
      name,
      url: fullUrl,
      fullText: '',
      textLength: 0,
      creditCost: result.cost || 10,
      error: result.error,
    };
  }

  const cleanedText = cleanText(result.text);
  console.log(`   ✅ Got ${cleanedText.length} chars (${result.cost} credits)`);

  return {
    name,
    url: fullUrl,
    fullText: cleanedText,
    textLength: cleanedText.length,
    creditCost: result.cost || 10,
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
║  Covington, KY Smart Ordinance Scraper                         ║
║                                                                ║
║  Using return_page_text for cleaner output                     ║
║  Tries light requests first (10 credits vs 15)                 ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Check current credits
  const credits = await getCredits();
  if (credits?.credits_remaining !== undefined) {
    console.log(`📊 ScrapingBee credits remaining: ${credits.credits_remaining}`);
  }

  // Estimate: ~10-15 credits per chapter × 9 chapters = ~90-135 credits
  const hasCredits = await checkCreditsBeforeExtraction(150);
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
    await new Promise(r => setTimeout(r, 1500));
  }

  // Compile full ordinances text
  let fullText = `MUNICIPAL CODE
City of COVINGTON, KENTUCKY

Scraped: ${new Date().toISOString()}
Source: American Legal Publishing (codelibrary.amlegal.com)
Method: ScrapingBee return_page_text (LLM-optimized)

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
    method: 'scrapingbee-return_page_text',
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
      console.log(`   ✓ ${cleanName}.md (${(chapter.textLength / 1024).toFixed(1)} KB)`);
    }
  }

  // Upload to S3
  console.log(`\n☁️  Uploading to S3...`);
  try {
    // Upload full ordinances
    const s3FullPath = await uploadToS3(fullOrdinancesPath, `${S3_PREFIX}full-ordinances.txt`, 'text/plain');
    console.log(`   ✓ ${s3FullPath}`);

    // Upload manifest
    const s3ManifestPath = await uploadToS3(manifestPath, `${S3_PREFIX}manifest.json`, 'application/json');
    console.log(`   ✓ ${s3ManifestPath}`);

    // Upload individual chapters
    for (const chapter of scrapedChapters) {
      if (chapter.textLength > 100) {
        const cleanName = chapter.name
          .toLowerCase()
          .replace(/chapter \d+:\s*/i, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const mdPath = path.join(OUTPUT_DIR, `${cleanName}.md`);
        if (fs.existsSync(mdPath)) {
          const s3ChapterPath = await uploadToS3(mdPath, `${S3_PREFIX}${cleanName}.md`, 'text/markdown');
          console.log(`   ✓ ${s3ChapterPath}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`   ❌ S3 upload error: ${error.message}`);
  }

  // Summary
  const successCount = scrapedChapters.filter(c => c.textLength > 100).length;
  const failedCount = scrapedChapters.filter(c => c.error || c.textLength <= 100).length;

  // Check remaining credits
  const finalCredits = await getCredits();

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
   • Credits remaining: ${finalCredits?.credits_remaining ?? 'unknown'}

📂 Output Files:
   • ${fullOrdinancesPath}
   • ${manifestPath}

${failedCount > 0 ? `
⚠️  Chapters with issues:
${scrapedChapters.filter(c => c.error || c.textLength <= 100).map(c => `   • ${c.name}: ${c.error || 'minimal content'}`).join('\n')}
` : ''}
✅ Covington, KY smart scrape complete!
`);
}

main().catch(console.error);
