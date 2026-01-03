/**
 * Master seed script for all industry-specific data
 *
 * Run with: npx tsx prisma/seed-all-industries.ts
 *
 * This script seeds all industry knowledge data including:
 *
 * OHIO (4 counties: Hamilton, Butler, Warren, Clermont):
 * - Short-term Rentals (Airbnb, VRBO, B&Bs)
 * - Cannabis/CBD (dispensaries, cultivation, retail)
 * - Homeowner Projects (decks, fences, pools, ADUs)
 * - Professional Services (law offices, accounting, medical offices)
 * - Warehousing/Logistics (warehouses, distribution, self-storage)
 *
 * KENTUCKY (3 counties: Boone, Kenton, Campbell):
 * - Short-term Rentals (KY transient room tax, Covington/Newport rules)
 * - Cannabis/CBD (medical only - recreational illegal in KY)
 * - Homeowner Projects (KY Building Code, 24" frost line)
 * - Professional Services (KY occupational license tax)
 * - Warehousing/Logistics (CVG hub, KY regulatory agencies)
 *
 * For additional industries, also run the individual seed files.
 */

// Ohio seed functions
import { seedShortTermRentals } from './seed-short-term-rentals';
import { seedCannabisIndustry } from './seed-cannabis-industry';
import { seedHomeownerProjects } from './seed-homeowner-projects';
import { seedProfessionalServices } from './seed-professional-services';
import { seedWarehousingLogistics } from './seed-warehousing-logistics';

// Kentucky seed functions
import { seedShortTermRentalsKY } from './seed-short-term-rentals-ky';
import { seedCannabisIndustryKY } from './seed-cannabis-industry-ky';
import { seedHomeownerProjectsKY } from './seed-homeowner-projects-ky';
import { seedProfessionalServicesKY } from './seed-professional-services-ky';
import { seedWarehousingLogisticsKY } from './seed-warehousing-logistics-ky';

async function seedAllIndustries() {
  console.log('='.repeat(60));
  console.log('SEEDING ALL INDUSTRY DATA (OHIO + KENTUCKY)');
  console.log('='.repeat(60));
  console.log('');

  try {
    // ========================================
    // OHIO INDUSTRIES (4 counties)
    // ========================================
    console.log('>>> OHIO INDUSTRIES (Hamilton, Butler, Warren, Clermont)');
    console.log('-'.repeat(60));

    console.log('[OH 1/5] Short-term Rentals...');
    await seedShortTermRentals();
    console.log('');

    console.log('[OH 2/5] Cannabis/CBD Industry...');
    await seedCannabisIndustry();
    console.log('');

    console.log('[OH 3/5] Homeowner Projects...');
    await seedHomeownerProjects();
    console.log('');

    console.log('[OH 4/5] Professional Services...');
    await seedProfessionalServices();
    console.log('');

    console.log('[OH 5/5] Warehousing/Logistics...');
    await seedWarehousingLogistics();
    console.log('');

    // ========================================
    // KENTUCKY INDUSTRIES (3 counties)
    // ========================================
    console.log('>>> KENTUCKY INDUSTRIES (Boone, Kenton, Campbell)');
    console.log('-'.repeat(60));

    console.log('[KY 1/5] Short-term Rentals...');
    await seedShortTermRentalsKY();
    console.log('');

    console.log('[KY 2/5] Cannabis/CBD Industry...');
    await seedCannabisIndustryKY();
    console.log('');

    console.log('[KY 3/5] Homeowner Projects...');
    await seedHomeownerProjectsKY();
    console.log('');

    console.log('[KY 4/5] Professional Services...');
    await seedProfessionalServicesKY();
    console.log('');

    console.log('[KY 5/5] Warehousing/Logistics...');
    await seedWarehousingLogisticsKY();
    console.log('');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('='.repeat(60));
    console.log('ALL INDUSTRY SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('OHIO industries seeded (4 counties):');
    console.log('  - Short-term Rentals (Airbnb/VRBO)');
    console.log('  - Cannabis/CBD (recreational legal since Nov 2023)');
    console.log('  - Homeowner Projects');
    console.log('  - Professional Services');
    console.log('  - Warehousing/Logistics');
    console.log('');
    console.log('KENTUCKY industries seeded (3 counties):');
    console.log('  - Short-term Rentals (KY transient room tax)');
    console.log('  - Cannabis/CBD (medical only starting Jan 2025)');
    console.log('  - Homeowner Projects (24" frost line)');
    console.log('  - Professional Services (occupational license tax)');
    console.log('  - Warehousing/Logistics (CVG logistics hub)');
    console.log('');
    console.log('For additional industries, also run:');
    console.log('  npx tsx prisma/seed-food-business.ts');
    console.log('  npx tsx prisma/seed-beauty-industry.ts');
    console.log('  npx tsx prisma/seed-pet-industry.ts');
    console.log('  npx tsx prisma/seed-fitness-industry.ts');
    console.log('  npx tsx prisma/seed-childcare-industry.ts');
    console.log('  npx tsx prisma/seed-industries.ts');
    console.log('  npx tsx prisma/seed-industries-oh.ts');
    console.log('  npx tsx prisma/seed-industries-ky.ts');

  } catch (error) {
    console.error('Error seeding industry data:', error);
    throw error;
  }
}

// Run if called directly
seedAllIndustries()
  .then(() => {
    console.log('\nSeeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

export { seedAllIndustries };
