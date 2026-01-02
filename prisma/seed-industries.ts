/**
 * Industry-specific permit data seeding
 *
 * Run with: npx tsx prisma/seed-industries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding industry permit data...\n');

  // Get Cincinnati jurisdiction
  let jurisdiction = await prisma.jurisdiction.findFirst({
    where: { id: 'cincinnati-oh' }
  });

  if (!jurisdiction) {
    console.log('Creating Cincinnati jurisdiction...');
    jurisdiction = await prisma.jurisdiction.create({
      data: {
        id: 'cincinnati-oh',
        name: 'Cincinnati',
        state: 'OH',
        type: 'city',
      }
    });
  }

  const jurisdictionId = jurisdiction.id;

  // ============================================
  // HEALTHCARE PERMITS
  // ============================================
  console.log('Adding healthcare permits...');

  const healthcarePermits = [
    {
      activityType: 'medical_office',
      activityDescription: 'Medical or dental office (outpatient only)',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'MG', 'ML'],
      feeBase: 150.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'dental_office',
      activityDescription: 'Dental practice',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'MG', 'ML'],
      feeBase: 150.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'urgent_care',
      activityDescription: 'Urgent care clinic (walk-in medical)',
      category: 'healthcare',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-P', 'CN-M'],
      feeBase: 250.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'outpatient_clinic',
      activityDescription: 'Outpatient medical clinic (specialty)',
      category: 'healthcare',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-P'],
      feeBase: 250.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'physical_therapy_clinic',
      activityDescription: 'Physical therapy or rehabilitation clinic',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*'],
      feeBase: 150.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'ORC 4755',
    },
    {
      activityType: 'chiropractic_office',
      activityDescription: 'Chiropractic practice',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*'],
      feeBase: 150.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'mental_health_clinic',
      activityDescription: 'Mental health or counseling office',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*'],
      feeBase: 100.00,
      processingDays: 7,
      requiresPlans: false,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'pharmacy_retail',
      activityDescription: 'Retail pharmacy',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'OL', 'MG', 'ML'],
      feeBase: 200.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'ORC 4729',
    },
    {
      activityType: 'pharmacy_compounding',
      activityDescription: 'Compounding pharmacy',
      category: 'healthcare',
      zonesRequired: ['CC-M', 'CC-A', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'DD-*', 'MG', 'ML'],
      feeBase: 300.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'ORC 4729',
    },
    {
      activityType: 'medical_lab',
      activityDescription: 'Medical laboratory (blood draw, testing)',
      category: 'healthcare',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*'],
      feeBase: 200.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'ORC 3701',
    },
    {
      activityType: 'imaging_center',
      activityDescription: 'Medical imaging center (X-ray, MRI)',
      category: 'healthcare',
      zonesRequired: ['CC-M', 'CC-A', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'DD-*'],
      feeBase: 350.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'ORC 3701',
    },
    {
      activityType: 'home_health_agency',
      activityDescription: 'Home health agency office',
      category: 'healthcare',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*'],
      feeBase: 100.00,
      processingDays: 7,
      requiresPlans: false,
      requiresInspection: true,
      ordinanceRef: 'ORC 3701',
    },
  ];

  for (const permit of healthcarePermits) {
    await prisma.permitRequirement.upsert({
      where: {
        id: `${jurisdictionId}-${permit.activityType}`,
      },
      update: permit,
      create: {
        id: `${jurisdictionId}-${permit.activityType}`,
        jurisdictionId,
        ...permit,
      },
    });
  }
  console.log(`  Added ${healthcarePermits.length} healthcare permits`);

  // ============================================
  // AUTO INDUSTRY PERMITS
  // ============================================
  console.log('Adding auto industry permits...');

  const autoPermits = [
    {
      activityType: 'auto_repair_shop',
      activityDescription: 'Auto repair / mechanic shop',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 250.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'auto_body_shop',
      activityDescription: 'Auto body and paint shop',
      category: 'auto',
      zonesRequired: ['MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-*', 'DD-*', 'OL'],
      feeBase: 350.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'oil_change_shop',
      activityDescription: 'Quick lube / oil change shop',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 200.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'tire_shop',
      activityDescription: 'Tire sales and installation',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 200.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'auto_glass_shop',
      activityDescription: 'Auto glass repair and replacement',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 150.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'auto_dealership_new',
      activityDescription: 'New car dealership',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL', 'ML'],
      feeBase: 500.00,
      processingDays: 45,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'auto_dealership_used',
      activityDescription: 'Used car dealership',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 300.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'motorcycle_dealer',
      activityDescription: 'Motorcycle dealership',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 250.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'car_wash_full',
      activityDescription: 'Full-service car wash',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 300.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'car_wash_self',
      activityDescription: 'Self-service car wash',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 200.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'car_wash_automatic',
      activityDescription: 'Automatic/tunnel car wash',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL'],
      feeBase: 350.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'parking_lot',
      activityDescription: 'Commercial parking lot',
      category: 'auto',
      zonesRequired: ['CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*'],
      feeBase: 200.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'parking_garage',
      activityDescription: 'Parking garage / structure',
      category: 'auto',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'OL', 'MG', 'ML'],
      feeBase: 500.00,
      processingDays: 45,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'gas_station',
      activityDescription: 'Gas station / fuel sales',
      category: 'auto',
      zonesRequired: ['CC-A', 'MG'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'DD-*', 'OL', 'ML'],
      feeBase: 500.00,
      processingDays: 60,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'OFC 2306',
    },
    {
      activityType: 'towing_company',
      activityDescription: 'Towing company / impound lot',
      category: 'auto',
      zonesRequired: ['MG', 'ML'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-*', 'DD-*', 'OL'],
      feeBase: 250.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
  ];

  for (const permit of autoPermits) {
    await prisma.permitRequirement.upsert({
      where: {
        id: `${jurisdictionId}-${permit.activityType}`,
      },
      update: permit,
      create: {
        id: `${jurisdictionId}-${permit.activityType}`,
        jurisdictionId,
        ...permit,
      },
    });
  }
  console.log(`  Added ${autoPermits.length} auto industry permits`);

  // ============================================
  // RELIGIOUS FACILITY PERMITS
  // ============================================
  console.log('Adding religious facility permits...');

  const religiousPermits = [
    {
      activityType: 'place_of_worship',
      activityDescription: 'Church, mosque, temple, synagogue (religious assembly)',
      category: 'religious',
      zonesRequired: ['SF-*', 'RM-*', 'CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL', 'PF'],
      zonesProhibited: ['MG', 'ML'],
      feeBase: 200.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'religious_school',
      activityDescription: 'Religious school (K-12 attached to place of worship)',
      category: 'religious',
      zonesRequired: ['SF-*', 'RM-*', 'CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'OL', 'PF'],
      zonesProhibited: ['DD-*', 'MG', 'ML'],
      feeBase: 300.00,
      processingDays: 45,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'religious_daycare',
      activityDescription: 'Daycare operated by religious organization',
      category: 'religious',
      zonesRequired: ['SF-*', 'RM-*', 'CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'OL', 'PF'],
      zonesProhibited: ['DD-*', 'MG', 'ML'],
      feeBase: 150.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'ORC 5104',
    },
    {
      activityType: 'religious_community_center',
      activityDescription: 'Community center operated by religious org',
      category: 'religious',
      zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'OL', 'PF'],
      zonesProhibited: ['SF-*', 'RM-*', 'DD-*', 'MG', 'ML'],
      feeBase: 200.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'religious_expansion',
      activityDescription: 'Expansion of existing religious facility',
      category: 'religious',
      zonesRequired: ['*'],
      zonesProhibited: [],
      feeBase: 150.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
  ];

  for (const permit of religiousPermits) {
    await prisma.permitRequirement.upsert({
      where: {
        id: `${jurisdictionId}-${permit.activityType}`,
      },
      update: permit,
      create: {
        id: `${jurisdictionId}-${permit.activityType}`,
        jurisdictionId,
        ...permit,
      },
    });
  }
  console.log(`  Added ${religiousPermits.length} religious facility permits`);

  // ============================================
  // ENTERTAINMENT & EVENT PERMITS
  // ============================================
  console.log('Adding entertainment permits...');

  const entertainmentPermits = [
    {
      activityType: 'event_venue',
      activityDescription: 'Event venue / banquet hall',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 350.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'wedding_venue',
      activityDescription: 'Wedding venue',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C', 'PR'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 300.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'conference_center',
      activityDescription: 'Conference / meeting center',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'MG', 'ML'],
      feeBase: 300.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'movie_theater',
      activityDescription: 'Movie theater / cinema',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 400.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'live_theater',
      activityDescription: 'Live performance theater',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 400.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'concert_venue',
      activityDescription: 'Concert venue / music hall',
      category: 'entertainment',
      zonesRequired: ['CC-A', 'DD-A', 'DD-C', 'MG'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'OL', 'ML'],
      feeBase: 500.00,
      processingDays: 45,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'nightclub',
      activityDescription: 'Nightclub / dance club',
      category: 'entertainment',
      zonesRequired: ['CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'CC-M', 'OL', 'MG', 'ML'],
      feeBase: 400.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'bowling_alley',
      activityDescription: 'Bowling alley',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 300.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'arcade',
      activityDescription: 'Arcade / game center',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 200.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'escape_room',
      activityDescription: 'Escape room / puzzle room',
      category: 'entertainment',
      zonesRequired: ['CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-P', 'OL', 'MG', 'ML'],
      feeBase: 150.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'laser_tag',
      activityDescription: 'Laser tag / indoor recreation',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'MG'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'DD-*', 'OL', 'ML'],
      feeBase: 250.00,
      processingDays: 21,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'mini_golf',
      activityDescription: 'Mini golf / indoor golf',
      category: 'entertainment',
      zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C'],
      zonesProhibited: ['SF-*', 'RM-*', 'CN-*', 'CC-P', 'OL', 'MG', 'ML'],
      feeBase: 200.00,
      processingDays: 14,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 1419',
    },
    {
      activityType: 'special_event_permit',
      activityDescription: 'Special event permit (temporary)',
      category: 'entertainment',
      zonesRequired: ['*'],
      zonesProhibited: [],
      feeBase: 100.00,
      processingDays: 14,
      requiresPlans: false,
      requiresInspection: false,
      ordinanceRef: 'CMC 857',
    },
    {
      activityType: 'outdoor_festival',
      activityDescription: 'Outdoor festival / street fair',
      category: 'entertainment',
      zonesRequired: ['*'],
      zonesProhibited: [],
      feeBase: 250.00,
      processingDays: 30,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 857',
    },
    {
      activityType: 'temporary_stage',
      activityDescription: 'Temporary stage / tent over 400 sqft',
      category: 'entertainment',
      zonesRequired: ['*'],
      zonesProhibited: [],
      feeBase: 150.00,
      processingDays: 7,
      requiresPlans: true,
      requiresInspection: true,
      ordinanceRef: 'CMC 857',
    },
  ];

  for (const permit of entertainmentPermits) {
    await prisma.permitRequirement.upsert({
      where: {
        id: `${jurisdictionId}-${permit.activityType}`,
      },
      update: permit,
      create: {
        id: `${jurisdictionId}-${permit.activityType}`,
        jurisdictionId,
        ...permit,
      },
    });
  }
  console.log(`  Added ${entertainmentPermits.length} entertainment permits`);

  // ============================================
  // BUILDING CODE CHUNKS
  // ============================================
  console.log('\nAdding building code chunks...');

  const buildingCodes = [
    // Healthcare
    {
      codeType: 'IBC',
      section: '304.1',
      title: 'Medical Office Occupancy',
      content: 'Medical offices and outpatient clinics classified as Business (B) occupancy. Ambulatory care facilities treating patients incapable of self-preservation: B occupancy with specific egress requirements.',
    },
    {
      codeType: 'IBC',
      section: '422.1',
      title: 'Ambulatory Care Facilities',
      content: 'Ambulatory care facilities providing medical treatment to patients who are rendered incapable of self-preservation require: sprinkler system, smoke compartments for 50+ patients, emergency power for medical equipment.',
    },
    {
      codeType: 'state',
      section: '4729.27',
      title: 'Pharmacy Requirements',
      content: 'Retail pharmacies require Ohio Board of Pharmacy license. Must have: licensed pharmacist on duty during operating hours, separate prescription area (min 200 sq ft), drug storage meeting DEA requirements, patient consultation area.',
    },
    {
      codeType: 'IBC',
      section: '1224.4',
      title: 'Medical Office Accessibility',
      content: 'Medical care facilities must be fully accessible per ADA. Examination rooms: at least 1 per specialty must accommodate wheelchair transfer. Clear floor space 30x48 inches at exam table.',
    },
    {
      codeType: 'local',
      section: '701.15',
      title: 'Medical Waste Disposal',
      content: 'Medical facilities generating infectious waste must: register with Ohio EPA, contract with licensed medical waste hauler, maintain waste manifests, store in leak-proof containers, dispose within 30 days.',
    },
    // Auto
    {
      codeType: 'IBC',
      section: '311.3',
      title: 'Auto Repair Occupancy',
      content: 'Motor vehicle repair garages classified as S-1 (moderate hazard storage). Spray painting/finishing operations require H-2 or H-3 occupancy separation. Welding areas require fire separation and ventilation.',
    },
    {
      codeType: 'IFC',
      section: '2311.2',
      title: 'Auto Repair Fire Safety',
      content: 'Motor vehicle repair shops require: Class I or II floor drains connected to oil/water separator, portable fire extinguishers (2A:20BC), no smoking signs, maximum 60 gallons flammable liquids storage in approved cabinets.',
    },
    {
      codeType: 'local',
      section: '1025.07',
      title: 'Auto Body Shop Requirements',
      content: 'Auto body/paint shops require: spray booth with approved ventilation (min 100 LFM face velocity), fire suppression in booth, explosion-proof electrical in finishing area, H-2 occupancy classification for paint storage over 120 gallons.',
    },
    {
      codeType: 'local',
      section: '1419-25',
      title: 'Auto Business Zoning',
      content: 'Auto repair, body shops, and dealerships restricted to CC-A, MG, ML zones. Buffer requirements: 50 ft from residential zones. Outdoor storage of vehicles limited to designated areas with screening. No repair work outdoors.',
    },
    {
      codeType: 'IPC',
      section: '1003.4',
      title: 'Auto Shop Floor Drains',
      content: 'Repair garages require floor drains connected to oil/water separator before discharge to sanitary sewer. Separator must be sized for facility (min 100 GPM for small shops). MSD permit required.',
    },
    {
      codeType: 'OFC',
      section: '2306.2',
      title: 'Gas Station Requirements',
      content: 'Motor fuel dispensing facilities require: underground storage tank permits (Ohio BUSTR), spill containment, emergency shutoff switches, fire suppression, 20 ft setback from buildings, canopy over dispensers.',
    },
    // Religious
    {
      codeType: 'IBC',
      section: '303.1',
      title: 'Religious Assembly Occupancy',
      content: 'Churches and religious assembly buildings classified as A-3 occupancy. Occupant load: 7 sq ft per person (unconcentrated seating), 15 sq ft net (concentrated/fixed seating). Buildings over 300 occupants require sprinkler system.',
    },
    {
      codeType: 'local',
      section: '1419-21',
      title: 'Religious Use in Residential Zones',
      content: 'Places of worship are conditionally permitted in residential zones (SF, RM). Conditional use approval required. Must demonstrate adequate parking (1 per 4 seats), traffic management plan, and compatibility with neighborhood.',
    },
    {
      codeType: 'IBC',
      section: '1028.5',
      title: 'Religious Assembly Egress',
      content: 'Assembly spaces require minimum 2 exits when occupant load exceeds 49. Main exit must accommodate 50% of occupant load. Panic hardware required on exit doors serving 50+ occupants.',
    },
    {
      codeType: 'local',
      section: '1425.09',
      title: 'Religious Facility Parking',
      content: 'Places of worship require: 1 parking space per 4 seats in main assembly area, or 1 per 50 sq ft if no fixed seating. May request shared parking agreement with adjacent uses for different peak times.',
    },
    // Entertainment
    {
      codeType: 'IBC',
      section: '303.1-A1',
      title: 'Entertainment Assembly Occupancy',
      content: 'Theaters, concert halls, and nightclubs classified as A-1 occupancy (with fixed seating) or A-2 (food/drink service). Occupant load: 7 sq ft per person standing, 15 sq ft per person seated. Sprinklers required over 300 occupants.',
    },
    {
      codeType: 'IBC',
      section: '410.2',
      title: 'Stage and Platform Requirements',
      content: 'Stages over 1,000 sq ft require: proscenium wall, fire-resistive construction, sprinkler system, smoke control, and stage manager panic button. Platforms under 1,000 sq ft in churches/schools exempt from some requirements.',
    },
    {
      codeType: 'IFC',
      section: '1028.3',
      title: 'Assembly Egress Requirements',
      content: 'Assembly occupancies require: main exit serving 50% of occupant load, minimum 2 exits when load exceeds 49, illuminated exit signs, emergency lighting, panic hardware on doors serving 50+.',
    },
    {
      codeType: 'local',
      section: '910.09',
      title: 'Entertainment Noise Limits',
      content: 'Entertainment venues must not exceed 85 dB at property line during operating hours. Sound studies may be required for venues over 300 capacity. Soundproofing required in mixed-use buildings or within 200 ft of residential.',
    },
    {
      codeType: 'local',
      section: '857.15',
      title: 'Special Event Requirements',
      content: 'Special events over 500 attendees require: traffic management plan, security plan (1 guard per 250 people), emergency medical services, fire department notification, liability insurance ($1M minimum).',
    },
  ];

  for (const code of buildingCodes) {
    const id = `${jurisdictionId}-${code.codeType}-${code.section}`;
    await prisma.buildingCodeChunk.upsert({
      where: { id },
      update: code,
      create: {
        id,
        jurisdictionId,
        ...code,
      },
    });
  }
  console.log(`  Added ${buildingCodes.length} building code chunks`);

  // ============================================
  // COMMON QUESTIONS
  // ============================================
  console.log('\nAdding common questions...');

  const commonQuestions = [
    // Healthcare
    {
      question: 'How do I open a medical office?',
      category: 'healthcare',
      answer: 'To open a medical office in Cincinnati: (1) Verify zoning - allowed in CN, CC, DD, OL zones, (2) Building permit for buildout ($150+), (3) Business license ($50), (4) State medical licensing for practitioners. Key requirements: ADA accessible exam rooms, proper medical waste disposal contract, HIPAA-compliant layout. Outpatient only - no overnight stays in B occupancy.',
      relatedPermits: ['medical_office', 'business_license', 'tenant_buildout'],
      ordinanceRef: 'CMC 1419',
    },
    {
      question: 'What do I need to open a pharmacy?',
      category: 'pharmacy',
      answer: 'Retail pharmacies require: (1) Ohio Board of Pharmacy license, (2) DEA registration for controlled substances, (3) City business license ($50), (4) Building permit for buildout. Space requirements: minimum 200 sq ft prescription area, drug storage meeting DEA specs, patient consultation area. Licensed pharmacist must be on duty during all operating hours.',
      relatedPermits: ['pharmacy_retail', 'business_license'],
      ordinanceRef: 'ORC 4729',
    },
    {
      question: 'Can I open an urgent care clinic?',
      category: 'urgent_care',
      answer: 'Urgent care facilities are allowed in CC-M, CC-A, DD-A, DD-C, and OL zones. Requirements: (1) Urgent care permit ($250), (2) Building permit, (3) Business license, (4) State health facility license. Must have emergency power for medical equipment. If providing ambulatory surgery, additional requirements apply.',
      relatedPermits: ['urgent_care', 'business_license'],
      ordinanceRef: 'CMC 1419',
    },
    // Auto
    {
      question: 'How do I open an auto repair shop?',
      category: 'auto',
      answer: 'Auto repair shops are restricted to CC-A, MG, and ML zones. Requirements: (1) Auto repair permit ($250), (2) Building permit for buildout, (3) Business license ($50), (4) MSD permit for floor drains with oil/water separator, (5) Fire inspection. Must have 50 ft buffer from residential zones, no outdoor repair work, and approved flammable liquid storage.',
      relatedPermits: ['auto_repair_shop', 'business_license', 'tenant_buildout'],
      ordinanceRef: 'CMC 1419',
    },
    {
      question: 'Can I open a used car dealership?',
      category: 'auto_dealer',
      answer: 'Used car dealerships allowed in CC-A, MG, ML zones. Requirements: (1) Ohio dealer license from BMV, (2) City dealer permit ($300), (3) Business license ($50), (4) Lot surfacing and lighting requirements, (5) Screening from adjacent properties. Outdoor display limited to designated areas. Must have 50 ft buffer from residential.',
      relatedPermits: ['auto_dealership_used', 'business_license'],
      ordinanceRef: 'CMC 1419',
    },
    {
      question: 'What permits do I need for a car wash?',
      category: 'car_wash',
      answer: 'Car washes allowed in CC-A, MG, ML zones. Requirements: (1) Car wash permit ($200-350 depending on type), (2) Building permit, (3) Business license ($50), (4) MSD permit for water recycling/discharge, (5) Signage permit. Water recycling may be required. Stacking lane requirements for drive-through style.',
      relatedPermits: ['car_wash_full', 'car_wash_automatic', 'business_license'],
      ordinanceRef: 'CMC 1419',
    },
    // Religious
    {
      question: 'Can I open a church in a residential area?',
      category: 'religious',
      answer: 'Yes, places of worship are conditionally permitted in residential zones (SF, RM). You need: (1) Conditional use approval from Planning Commission, (2) Building permit for any construction, (3) Demonstrate adequate parking (1 space per 4 seats), (4) Traffic management plan. Process typically takes 2-3 months.',
      relatedPermits: ['place_of_worship'],
      ordinanceRef: 'CMC 1419-21',
    },
    {
      question: 'What permits do I need to start a church?',
      category: 'religious',
      answer: 'To establish a place of worship: (1) Verify zoning (allowed in most zones, conditional in residential), (2) Building permit if constructing or renovating ($200+), (3) Fire inspection for assembly occupancy, (4) Certificate of occupancy. No business license required for religious organizations. Parking: 1 space per 4 seats.',
      relatedPermits: ['place_of_worship', 'tenant_buildout'],
      ordinanceRef: 'CMC 1419',
    },
    {
      question: 'Can our church run a daycare?',
      category: 'religious_daycare',
      answer: 'Yes, religious organizations can operate daycares. Requirements: (1) ODJFS childcare license (same as any daycare), (2) City permit ($150), (3) Fire inspection, (4) Building code compliance for childcare. Same staff ratios and safety requirements apply regardless of religious affiliation.',
      relatedPermits: ['religious_daycare'],
      ordinanceRef: 'ORC 5104',
    },
    // Entertainment
    {
      question: 'How do I open an event venue?',
      category: 'entertainment',
      answer: 'Event venues allowed in CC-M, CC-A, DD-A, DD-C zones. Requirements: (1) Event venue permit ($350), (2) Building permit for buildout, (3) Business license ($50), (4) Fire inspection for assembly occupancy, (5) Liquor license if serving alcohol. Must meet egress requirements based on occupancy. Parking: 1 per 4 seats or per fire code capacity.',
      relatedPermits: ['event_venue', 'business_license', 'tenant_buildout'],
      ordinanceRef: 'CMC 1419',
    },
    {
      question: 'What permits do I need for a wedding venue?',
      category: 'wedding_venue',
      answer: 'Wedding venues need: (1) Wedding/event venue permit ($300), (2) Building permit, (3) Business license ($50), (4) Health permit if serving food (or caterer must have license), (5) Liquor license or caterer liquor permit for alcohol. Outdoor venues may need additional conditional use approval.',
      relatedPermits: ['wedding_venue', 'business_license'],
      ordinanceRef: 'CMC 1419',
    },
    {
      question: 'How do I get a special event permit?',
      category: 'special_event',
      answer: 'For temporary events: (1) Special event permit ($100-250 based on size), (2) Apply 30+ days in advance for events over 500 people, (3) May need traffic plan, security plan, insurance. Events on public property need additional street closure permits. Tents over 400 sq ft need separate tent permit ($150).',
      relatedPermits: ['special_event_permit', 'outdoor_festival', 'temporary_stage'],
      ordinanceRef: 'CMC 857',
    },
    {
      question: 'Can I open a nightclub?',
      category: 'nightclub',
      answer: 'Nightclubs restricted to CC-A, DD-A, DD-C zones. Requirements: (1) Nightclub permit ($400), (2) D-5 or D-5K liquor license, (3) Entertainment permit ($200), (4) Building permit, (5) Soundproofing if near residential. Noise limit 85 dB at property line. Security requirements may apply. Extended hours permit ($500) needed to operate past 2:30am.',
      relatedPermits: ['nightclub', 'entertainment_permit', 'd5k_liquor'],
      ordinanceRef: 'CMC 1419',
    },
  ];

  for (const q of commonQuestions) {
    const id = `${jurisdictionId}-${q.category}-${q.question.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
    await prisma.commonQuestion.upsert({
      where: { id },
      update: q,
      create: {
        id,
        jurisdictionId,
        ...q,
      },
    });
  }
  console.log(`  Added ${commonQuestions.length} common questions`);

  console.log('\n✅ Industry permit data seeding complete!');
  console.log(`
Summary:
- Healthcare permits: ${healthcarePermits.length}
- Auto industry permits: ${autoPermits.length}
- Religious facility permits: ${religiousPermits.length}
- Entertainment permits: ${entertainmentPermits.length}
- Building code chunks: ${buildingCodes.length}
- Common questions: ${commonQuestions.length}
  `);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
