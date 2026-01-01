# Cincinnati Complete Data Setup Guide

## Current Status
✅ **Ordinances**: 1,418 chunks loaded in RDS with embeddings
✅ **AWS S3**: Bucket created, credentials configured, folder structure ready
✅ **S3 Upload Tool**: CLI utility for easy file uploads
❌ **Zoning Data**: Not loaded yet
❌ **Permit Requirements**: Not loaded yet
❌ **Building Codes**: Not loaded yet

## Phase 1: RDS Database Schema ✅ COMPLETE

The following tables are now ready in your RDS database:

### 1. `ZoningParcel` - Property Zoning Lookup
**Purpose**: Map addresses to zoning codes
**Fields**:
- `address` - Street address
- `parcelId` - City's parcel ID (optional)
- `zoneCode` - e.g., "R-1", "C-2"
- `zoneDescription` - e.g., "Single Family Residential"
- `latitude`, `longitude` - For mapping
- `geometry` - GeoJSON polygon (optional)

### 2. `PermitRequirement` - What Needs Permits
**Purpose**: Define permit requirements by activity and zone
**Fields**:
- `activityType` - e.g., "fence", "shed", "deck"
- `zoneCode` - Specific zone or null for all zones
- `requiresPermit` - Boolean
- `permitType` - e.g., "Building Permit"
- `requirements` - JSON: { "maxHeight": 6, "setback": 10 }
- `estimatedFee` - Cost in dollars
- `processingDays` - How long it takes
- `documents` - Required documents array

### 3. `BuildingCodeChunk` - Building Code Text
**Purpose**: Searchable building code sections
**Fields**:
- `codeType` - "IBC", "IRC", "local_amendment", "fire_code"
- `codeYear` - e.g., "2021"
- `section` - Section number
- `title` - Section title
- `content` - Full text
- `embedding` - Vector for semantic search
- `s3PdfUrl` - Link to PDF in S3

## Phase 2: Data Collection for Cincinnati

### A. Zoning Data ✅ API FOUND!

**CAGIS (Cincinnati Area Geographic Information System)**

**Zoning API:**
- URL: `https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4/query`
- Format: GeoJSON
- Data: Parcels with zoning codes, descriptions, addresses, geometry

**Parcels API:**
- URL: `https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/AuditorParcelInformation/MapServer`
- Format: GeoJSON
- Data: Parcel IDs, addresses, ownership, land use

**How to load:**
```bash
# Fetch zoning data from CAGIS API and load into RDS
npx tsx scripts/fetch-cagis-zoning.ts cincinnati-oh
```

**What you get:**
- ~50,000 zoning records with addresses and zone codes
- Automatic geocoding (latitude/longitude)
- GeoJSON geometry for mapping
- Linked to ordinances via jurisdictionId

**Configuration saved in:**
- [config/data-sources.json](../config/data-sources.json) - API endpoints and metadata
- [.env.example](../.env.example) - Reference URLs in comments

### B. Permit Requirements ✅ SCRAPER READY!

**Automatic Permit Form Collection (Python)**

**Scrape all permit forms:**
```bash
# Install Python dependencies (one-time)
pip install -r scripts/requirements.txt

# Run scraper
python scripts/scrape-cincinnati-permits.py
```

**What it does:**
- Scrapes: https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/application-forms/
- Downloads all PDF application forms
- Uploads to S3: `cincinnati-oh/permits/`
- Creates `manifest.json` with metadata

**Manual Data Entry (Still Needed)**

After downloading forms, manually extract permit requirements to CSV:

**Data to extract from forms:**
- Fence permits: height limits, setbacks, zones
- Shed permits: size limits, foundation requirements
- Deck permits: structural requirements
- Addition/renovation permits

**Example CSV format:**
```csv
activityType,requiresPermit,permitType,estimatedFee,processingDays,documents
fence,true,Zoning Certificate,50,5-10,"Site plan,property survey"
shed,true,Building Permit,100,10-15,"Site plan,foundation details"
```

**Load to RDS:**
```bash
npx tsx scripts/load-permit-requirements.ts ./permit-requirements.csv cincinnati-oh
```

**See also:**
- [scripts/PYTHON_SETUP.md](../scripts/PYTHON_SETUP.md) - Python setup guide
- [config/data-sources.json](../config/data-sources.json) - All data sources documented

### C. Building Codes

**Cincinnati adopts:**
- **International Building Code (IBC)** - 2021 Edition
- **International Residential Code (IRC)** - 2021 Edition
- **Local amendments** (Cincinnati-specific)

**Where to get:**
- IBC/IRC PDFs: Purchase from ICC (iccsafe.org) or find free versions
- Local amendments: Cincinnati Municipal Code Chapter 1101

**What you need:**
- Extract relevant sections (residential construction)
- Chunk like you did with ordinances
- Generate embeddings for semantic search

## Phase 3: AWS S3 Setup ✅ COMPLETE

### Step 1: Create S3 Bucket ✅
- Bucket name: `civix-documents`
- Region: `us-east-2`
- Status: Created and accessible

### Step 2: Folder Structure ✅

Current structure in S3:
```
civix-documents/
├── cincinnati-oh/
│   ├── ordinances/
│   │   ├── full-ordinances.txt (7.76 MB) ✅
│   │   └── README.md ✅
│   ├── building-codes/ (ready for files)
│   ├── zoning/ (ready for files)
│   └── permits/ (ready for files)
└── test/
    └── connection-test.txt ✅
```

### Step 3: Upload Documents - EASY METHOD! ✅

**Use the S3 Upload Tool:**
```bash
# Upload a file
npx tsx scripts/s3-upload.ts upload <local-file> <s3-key>

# List files
npx tsx scripts/s3-upload.ts list cincinnati-oh/
```

**Examples:**
```bash
# Upload zoning map
npx tsx scripts/s3-upload.ts upload ./zoning-map.pdf cincinnati-oh/zoning/zoning-map-2024.pdf

# Upload building code
npx tsx scripts/s3-upload.ts upload ./ibc-2021.pdf cincinnati-oh/building-codes/ibc-2021.pdf

# Upload permit form
npx tsx scripts/s3-upload.ts upload ./permit-app.pdf cincinnati-oh/permits/building-permit-application.pdf
```

### Step 4: Configure Access ✅

Credentials already added to `.env.local`:
```
AWS_ACCESS_KEY_ID=REDACTED_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=REDACTED_SECRET_KEY
AWS_REGION=us-east-2
AWS_S3_BUCKET=civix-documents
```

**Test connection:**
```bash
npx tsx scripts/test-s3-connection.ts
```

## Phase 4: Can I Access and Organize Your S3? ✅ YES!

**Status: I can now access and manage your S3 bucket!**

✅ **Upload files** - Use `scripts/s3-upload.ts` to upload documents
✅ **Organize files** - Folder structure created and ready
✅ **List files** - View what's in the bucket anytime
✅ **Generate URLs** - Automatic S3 URLs for database records

**What's working:**
- AWS credentials configured in `.env.local`
- S3 client initialized and tested
- Upload/download verified
- Folder structure created

**Next:** Just provide files and I'll upload them to the correct locations!

## Next Steps - Your Action Items

### Immediate (This Week):
1. ~~**Set up S3 bucket**~~ ✅ DONE
2. **Find Cincinnati zoning data** - Check data.cincinnati-oh.gov
3. **Download permit applications** - Cincinnati building dept website
4. **Download building code PDFs** - IBC/IRC 2021

### Data Collection (Next 2 Weeks):
1. **Zoning**: Get CSV/shapefile of parcels → zones
2. **Permits**: Create spreadsheet of permit requirements
3. **Building Codes**: Download IBC/IRC PDFs

### Loading Data (Week 3):
1. Upload PDFs to S3 (I can help)
2. Load zoning data to RDS (I'll write scripts)
3. Load permit requirements to RDS
4. Extract & chunk building codes
5. Generate embeddings for building codes

## Cost Estimate

### S3 Storage:
- PDFs: ~100MB per city = $0.023/month
- 100 cities = $2.30/month

### RDS Storage (current):
- Ordinances: ~50MB
- Zoning: ~10MB
- Permits: ~5MB
- Building codes: ~100MB
- **Total per city: ~165MB**
- **100 cities: ~16GB = covered by free tier or ~$2/month**

### Data Transfer:
- Minimal (only when users download PDFs)
- Estimated: $5-10/month with moderate usage

**Total AWS cost: ~$10-15/month for 100 cities**

## Questions?

Let me know when you're ready to:
1. Set up S3 (I'll walk you through it)
2. Start finding Cincinnati data sources
3. Load the first batch of data

Once Cincinnati is complete, we'll replicate the process for other cities!
