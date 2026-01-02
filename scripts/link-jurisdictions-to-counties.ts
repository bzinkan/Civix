/**
 * Link Jurisdictions to their parent County records
 *
 * This enables the flow: address → county → jurisdiction → ordinances
 *
 * Cincinnati Metro Area County Mappings:
 * - Hamilton County, OH: Cincinnati, Forest Park, Norwood, etc.
 * - Warren County, OH: Mason, Lebanon, etc.
 * - Butler County, OH: Hamilton, Fairfield, etc.
 * - Clermont County, OH: Milford, Batavia, etc.
 * - Kenton County, KY: Covington, etc.
 * - Campbell County, KY: Newport, etc.
 * - Boone County, KY: Florence, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map jurisdictions to their counties
// Format: { jurisdictionName: { state: 'XX', countyName: 'County Name' } }
const JURISDICTION_COUNTY_MAP: Record<string, { state: string; countyName: string }> = {
  // Hamilton County, OH
  'Cincinnati': { state: 'OH', countyName: 'Hamilton County' },
  'Forest Park': { state: 'OH', countyName: 'Hamilton County' },
  'Norwood': { state: 'OH', countyName: 'Hamilton County' },
  'Blue Ash': { state: 'OH', countyName: 'Hamilton County' },
  'Madeira': { state: 'OH', countyName: 'Hamilton County' },
  'Loveland': { state: 'OH', countyName: 'Hamilton County' }, // spans Hamilton/Clermont
  'Montgomery': { state: 'OH', countyName: 'Hamilton County' },
  'Deer Park': { state: 'OH', countyName: 'Hamilton County' },
  'Sharonville': { state: 'OH', countyName: 'Hamilton County' },
  'Reading': { state: 'OH', countyName: 'Hamilton County' },
  'Springdale': { state: 'OH', countyName: 'Hamilton County' },
  'Evendale': { state: 'OH', countyName: 'Hamilton County' },
  'Indian Hill': { state: 'OH', countyName: 'Hamilton County' },
  'Mariemont': { state: 'OH', countyName: 'Hamilton County' },
  'Silverton': { state: 'OH', countyName: 'Hamilton County' },
  'Glendale': { state: 'OH', countyName: 'Hamilton County' },
  'Wyoming': { state: 'OH', countyName: 'Hamilton County' },
  'Terrace Park': { state: 'OH', countyName: 'Hamilton County' },
  'Amberley Village': { state: 'OH', countyName: 'Hamilton County' },
  'Golf Manor': { state: 'OH', countyName: 'Hamilton County' },
  'Woodlawn': { state: 'OH', countyName: 'Hamilton County' },
  'Lincoln Heights': { state: 'OH', countyName: 'Hamilton County' },

  // Warren County, OH
  'Mason': { state: 'OH', countyName: 'Warren County' },
  'Lebanon': { state: 'OH', countyName: 'Warren County' },

  // Butler County, OH
  'Hamilton': { state: 'OH', countyName: 'Butler County' },
  'Fairfield': { state: 'OH', countyName: 'Butler County' },
  'Middletown': { state: 'OH', countyName: 'Butler County' },
  'West Chester Township': { state: 'OH', countyName: 'Butler County' },
  'Liberty Township': { state: 'OH', countyName: 'Butler County' },
  'Oxford': { state: 'OH', countyName: 'Butler County' },
  'Monroe': { state: 'OH', countyName: 'Butler County' },
  'Trenton': { state: 'OH', countyName: 'Butler County' },

  // Clermont County, OH
  'Milford': { state: 'OH', countyName: 'Clermont County' },
  'Batavia': { state: 'OH', countyName: 'Clermont County' },
  'Amelia': { state: 'OH', countyName: 'Clermont County' },
  'Goshen Township': { state: 'OH', countyName: 'Clermont County' },
  'Union Township': { state: 'OH', countyName: 'Clermont County' },
  'Pierce Township': { state: 'OH', countyName: 'Clermont County' },

  // Kenton County, KY
  'Covington': { state: 'KY', countyName: 'Kenton County' },
  'Independence': { state: 'KY', countyName: 'Kenton County' },
  'Erlanger': { state: 'KY', countyName: 'Kenton County' },
  'Fort Wright': { state: 'KY', countyName: 'Kenton County' },
  'Park Hills': { state: 'KY', countyName: 'Kenton County' },
  'Edgewood': { state: 'KY', countyName: 'Kenton County' },
  'Villa Hills': { state: 'KY', countyName: 'Kenton County' },
  'Crescent Springs': { state: 'KY', countyName: 'Kenton County' },
  'Fort Mitchell': { state: 'KY', countyName: 'Kenton County' },
  'Lakeside Park': { state: 'KY', countyName: 'Kenton County' },
  'Crestview Hills': { state: 'KY', countyName: 'Kenton County' },

  // Campbell County, KY
  'Newport': { state: 'KY', countyName: 'Campbell County' },
  'Fort Thomas': { state: 'KY', countyName: 'Campbell County' },
  'Bellevue': { state: 'KY', countyName: 'Campbell County' },
  'Dayton': { state: 'KY', countyName: 'Campbell County' },
  'Highland Heights': { state: 'KY', countyName: 'Campbell County' },
  'Southgate': { state: 'KY', countyName: 'Campbell County' },
  'Cold Spring': { state: 'KY', countyName: 'Campbell County' },
  'Alexandria': { state: 'KY', countyName: 'Campbell County' },
  'Wilder': { state: 'KY', countyName: 'Campbell County' },

  // Boone County, KY
  'Florence': { state: 'KY', countyName: 'Boone County' },
  'Union': { state: 'KY', countyName: 'Boone County' },
  'Walton': { state: 'KY', countyName: 'Boone County' },
  'Burlington': { state: 'KY', countyName: 'Boone County' },
  'Hebron': { state: 'KY', countyName: 'Boone County' },
};

async function linkJurisdictionsToCounties() {
  console.log('🔗 Linking Jurisdictions to Counties...\n');

  // Get all jurisdictions
  const jurisdictions = await prisma.jurisdiction.findMany({
    select: {
      id: true,
      name: true,
      state: true,
      county: true,
      countyId: true,
    },
  });

  console.log(`Found ${jurisdictions.length} jurisdictions\n`);

  // Get all counties
  const counties = await prisma.county.findMany({
    select: {
      id: true,
      name: true,
      state: true,
    },
  });

  console.log(`Found ${counties.length} counties:`);
  for (const county of counties) {
    console.log(`  - ${county.name}, ${county.state} (${county.id})`);
  }
  console.log('');

  // Create a lookup map for counties
  const countyLookup = new Map<string, string>();
  for (const county of counties) {
    const key = `${county.name}|${county.state}`;
    countyLookup.set(key, county.id);
  }

  let linked = 0;
  let alreadyLinked = 0;
  let notMapped = 0;
  let countyNotFound = 0;

  for (const jurisdiction of jurisdictions) {
    // Check if already linked
    if (jurisdiction.countyId) {
      console.log(`✓ ${jurisdiction.name}, ${jurisdiction.state} - already linked`);
      alreadyLinked++;
      continue;
    }

    // Look up in our mapping
    const mapping = JURISDICTION_COUNTY_MAP[jurisdiction.name];

    if (!mapping) {
      // Try to use the legacy county field
      if (jurisdiction.county) {
        // Try to match the legacy county string to a county record
        const legacyCountyKey = `${jurisdiction.county}|${jurisdiction.state}`;
        const countyId = countyLookup.get(legacyCountyKey);

        if (countyId) {
          await prisma.jurisdiction.update({
            where: { id: jurisdiction.id },
            data: { countyId },
          });
          console.log(`✓ ${jurisdiction.name}, ${jurisdiction.state} → ${jurisdiction.county} (from legacy field)`);
          linked++;
          continue;
        }
      }

      console.log(`⚠ ${jurisdiction.name}, ${jurisdiction.state} - not in mapping`);
      notMapped++;
      continue;
    }

    // Verify state matches
    if (mapping.state !== jurisdiction.state) {
      console.log(`⚠ ${jurisdiction.name} - state mismatch: ${jurisdiction.state} vs ${mapping.state}`);
      notMapped++;
      continue;
    }

    // Find the county
    const countyKey = `${mapping.countyName}|${mapping.state}`;
    const countyId = countyLookup.get(countyKey);

    if (!countyId) {
      console.log(`✗ ${jurisdiction.name}, ${jurisdiction.state} - county "${mapping.countyName}" not found`);
      countyNotFound++;
      continue;
    }

    // Update the jurisdiction
    await prisma.jurisdiction.update({
      where: { id: jurisdiction.id },
      data: { countyId },
    });

    console.log(`✓ ${jurisdiction.name}, ${jurisdiction.state} → ${mapping.countyName}`);
    linked++;
  }

  console.log('\n========================================');
  console.log('Summary:');
  console.log(`  Linked: ${linked}`);
  console.log(`  Already linked: ${alreadyLinked}`);
  console.log(`  Not in mapping: ${notMapped}`);
  console.log(`  County not found: ${countyNotFound}`);
  console.log('========================================\n');

  // Show final state
  const finalJurisdictions = await prisma.jurisdiction.findMany({
    select: {
      name: true,
      state: true,
      countyRef: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ state: 'asc' }, { name: 'asc' }],
  });

  console.log('Final jurisdiction-county mappings:');
  for (const j of finalJurisdictions) {
    const countyName = j.countyRef?.name ?? '(not linked)';
    console.log(`  ${j.name}, ${j.state} → ${countyName}`);
  }
}

linkJurisdictionsToCounties()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
