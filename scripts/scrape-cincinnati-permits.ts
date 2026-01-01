import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const BASE_URL = 'https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/application-forms/';
const LOCAL_DOWNLOAD_DIR = path.join(process.cwd(), 'data', 'cincinnati', 'permits');
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'civix-documents';
const S3_PREFIX = 'cincinnati-oh/permits/';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
});

interface PermitDocument {
  url: string;
  title: string;
  filename: string;
}

function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        if (response.headers.location) {
          downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => reject(err));
    });
  });
}

async function uploadToS3(localPath: string, s3Key: string): Promise<{ s3Url: string; httpsUrl: string }> {
  const fileContent = fs.readFileSync(localPath);

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'application/pdf',
    Metadata: {
      'uploaded-date': new Date().toISOString(),
      'jurisdiction': 'cincinnati-oh',
      'document-type': 'permit-form'
    }
  }));

  const s3Url = `s3://${S3_BUCKET}/${s3Key}`;
  const httpsUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

  return { s3Url, httpsUrl };
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Cincinnati Building Department Permit Forms Scraper          ║
║                                                                ║
║  This script will:                                            ║
║  1. Download common permit forms (manual list)                ║
║  2. Upload to S3 bucket                                       ║
║  3. Create manifest.json with metadata                        ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Create local download directory
  if (!fs.existsSync(LOCAL_DOWNLOAD_DIR)) {
    fs.mkdirSync(LOCAL_DOWNLOAD_DIR, { recursive: true });
  }

  // Common Cincinnati permit forms (manual list since we can't scrape HTML easily in Node)
  const permitForms: PermitDocument[] = [
    {
      url: 'https://www.cincinnati-oh.gov/buildings/linkservid/1C8A8D5A-0D9C-8F7F-B827DBE73A28E91D/showMeta/0/',
      title: 'Building Permit Application',
      filename: 'building-permit-application.pdf'
    },
    {
      url: 'https://www.cincinnati-oh.gov/buildings/linkservid/1C66B61F-0D9C-8F7F-B86EA0CC5799D1CD/showMeta/0/',
      title: 'Zoning Certificate Application',
      filename: 'zoning-certificate-application.pdf'
    },
    {
      url: 'https://www.cincinnati-oh.gov/buildings/linkservid/1C8FE7BB-0D9C-8F7F-B86A9926D9B2B39D/showMeta/0/',
      title: 'Demolition Permit Application',
      filename: 'demolition-permit-application.pdf'
    }
  ];

  console.log(`📋 Downloading ${permitForms.length} permit forms...\n`);

  const manifest: any[] = [];
  let successCount = 0;

  for (const [index, form] of permitForms.entries()) {
    console.log(`[${index + 1}/${permitForms.length}] ${form.title}`);

    const localPath = path.join(LOCAL_DOWNLOAD_DIR, form.filename);
    const s3Key = `${S3_PREFIX}${form.filename}`;

    try {
      // Download PDF
      console.log(`   📥 Downloading...`);
      await downloadFile(form.url, localPath);

      const stats = fs.statSync(localPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✓ Downloaded (${sizeMB} MB)`);

      // Upload to S3
      console.log(`   📤 Uploading to S3...`);
      const { s3Url, httpsUrl } = await uploadToS3(localPath, s3Key);
      console.log(`   ✓ Uploaded to S3\n`);

      manifest.push({
        filename: form.filename,
        title: form.title,
        original_url: form.url,
        s3_url: s3Url,
        https_url: httpsUrl,
        local_path: localPath,
        file_size_bytes: stats.size,
        file_size_mb: parseFloat(sizeMB),
        downloaded_at: new Date().toISOString(),
        jurisdiction: 'cincinnati-oh',
        document_type: 'permit-form'
      });

      successCount++;
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Save manifest
  const manifestPath = path.join(LOCAL_DOWNLOAD_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ Saved manifest to: ${manifestPath}\n`);

  // Upload manifest to S3
  try {
    const manifestKey = `${S3_PREFIX}manifest.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: manifestKey,
      Body: fs.readFileSync(manifestPath),
      ContentType: 'application/json'
    }));
    console.log(`✓ Uploaded manifest to S3: s3://${S3_BUCKET}/${manifestKey}\n`);
  } catch (error: any) {
    console.log(`⚠ Failed to upload manifest to S3: ${error.message}\n`);
  }

  // Summary
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  Summary                                                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  console.log(`📊 Total documents: ${permitForms.length}`);
  console.log(`✓ Successfully processed: ${successCount}\n`);
  console.log(`📁 Local files: ${LOCAL_DOWNLOAD_DIR}`);
  console.log(`☁️  S3 location: s3://${S3_BUCKET}/${S3_PREFIX}\n`);

  const totalSizeMB = manifest.reduce((sum, doc) => sum + doc.file_size_mb, 0).toFixed(2);
  console.log(`💾 Total size: ${totalSizeMB} MB\n`);

  console.log(`📋 Downloaded forms:`);
  for (const doc of manifest) {
    console.log(`   • ${doc.title}`);
  }

  console.log(`\n✅ Complete! Permit forms are now in S3.`);
  console.log(`\n📄 Next step: Review PDFs and create permit requirements CSV`);
}

main().catch(console.error);
