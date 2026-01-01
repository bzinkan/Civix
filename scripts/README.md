# Civix Data Management Scripts

This folder contains utility scripts for managing Cincinnati (and future city) data.

## 🚀 Quick Start

All scripts use environment variables from `.env.local`. Make sure your AWS and database credentials are configured.

**Script Types:**
- **TypeScript (.ts)** - Database operations, API integration, S3 uploads
- **Python (.py)** - Web scraping, PDF processing, data extraction

**Python Setup:** See [PYTHON_SETUP.md](PYTHON_SETUP.md) for installing Python dependencies.

## 📂 AWS S3 Scripts

### Test S3 Connection
Verify that S3 is configured correctly and create folder structure.

```bash
npx tsx scripts/test-s3-connection.ts
```

**What it does:**
- ✓ Tests AWS credentials
- ✓ Verifies bucket exists
- ✓ Creates folder structure for Cincinnati
- ✓ Uploads test file to verify permissions

### Upload Files to S3
Upload documents (PDFs, CSVs, etc.) to the correct S3 location.

```bash
# Upload a file
npx tsx scripts/s3-upload.ts upload <local-file> <s3-key>

# List files in S3
npx tsx scripts/s3-upload.ts list [prefix]
```

**Examples:**
```bash
# Upload zoning map
npx tsx scripts/s3-upload.ts upload ./zoning-map.pdf cincinnati-oh/zoning/zoning-map-2024.pdf

# Upload building code
npx tsx scripts/s3-upload.ts upload ./ibc-2021.pdf cincinnati-oh/building-codes/ibc-2021.pdf

# List Cincinnati files
npx tsx scripts/s3-upload.ts list cincinnati-oh/

# List all files
npx tsx scripts/s3-upload.ts list
```

### Upload Cincinnati Documents
One-time script to upload the existing Cincinnati ordinance file.

```bash
npx tsx scripts/upload-cincinnati-docs.ts
```

## 📊 Database Loading Scripts

### Load Ordinances (Already Done for Cincinnati)
Process and load ordinance chunks with embeddings.

```bash
npx tsx scripts/load-ordinances-to-rds.ts
```

**Status:** ✅ Cincinnati ordinances loaded (1,418 chunks)

### Verify Ordinances
Check that ordinances are properly loaded with embeddings.

```bash
npx tsx scripts/verify-ordinances.ts [jurisdiction-id]
```

**Example:**
```bash
npx tsx scripts/verify-ordinances.ts cincinnati-oh
```

### Fetch Cincinnati Zoning from CAGIS API ⭐ NEW!
Automatically fetch zoning data from Hamilton County's GIS system.

```bash
npx tsx scripts/fetch-cagis-zoning.ts [jurisdiction-id]
```

**What it does:**
- Fetches ~50,000 parcel records from CAGIS API
- Extracts zoning codes, addresses, and geometry
- Loads directly into RDS ZoningParcel table
- Saves raw GeoJSON to `data/cincinnati/` for reference

**Example:**
```bash
npx tsx scripts/fetch-cagis-zoning.ts cincinnati-oh
```

**Data Source:**
- API: https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4
- See [config/data-sources.json](../config/data-sources.json) for full API documentation

### Load Zoning Data from CSV (Alternative Method)
Load parcel-to-zone mapping from CSV file if you have custom data.

```bash
npx tsx scripts/load-zoning-data.ts <csv-file> [jurisdiction-id]
```

**CSV Format:**
```csv
address,parcelId,zoneCode,zoneDescription,latitude,longitude
"123 Main St",ABC123,R-1,"Single Family Residential",39.1031,-84.5120
"456 Oak Ave",DEF456,C-2,"Commercial",39.1045,-84.5135
```

**Example:**
```bash
npx tsx scripts/load-zoning-data.ts ./cincinnati-parcels.csv cincinnati-oh
```

### Scrape Cincinnati Permit Forms 🐍 PYTHON ⭐ NEW!
Automatically scrape and download all permit forms from Cincinnati's building department.

```bash
python scripts/scrape-cincinnati-permits.py
```

**What it does:**
- Scrapes https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/application-forms/
- Downloads all PDF forms to `data/cincinnati/permits/`
- Uploads to S3: `cincinnati-oh/permits/`
- Creates `manifest.json` with metadata

**Output:**
- Local PDFs in `data/cincinnati/permits/`
- S3 uploads to `s3://civix-documents/cincinnati-oh/permits/`
- Manifest with URLs, titles, file sizes

**Requirements:**
```bash
pip install -r scripts/requirements.txt
```

See [PYTHON_SETUP.md](PYTHON_SETUP.md) for Python setup instructions.

### Load Permit Requirements from CSV
Load permit requirements from CSV (manual data entry).

```bash
npx tsx scripts/load-permit-requirements.ts <csv-file> [jurisdiction-id]
```

**CSV Format:**
```csv
activityType,requiresPermit,permitType,estimatedFee,processingDays,documents
fence,true,Zoning Certificate,50,5-10,"Site plan,Property survey"
shed,true,Building Permit,100,10-15,"Site plan,Foundation details"
deck,true,Building Permit,125,10-15,"Structural drawings,Site plan"
```

**Example:**
```bash
npx tsx scripts/load-permit-requirements.ts ./cincinnati-permits.csv cincinnati-oh
```

## 🧪 Testing Scripts

### Test Ordinance Query
Test the RAG pipeline with a sample question.

```bash
npx tsx scripts/test-ordinance-query.ts
```

**What it does:**
- Tests semantic search with embeddings
- Shows top matching ordinance chunks
- Tests AI synthesis with citations

## 📋 Data Collection Workflow

### For Each New City:

#### 1. Set Up Jurisdiction
```bash
# Manually create in database or add to seed script
# jurisdictionId format: "city-state" (e.g., "columbus-oh")
```

#### 2. Collect Ordinances
- Download municipal code (PDF or TXT)
- Place in `public/ordinances/{city}/`
- Run: `npx tsx scripts/load-ordinances-to-rds.ts`

#### 3. Collect Zoning Data
- Get parcel-to-zone mapping (CSV/shapefile)
- Upload map PDFs to S3:
  ```bash
  npx tsx scripts/s3-upload.ts upload ./zoning-map.pdf {city}/zoning/zoning-map-2024.pdf
  ```
- Load data to RDS:
  ```bash
  npx tsx scripts/load-zoning-data.ts ./parcels.csv {city}
  ```

#### 4. Collect Permit Requirements
- Research permit rules by activity type
- Create CSV with requirements
- Load to RDS:
  ```bash
  npx tsx scripts/load-permit-requirements.ts ./permits.csv {city}
  ```

#### 5. Collect Building Codes
- Download IBC/IRC PDFs + local amendments
- Upload to S3:
  ```bash
  npx tsx scripts/s3-upload.ts upload ./ibc-2021.pdf {city}/building-codes/ibc-2021.pdf
  npx tsx scripts/s3-upload.ts upload ./irc-2021.pdf {city}/building-codes/irc-2021.pdf
  ```
- Extract text, chunk, and generate embeddings (script TBD)

## 📁 S3 Folder Structure

```
civix-documents/
├── cincinnati-oh/
│   ├── ordinances/
│   │   ├── full-ordinances.txt (7.76 MB) ✅
│   │   └── README.md ✅
│   ├── building-codes/
│   ├── zoning/
│   └── permits/
├── columbus-oh/ (future)
└── test/
```

## 🔑 Environment Variables Required

Make sure `.env.local` has:

```env
# Database
DATABASE_URL=postgresql://...

# AWS S3
AWS_S3_ACCESS_KEY_ID=...
AWS_S3_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
AWS_S3_BUCKET=civix-documents

# AI Providers
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

## ⚠️ Common Issues

### S3 Upload Fails
- Check AWS credentials in `.env.local`
- Verify bucket exists and IAM user has S3 permissions
- Run: `npx tsx scripts/test-s3-connection.ts`

### Database Connection Error
- Check `DATABASE_URL` in `.env.local`
- Verify RDS instance is accessible
- Check security group allows your IP

### Prisma Client Out of Sync
```bash
npx prisma generate
```

## 📝 Adding a New Script

1. Create TypeScript file in `scripts/`
2. Import dotenv and load `.env.local`:
   ```typescript
   import * as dotenv from 'dotenv';
   import * as path from 'path';
   dotenv.config({ path: path.join(process.cwd(), '.env.local') });
   ```
3. Add to `tsconfig.json` exclude if it causes build errors
4. Document in this README

## 🎯 Next Steps

### For Cincinnati:
1. ❌ Find and load zoning data
2. ❌ Create and load permit requirements
3. ❌ Download and upload building codes

### For Other Cities:
1. Replicate Cincinnati workflow
2. Prioritize top 20 cities by population
3. Automate where possible
