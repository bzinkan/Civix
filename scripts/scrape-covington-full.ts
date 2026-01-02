import 'dotenv/config';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { scrapeUrlWithRetry } from '../lib/scrapers/scrapingbee-client';

const JURISDICTION_ID = 'covington-ky';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances', 'covington-ky');
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'civix-documents';
const S3_PREFIX = 'covington-ky/ordinances/';
const AMLEGAL_BASE = 'https://codelibrary.amlegal.com';

// All chapters to scrape - verified URLs from TOC
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

interface SectionData {
  number: string;
  title: string;
  url: string;
  content: string;
}

interface ChapterData {
  name: string;
  url: string;
  sections: SectionData[];
  totalCredits: number;
  error?: string;
}

/**
 * Clean section content - remove navigation noise
 */
function cleanContent(text: string): string {
  return text
    // Remove translation widgets and language lists
    .replace(/Powered by\s*(Translate|翻訳|Vertėjas|переводчик).*?Select Language/gsi, '')
    .replace(/English\s*Afrikaans\s*Albanian.*?Zulu/gs, '')
    .replace(/\*There may be discrepancies.*?translated\./gs, '')
    // Remove navigation elements
    .replace(/Skip to (main |code )?content/gi, '')
    .replace(/\(skip section selection\)/gi, '')
    .replace(/Created with Sketch/gi, '')
    .replace(/\d{4} S-\d+ \(current\)/gi, '')
    .replace(/Compare to:.*?Versions/gi, '')
    .replace(/- No Earlier Versions -/gi, '')
    .replace(/Covington Overview/gi, '')
    .replace(/Annotations Off/gi, '')
    .replace(/Follow Changes/gi, '')
    .replace(/ShareDownloadBookmarkPrint/gi, '')
    .replace(/Share\s*Download\s*Bookmark\s*Print/gi, '')
    // Remove sidebar TOC repeated content
    .replace(/COVINGTON, KENTUCKY CODE OF ORDINANCES.*?PARALLEL REFERENCES/gs, '')
    .replace(/Covington, KY Code of Ordinances/gi, '')
    .replace(/ADOPTING ORDINANCE/gi, '')
    .replace(/TITLE [IVX]+:.*?(?=CHAPTER|§|$)/g, '')
    .replace(/TABLE OF SPECIAL ORDINANCES/gi, '')
    // Remove footer/disclaimer
    .replace(/Disclaimer:.*?800-445-5588\./gs, '')
    .replace(/Hosted by: American Legal Publishing/gi, '')
    .replace(/Back to Code Library/gi, '')
    .replace(/Previous Doc.*?Next Doc/gi, '')
    .replace(/0 items available/gi, '')
    .replace(/Original text.*?Terms/gs, '')
    .replace(/Rate this translation.*$/gm, '')
    .replace(/reCAPTCHA.*?Terms/gs, '')
    .replace(/Recaptcha requires verification/gi, '')
    .replace(/protected by\s*$/gm, '')
    .replace(/Privacy - Terms/gi, '')
    // Clean whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scrape a single chapter and all its sections
 */
async function scrapeChapter(chapter: typeof TARGET_CHAPTERS[0]): Promise<ChapterData> {
  const fullUrl = `${AMLEGAL_BASE}${chapter.url}`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📖 ${chapter.name}`);
  console.log(`   ${fullUrl}`);

  const result: ChapterData = {
    name: chapter.name,
    url: fullUrl,
    sections: [],
    totalCredits: 0,
  };

  // Get chapter TOC page
  const tocResult = await scrapeUrlWithRetry(fullUrl, {
    renderJs: true,
    wait: 5000,
    blockResources: false,
  });

  if (!tocResult.success) {
    console.log(`   ❌ Failed to load chapter: ${tocResult.error}`);
    result.error = tocResult.error;
    return result;
  }

  result.totalCredits += tocResult.cost || 5;
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
      const sectionUrl = baseHref.startsWith('http') ? baseHref : `${AMLEGAL_BASE}${baseHref}`;

      if (!seenUrls.has(sectionUrl)) {
        seenUrls.add(sectionUrl);
        sectionLinks.push({ text, url: sectionUrl, number: match[1] });
      }
    }
  });

  console.log(`   Found ${sectionLinks.length} sections`);

  if (sectionLinks.length === 0) {
    // No sections found - get the chapter content directly
    const bodyText = $('body').text();
    const cleaned = cleanContent(bodyText);
    if (cleaned.length > 200) {
      result.sections.push({
        number: '',
        title: chapter.name,
        url: fullUrl,
        content: cleaned,
      });
    }
    return result;
  }

  // Scrape each section
  for (let i = 0; i < sectionLinks.length; i++) {
    const section = sectionLinks[i];
    process.stdout.write(`   [${i + 1}/${sectionLinks.length}] ${section.number}...`);

    const sectionResult = await scrapeUrlWithRetry(section.url, {
      renderJs: true,
      wait: 3000,
      blockResources: false,
    });

    if (sectionResult.success) {
      const sectionHtml = sectionResult.html || '';
      const $section = cheerio.load(sectionHtml);

      // Remove unwanted elements
      $section('script, style, noscript, nav, header, footer').remove();

      const bodyText = $section('body').text();
      const cleaned = cleanContent(bodyText);

      // Extract just this section's content using regex
      const escapedNum = section.number.replace('.', '\\.');
      const sectionPattern = new RegExp(`§\\s*${escapedNum}[\\s\\S]*?(?=§\\s*\\d+\\.\\d+|$)`, 'g');
      const matches = cleaned.match(sectionPattern);

      let content = '';
      if (matches && matches.length > 0) {
        // Get the longest match (actual content vs TOC reference)
        content = matches.reduce((a, b) => a.length > b.length ? a : b);
      } else {
        content = cleaned;
      }

      if (content.length > 100) {
        result.sections.push({
          number: section.number,
          title: section.text,
          url: section.url,
          content: content,
        });
        console.log(` ✓ ${content.length} chars`);
      } else {
        console.log(` ⚠ minimal`);
      }

      result.totalCredits += sectionResult.cost || 5;
    } else {
      console.log(` ❌`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1200));
  }

  return result;
}

/**
 * Upload file to S3
 */
async function uploadToS3(localPath: string, s3Key: string, contentType: string): Promise<boolean> {
  try {
    const fileContent = fs.readFileSync(localPath);
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'uploaded-date': new Date().toISOString(),
        'jurisdiction': JURISDICTION_ID,
      }
    }));
    return true;
  } catch (err: any) {
    console.error(`   S3 upload failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Covington, KY Full Ordinance Scraper                          ║
║                                                                ║
║  Scraping ${TARGET_CHAPTERS.length} chapters with all sections                     ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allChapters: ChapterData[] = [];
  let totalCredits = 0;

  // Scrape each chapter
  for (const chapter of TARGET_CHAPTERS) {
    const chapterData = await scrapeChapter(chapter);
    allChapters.push(chapterData);
    totalCredits += chapterData.totalCredits;

    // Rate limiting between chapters
    await new Promise(r => setTimeout(r, 2000));
  }

  // Generate full-ordinances.txt (matching Cincinnati format)
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Generating output files...`);

  let fullText = `MUNICIPAL CODE
City of COVINGTON, KENTUCKY

Scraped: ${new Date().toISOString()}
Source: American Legal Publishing (codelibrary.amlegal.com)
${'='.repeat(80)}

`;

  for (const chapter of allChapters) {
    fullText += `\n\n${'='.repeat(80)}\n`;
    fullText += `${chapter.name}\n`;
    fullText += `Source: ${chapter.url}\n`;
    fullText += `${'='.repeat(80)}\n\n`;

    if (chapter.error) {
      fullText += `[Error loading chapter: ${chapter.error}]\n`;
    } else if (chapter.sections.length === 0) {
      fullText += `[No sections found]\n`;
    } else {
      for (const section of chapter.sections) {
        fullText += `\n${'-'.repeat(40)}\n`;
        fullText += `${section.title}\n`;
        fullText += `${'-'.repeat(40)}\n\n`;
        fullText += section.content + '\n';
      }
    }
  }

  // Save full ordinances
  const fullOrdinancesPath = path.join(OUTPUT_DIR, 'full-ordinances.txt');
  fs.writeFileSync(fullOrdinancesPath, fullText);
  console.log(`   ✓ ${fullOrdinancesPath} (${(fullText.length / 1024).toFixed(1)} KB)`);

  // Save individual chapter markdown files
  for (const chapter of allChapters) {
    if (chapter.sections.length > 0) {
      const cleanName = chapter.name
        .toLowerCase()
        .replace(/chapter \d+:\s*/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      let mdContent = `# ${chapter.name}\n\n`;
      mdContent += `**Jurisdiction**: Covington, KY\n`;
      mdContent += `**Source**: [American Legal Publishing](${chapter.url})\n`;
      mdContent += `**Scraped**: ${new Date().toISOString()}\n\n`;
      mdContent += `---\n\n`;

      for (const section of chapter.sections) {
        mdContent += `## ${section.title}\n\n`;
        mdContent += section.content + '\n\n';
      }

      const mdPath = path.join(OUTPUT_DIR, `${cleanName}.md`);
      fs.writeFileSync(mdPath, mdContent);
      console.log(`   ✓ ${cleanName}.md`);
    }
  }

  // Save manifest
  const manifest = {
    jurisdiction: JURISDICTION_ID,
    source: 'amlegal',
    sourceUrl: 'https://codelibrary.amlegal.com/codes/covington/latest/overview',
    scrapedAt: new Date().toISOString(),
    totalChapters: allChapters.length,
    totalSections: allChapters.reduce((sum, ch) => sum + ch.sections.length, 0),
    totalCreditsUsed: totalCredits,
    chapters: allChapters.map(ch => ({
      name: ch.name,
      url: ch.url,
      sectionsCount: ch.sections.length,
      totalChars: ch.sections.reduce((sum, s) => sum + s.content.length, 0),
      error: ch.error || null,
    })),
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`   ✓ manifest.json`);

  // Upload to S3
  console.log(`\n☁️  Uploading to S3 (${S3_BUCKET})...`);

  const filesToUpload = [
    { local: fullOrdinancesPath, key: `${S3_PREFIX}full-ordinances.txt`, type: 'text/plain' },
    { local: manifestPath, key: `${S3_PREFIX}manifest.json`, type: 'application/json' },
  ];

  // Add markdown files
  for (const chapter of allChapters) {
    if (chapter.sections.length > 0) {
      const cleanName = chapter.name
        .toLowerCase()
        .replace(/chapter \d+:\s*/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const mdPath = path.join(OUTPUT_DIR, `${cleanName}.md`);
      filesToUpload.push({ local: mdPath, key: `${S3_PREFIX}${cleanName}.md`, type: 'text/markdown' });
    }
  }

  let uploadSuccess = 0;
  for (const file of filesToUpload) {
    if (await uploadToS3(file.local, file.key, file.type)) {
      console.log(`   ✓ ${file.key}`);
      uploadSuccess++;
    }
  }

  // Summary
  const successChapters = allChapters.filter(ch => ch.sections.length > 0).length;
  const totalSections = allChapters.reduce((sum, ch) => sum + ch.sections.length, 0);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Summary                                                       ║
╚════════════════════════════════════════════════════════════════╝

📊 Scrape Statistics:
   • Chapters scraped: ${successChapters}/${TARGET_CHAPTERS.length}
   • Total sections: ${totalSections}
   • Credits used: ~${totalCredits}
   • Output size: ${(fullText.length / 1024).toFixed(1)} KB

☁️  S3 Upload:
   • Files uploaded: ${uploadSuccess}/${filesToUpload.length}
   • Bucket: ${S3_BUCKET}
   • Prefix: ${S3_PREFIX}

📂 Local Files:
   • ${OUTPUT_DIR}

✅ Covington, KY scrape complete!
`);
}

main().catch(console.error);
