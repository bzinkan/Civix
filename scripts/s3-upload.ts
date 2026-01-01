import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET || 'civix-documents';

/**
 * Upload a file to S3
 *
 * Usage:
 *   npx tsx scripts/s3-upload.ts upload <local-file-path> <s3-key>
 *
 * Examples:
 *   npx tsx scripts/s3-upload.ts upload ./zoning-map.pdf cincinnati-oh/zoning/zoning-map-2024.pdf
 *   npx tsx scripts/s3-upload.ts upload ./ibc-2021.pdf cincinnati-oh/building-codes/ibc-2021.pdf
 */
async function uploadFile(localPath: string, s3Key: string) {
  try {
    if (!fs.existsSync(localPath)) {
      console.error(`❌ File not found: ${localPath}`);
      return;
    }

    const fileContent = fs.readFileSync(localPath);
    const fileStats = fs.statSync(localPath);
    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
    const contentType = getContentType(localPath);

    console.log(`📤 Uploading: ${path.basename(localPath)} (${fileSizeMB} MB)`);
    console.log(`   From: ${localPath}`);
    console.log(`   To: s3://${bucketName}/${s3Key}\n`);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'uploaded-date': new Date().toISOString(),
        'original-filename': path.basename(localPath),
      },
    }));

    console.log('✅ Upload successful!\n');
    console.log(`🔗 S3 URL: https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`);

  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
  }
}

/**
 * List files in S3
 *
 * Usage:
 *   npx tsx scripts/s3-upload.ts list <prefix>
 *
 * Examples:
 *   npx tsx scripts/s3-upload.ts list cincinnati-oh/
 *   npx tsx scripts/s3-upload.ts list cincinnati-oh/zoning/
 */
async function listFiles(prefix: string = '') {
  try {
    console.log(`📂 Listing files in: s3://${bucketName}/${prefix}\n`);

    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    }));

    if (!response.Contents || response.Contents.length === 0) {
      console.log('   (empty)');
      return;
    }

    for (const obj of response.Contents) {
      const sizeMB = obj.Size ? (obj.Size / 1024 / 1024).toFixed(2) : '0.00';
      const lastModified = obj.LastModified?.toISOString().split('T')[0] || '';
      console.log(`   ${obj.Key} (${sizeMB} MB) - ${lastModified}`);
    }

    console.log(`\n   Total: ${response.Contents.length} file(s)`);

  } catch (error: any) {
    console.error('❌ List failed:', error.message);
  }
}

/**
 * Get MIME type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.shp': 'application/octet-stream',
    '.dbf': 'application/octet-stream',
    '.shx': 'application/octet-stream',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// CLI interface
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (command === 'upload' && arg1 && arg2) {
  uploadFile(arg1, arg2);
} else if (command === 'list') {
  listFiles(arg1 || '');
} else {
  console.log(`
📦 Civix S3 Upload Utility

Usage:
  Upload file:
    npx tsx scripts/s3-upload.ts upload <local-file> <s3-key>

  List files:
    npx tsx scripts/s3-upload.ts list [prefix]

Examples:
  Upload zoning map:
    npx tsx scripts/s3-upload.ts upload ./zoning.pdf cincinnati-oh/zoning/zoning-map-2024.pdf

  Upload building code:
    npx tsx scripts/s3-upload.ts upload ./ibc.pdf cincinnati-oh/building-codes/ibc-2021.pdf

  List Cincinnati files:
    npx tsx scripts/s3-upload.ts list cincinnati-oh/

  List all files:
    npx tsx scripts/s3-upload.ts list
`);
}
