import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { scrapeJurisdiction } from '../lib/scrapers/unified-scraper';
import { checkCreditsBeforeExtraction } from '../lib/scrapers/scrapingbee-client';

const JURISDICTION_ID = 'covington-ky';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances', 'covington-ky');
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'civix-documents';
const S3_PREFIX = 'covington-ky/ordinances/';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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
║  Covington, KY Ordinance Scraper                               ║
║                                                                ║
║  This script will:                                             ║
║  1. Scrape ordinances from American Legal Publishing           ║
║  2. Save full-ordinances.txt locally                           ║
║  3. Extract relevant chapters to markdown                      ║
║  4. Upload to S3 bucket                                        ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Check credits before starting
  const hasCredits = await checkCreditsBeforeExtraction(100);
  if (!hasCredits) {
    console.error('❌ Insufficient ScrapingBee credits. Aborting.');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  console.log(`\n🔍 Starting scrape for ${JURISDICTION_ID}...\n`);

  try {
    // Run the unified scraper
    const result = await scrapeJurisdiction(JURISDICTION_ID);

    console.log(`\n✅ Scrape completed!`);
    console.log(`   Source: ${result.source}`);
    console.log(`   URL: ${result.sourceUrl}`);
    console.log(`   Chapters found: ${result.chapters.length}`);
    console.log(`   Credits used: ${result.totalCredits}`);

    if (result.chapters.length === 0) {
      console.error('❌ No chapters found. Check if the source URL is correct.');
      process.exit(1);
    }

    // Compile full ordinances text
    let fullText = `MUNICIPAL CODE\nCity of COVINGTON, KENTUCKY\n\nScraped: ${result.scrapedAt.toISOString()}\nSource: ${result.sourceUrl}\n\n`;
    fullText += '='.repeat(80) + '\n\n';

    const relevantChapters: Array<{
      title: string;
      text: string;
      isZoning: boolean;
      isBuilding: boolean;
      isBusiness: boolean;
      isHealth: boolean;
    }> = [];

    for (const chapter of result.chapters) {
      const chapterHeader = `\n${'='.repeat(80)}\n${chapter.title}\n${'='.repeat(80)}\n\n`;

      if (chapter.fullText && chapter.fullText.length > 100) {
        fullText += chapterHeader;
        fullText += chapter.fullText + '\n\n';

        // Track relevant chapters for extraction
        if (chapter.isRelevant) {
          relevantChapters.push({
            title: chapter.title,
            text: chapter.fullText,
            isZoning: chapter.isZoning,
            isBuilding: chapter.isBuilding,
            isBusiness: chapter.isBusiness,
            isHealth: chapter.isHealth,
          });
        }
      } else if (chapter.error) {
        fullText += chapterHeader;
        fullText += `[Error scraping chapter: ${chapter.error}]\n\n`;
      }
    }

    // Save full ordinances text
    const fullOrdinancesPath = path.join(OUTPUT_DIR, 'full-ordinances.txt');
    fs.writeFileSync(fullOrdinancesPath, fullText);
    console.log(`\n📄 Saved: ${fullOrdinancesPath}`);
    console.log(`   Size: ${(fullText.length / 1024 / 1024).toFixed(2)} MB`);

    // Save scrape metadata/manifest
    const manifest = {
      jurisdiction: JURISDICTION_ID,
      source: result.source,
      sourceUrl: result.sourceUrl,
      scrapedAt: result.scrapedAt.toISOString(),
      totalChapters: result.chapters.length,
      relevantChapters: relevantChapters.length,
      totalCreditsUsed: result.totalCredits,
      chapters: result.chapters.map(ch => ({
        title: ch.title,
        href: ch.href,
        isZoning: ch.isZoning,
        isBuilding: ch.isBuilding,
        isBusiness: ch.isBusiness,
        isHealth: ch.isHealth,
        isRelevant: ch.isRelevant,
        textLength: ch.fullText?.length || 0,
        sectionsCount: ch.sections?.length || 0,
        error: ch.error || null,
      })),
    };

    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📋 Saved: ${manifestPath}`);

    // Extract relevant chapters to markdown files
    console.log(`\n📝 Extracting ${relevantChapters.length} relevant chapters to markdown...`);

    for (const chapter of relevantChapters) {
      // Create a clean filename from the chapter title
      const cleanTitle = chapter.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      const mdPath = path.join(OUTPUT_DIR, `${cleanTitle}.md`);

      // Format as markdown
      let mdContent = `# ${chapter.title}\n\n`;
      mdContent += `**Jurisdiction**: Covington, KY\n`;
      mdContent += `**Source**: American Legal Publishing\n`;
      mdContent += `**Scraped**: ${result.scrapedAt.toISOString()}\n\n`;
      mdContent += `---\n\n`;
      mdContent += chapter.text;

      fs.writeFileSync(mdPath, mdContent);
      console.log(`   ✓ ${cleanTitle}.md`);
    }

    // Upload to S3
    console.log(`\n☁️  Uploading to S3...`);

    try {
      // Upload full-ordinances.txt
      const fullTextS3Key = `${S3_PREFIX}full-ordinances.txt`;
      await uploadToS3(fullOrdinancesPath, fullTextS3Key, 'text/plain');
      console.log(`   ✓ Uploaded: ${fullTextS3Key}`);

      // Upload manifest
      const manifestS3Key = `${S3_PREFIX}manifest.json`;
      await uploadToS3(manifestPath, manifestS3Key, 'application/json');
      console.log(`   ✓ Uploaded: ${manifestS3Key}`);

      // Upload markdown files
      for (const chapter of relevantChapters) {
        const cleanTitle = chapter.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50);

        const mdPath = path.join(OUTPUT_DIR, `${cleanTitle}.md`);
        const mdS3Key = `${S3_PREFIX}${cleanTitle}.md`;
        await uploadToS3(mdPath, mdS3Key, 'text/markdown');
        console.log(`   ✓ Uploaded: ${mdS3Key}`);
      }

      console.log(`\n✅ All files uploaded to S3!`);
      console.log(`   Bucket: ${S3_BUCKET}`);
      console.log(`   Prefix: ${S3_PREFIX}`);
    } catch (s3Error: any) {
      console.error(`\n⚠️  S3 upload failed: ${s3Error.message}`);
      console.log(`   Local files are still available at: ${OUTPUT_DIR}`);
    }

    // Summary
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Summary                                                       ║
╚════════════════════════════════════════════════════════════════╝

📊 Scrape Statistics:
   • Total chapters: ${result.chapters.length}
   • Relevant chapters: ${relevantChapters.length}
   • Credits used: ${result.totalCredits}
   • Full text size: ${(fullText.length / 1024 / 1024).toFixed(2)} MB

📂 Output Files:
   • ${fullOrdinancesPath}
   • ${manifestPath}
   • ${relevantChapters.length} markdown extracts

📋 Relevant Chapters Found:
${relevantChapters.map(ch => `   • ${ch.title}`).join('\n')}

✅ Covington, KY ordinance scrape complete!
`);

  } catch (error: any) {
    console.error(`\n❌ Scrape failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
