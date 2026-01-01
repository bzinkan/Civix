# Cincinnati Address → Zone Lookup System

Complete guide for setting up address-based zoning lookups.

## Overview

This system enables users to look up zoning information by street address:

**User Input**: "123 Main St, Cincinnati, OH"
↓
**Parcel Data**: Address + Parcel ID + Coordinates
↓
**Zoning Data**: Zone Code + Description (matched by spatial intersection)
↓
**Result**: "SF-4 (Single Family Residential)"

## The Data Chain

### 1. Parcel Data (Addresses)
- **Source**: CAGIS Auditor Parcel Information API
- **Contains**: Street addresses, parcel IDs, ownership, land use
- **Records**: ~200,000 parcels in Hamilton County

### 2. Zoning Data (Polygons)
- **Source**: CAGIS Zoning MapServer API
- **Contains**: Zoning codes, zoning descriptions, polygon boundaries
- **Records**: ~2,000-50,000 zoning districts

### 3. Spatial Join
- Matches parcel centroids (lat/lon) to zoning polygons
- Creates address → zone code mapping

## Setup Steps

### Step 1: Fetch Zoning Polygons ✅ DONE

```bash
npx tsx scripts/fetch-cagis-zoning.ts cmjtegbhx0000mm2kzoehlezj
```

**What it does:**
- Fetches zoning polygons from CAGIS
- Loads zone codes and geometries into `ZoningParcel` table
- Status: **2,000 records loaded**

### Step 2: Fetch Parcel Data with Addresses

```bash
npx tsx scripts/fetch-cagis-parcels.ts cmjtegbhx0000mm2kzoehlezj
```

**What it does:**
- Fetches ALL parcels from CAGIS (~200,000)
- Paginates through results (1000 at a time)
- Extracts: address, parcel ID, coordinates
- Loads into `ZoningParcel` table with `zoneCode = 'UNKNOWN'`
- Saves raw data to `data/cincinnati/cagis-parcels-raw.geojson`

**Estimated time:** 10-15 minutes for 200,000 parcels

### Step 3: Match Parcels to Zones

```bash
npx tsx scripts/match-parcels-to-zones.ts cmjtegbhx0000mm2kzoehlezj
```

**What it does:**
- Performs spatial join: parcel centroid → zoning polygon
- Updates parcels with correct zone codes
- Uses point-in-polygon algorithm

**Estimated time:** 20-30 minutes for 200,000 parcels

## API Endpoint

### GET /api/zoning

Look up zoning by address.

**Request:**
```
GET /api/zoning?address=123+Main+St&city=Cincinnati&state=OH
```

**Response:**
```json
{
  "address": "123 MAIN ST, CINCINNATI, OH 45202",
  "parcelId": "ABC123",
  "zoning": {
    "code": "SF-4",
    "description": "Single Family Residential"
  },
  "coordinates": {
    "latitude": 39.1031,
    "longitude": -84.5120
  },
  "jurisdiction": {
    "id": "cmjtegbhx0000mm2kzoehlezj",
    "name": "Cincinnati",
    "state": "OH"
  },
  "lastVerified": "2025-12-31T12:00:00Z"
}
```

**Error Responses:**

404 - Address not found:
```json
{
  "error": "Address not found in zoning database",
  "suggestion": "Try a different address format or check the address spelling"
}
```

## Usage in App

### Ordinance Query with Zone Context

When a user asks: "Can I build a fence at 123 Main St?"

1. **Look up zone:**
   ```typescript
   const zoneResponse = await fetch(`/api/zoning?address=123+Main+St&city=Cincinnati&state=OH`);
   const { zoning } = await zoneResponse.json();
   // zoning.code = "SF-4"
   ```

2. **Include in AI prompt:**
   ```typescript
   const enhancedQuestion = `Can I build a fence? My property is zoned ${zoning.code} (${zoning.description}).`;
   ```

3. **AI searches ordinances with zone context:**
   - Finds fence regulations for SF-4 zones
   - Provides specific height/setback requirements
   - Cites relevant ordinance sections

## Database Schema

### ZoningParcel Table

```prisma
model ZoningParcel {
  id              String       @id @default(cuid())
  jurisdictionId  String

  // From Parcel API
  address         String       // "123 MAIN ST, CINCINNATI, OH 45202"
  parcelId        String?      // "ABC123"

  // From Zoning API (matched via spatial join)
  zoneCode        String       // "SF-4", "RM-2.0", etc.
  zoneDescription String?      // "Single Family Residential"

  // Geographic data
  latitude        Float?       // Parcel centroid
  longitude       Float?
  geometry        Json?        // GeoJSON polygon

  @@unique([jurisdictionId, parcelId])
  @@index([jurisdictionId, address])
}
```

## CAGIS API Endpoints

### Parcels (with Addresses)
```
https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/AuditorParcelInformation/MapServer/0/query
```

**Key Fields:**
- `SITEADDR` - Street address
- `PARCELID` - Parcel ID
- `SITECITY`, `SITEZIP` - City and ZIP
- `geometry` - Parcel polygon

**Pagination:**
- `resultRecordCount=1000` - Max per request
- `resultOffset=0` - Starting offset
- Increment offset by 1000 for each page

### Zoning (Polygons)
```
https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4/query
```

**Key Fields:**
- `ZONING` - Zone code (e.g., "SF-4-T")
- `ZONE_TYPE` - Zone type
- `DIS_NAME` - District name
- `geometry` - Zoning polygon

## Troubleshooting

### "No parcels to match. All parcels already have zones."

✅ **This is good!** Means matching is already complete.

### "No zoning polygons found."

❌ Run Step 1 first: `npx tsx scripts/fetch-cagis-zoning.ts <jurisdiction-id>`

### "Address not found in zoning database"

Possible causes:
1. Parcel data not loaded - Run Step 2
2. Parcels not matched to zones - Run Step 3
3. Address format mismatch - Try different format
4. Address outside Cincinnati/Hamilton County

### API returns 404 for known address

Check:
1. Address spelling and format
2. Run: `npx tsx scripts/list-jurisdictions.ts` to verify jurisdiction
3. Check database:
   ```sql
   SELECT COUNT(*) FROM "ZoningParcel" WHERE "zoneCode" != 'UNKNOWN';
   ```

## Performance

### Database Size
- **Parcels**: ~200,000 records × ~500 bytes = ~100 MB
- **With Geometry**: ~200,000 × 2 KB = ~400 MB
- **Total**: ~500 MB for complete Cincinnati parcel + zoning data

### Query Performance
- Address lookup: < 100ms (indexed)
- Zone matching (one-time): 20-30 minutes
- API response: < 200ms

### Scaling to 100 Cities
- 100 cities × 500 MB = 50 GB
- Still well within RDS limits
- Address lookups remain fast (indexed by jurisdiction + address)

## Next Steps

After completing zoning setup:

1. **Test API:**
   ```bash
   curl "http://localhost:3001/api/zoning?address=123+Main+St&city=Cincinnati&state=OH"
   ```

2. **Integrate with Ordinance Chat:**
   - Modify `app/api/ordinances/query/route.ts`
   - Add zone lookup before AI query
   - Include zone context in prompt

3. **Add to Chat Interface:**
   - Show zone info in chat sidebar
   - Display on location selection
   - Link to zoning ordinances

4. **Expand to Other Cities:**
   - Columbus, OH
   - Cleveland, OH
   - Top 20 Ohio cities
   - Replicate CAGIS workflow for each

## Files Reference

### Scripts
- `scripts/fetch-cagis-zoning.ts` - Fetch zoning polygons
- `scripts/fetch-cagis-parcels.ts` - Fetch parcels with addresses
- `scripts/match-parcels-to-zones.ts` - Spatial join
- `scripts/list-jurisdictions.ts` - List database jurisdictions

### API
- `app/api/zoning/route.ts` - Address → zone lookup endpoint

### Config
- `config/data-sources.json` - CAGIS API documentation
- `prisma/schema.prisma` - ZoningParcel model

### Data
- `data/cincinnati/cagis-zoning-raw.geojson` - Raw zoning polygons
- `data/cincinnati/cagis-parcels-raw.geojson` - Raw parcel data

## Complete Workflow Summary

```bash
# 1. Get jurisdiction ID
npx tsx scripts/list-jurisdictions.ts

# 2. Fetch zoning polygons (✅ already done - 2,000 loaded)
npx tsx scripts/fetch-cagis-zoning.ts cmjtegbhx0000mm2kzoehlezj

# 3. Fetch parcels with addresses (~200,000, takes 10-15 min)
npx tsx scripts/fetch-cagis-parcels.ts cmjtegbhx0000mm2kzoehlezj

# 4. Match parcels to zones (takes 20-30 min)
npx tsx scripts/match-parcels-to-zones.ts cmjtegbhx0000mm2kzoehlezj

# 5. Test API
curl "http://localhost:3001/api/zoning?address=123+Main+St&city=Cincinnati&state=OH"
```

✅ After these steps, users can look up zoning by address!
