import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testS3Connection() {
  console.log('🔧 Testing AWS S3 Connection...\n');

  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
    },
  });

  const bucketName = process.env.AWS_S3_BUCKET || 'civix-documents';

  try {
    // Test 1: List buckets (verify credentials)
    console.log('✓ Step 1: Testing credentials...');
    const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}));
    console.log(`  Found ${listBucketsResponse.Buckets?.length || 0} bucket(s)`);

    const bucketExists = listBucketsResponse.Buckets?.some(b => b.Name === bucketName);
    if (bucketExists) {
      console.log(`  ✓ Bucket "${bucketName}" found!\n`);
    } else {
      console.log(`  ⚠ Bucket "${bucketName}" not found in list\n`);
      return;
    }

    // Test 2: Upload a test file
    console.log('✓ Step 2: Uploading test file...');
    const testContent = `# Civix Test File
Created: ${new Date().toISOString()}
Purpose: Verify S3 upload capability

This file confirms that:
✓ AWS credentials are valid
✓ S3 bucket is accessible
✓ File upload works correctly
`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test/connection-test.txt',
      Body: testContent,
      ContentType: 'text/plain',
    }));
    console.log('  ✓ Test file uploaded to test/connection-test.txt\n');

    // Test 3: Read the file back
    console.log('✓ Step 3: Reading test file...');
    const getResponse = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: 'test/connection-test.txt',
    }));

    const downloadedContent = await getResponse.Body?.transformToString();
    console.log('  ✓ Test file retrieved successfully\n');

    // Test 4: Create folder structure
    console.log('✓ Step 4: Creating folder structure...');

    const folders = [
      'cincinnati-oh/ordinances/',
      'cincinnati-oh/building-codes/',
      'cincinnati-oh/zoning/',
      'cincinnati-oh/permits/',
    ];

    for (const folder of folders) {
      // S3 doesn't have folders, but we create empty objects with trailing slashes
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: folder + '.placeholder',
        Body: 'This is a placeholder file to create the folder structure.',
        ContentType: 'text/plain',
      }));
      console.log(`  ✓ Created: ${folder}`);
    }

    console.log('\n✅ SUCCESS! S3 connection fully working.\n');
    console.log('📁 Folder structure created:');
    console.log('   civix-documents/');
    console.log('   ├── cincinnati-oh/');
    console.log('   │   ├── ordinances/');
    console.log('   │   ├── building-codes/');
    console.log('   │   ├── zoning/');
    console.log('   │   └── permits/');
    console.log('   └── test/');
    console.log('\n✓ Ready to upload Cincinnati documents!');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);

    if (error.name === 'CredentialsProviderError') {
      console.error('\n⚠ AWS credentials not found or invalid.');
      console.error('Make sure .env.local has:');
      console.error('  AWS_S3_ACCESS_KEY_ID=...');
      console.error('  AWS_S3_SECRET_ACCESS_KEY=...');
      console.error('  AWS_REGION=us-east-2');
    } else if (error.name === 'NoSuchBucket') {
      console.error(`\n⚠ Bucket "${bucketName}" does not exist.`);
      console.error('Create it in AWS Console or use AWS CLI.');
    }
  }
}

testS3Connection();
