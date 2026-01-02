import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JurisdictionData {
  id: string;
  name: string;
  state: string;
  county: string;
  population: number;
  status: string;
  municodeUrl: string | null;
}

const JURISDICTIONS: JurisdictionData[] = [
  // OHIO - Hamilton County (Cincinnati and suburbs)
  { id: 'cincinnati-oh', name: 'Cincinnati', state: 'OH', county: 'Hamilton County', population: 309000, status: 'live', municodeUrl: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances' },
  { id: 'norwood-oh', name: 'Norwood', state: 'OH', county: 'Hamilton County', population: 20000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/norwood/codes/code_of_ordinances' },
  { id: 'blue-ash-oh', name: 'Blue Ash', state: 'OH', county: 'Hamilton County', population: 13000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/blue_ash/codes/code_of_ordinances' },
  { id: 'sharonville-oh', name: 'Sharonville', state: 'OH', county: 'Hamilton County', population: 14000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/sharonville/codes/code_of_ordinances' },
  { id: 'montgomery-oh', name: 'Montgomery', state: 'OH', county: 'Hamilton County', population: 10500, status: 'planned', municodeUrl: 'https://library.municode.com/oh/montgomery/codes/code_of_ordinances' },
  { id: 'madeira-oh', name: 'Madeira', state: 'OH', county: 'Hamilton County', population: 9000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/madeira/codes/code_of_ordinances' },
  { id: 'reading-oh', name: 'Reading', state: 'OH', county: 'Hamilton County', population: 10500, status: 'planned', municodeUrl: 'https://library.municode.com/oh/reading/codes/code_of_ordinances' },
  { id: 'deer-park-oh', name: 'Deer Park', state: 'OH', county: 'Hamilton County', population: 5700, status: 'planned', municodeUrl: 'https://library.municode.com/oh/deer_park/codes/code_of_ordinances' },
  { id: 'silverton-oh', name: 'Silverton', state: 'OH', county: 'Hamilton County', population: 4800, status: 'planned', municodeUrl: 'https://library.municode.com/oh/silverton/codes/code_of_ordinances' },
  { id: 'golf-manor-oh', name: 'Golf Manor', state: 'OH', county: 'Hamilton County', population: 3700, status: 'planned', municodeUrl: 'https://library.municode.com/oh/golf_manor/codes/code_of_ordinances' },
  { id: 'amberley-village-oh', name: 'Amberley Village', state: 'OH', county: 'Hamilton County', population: 3600, status: 'planned', municodeUrl: 'https://library.municode.com/oh/amberley_village/codes/code_of_ordinances' },
  { id: 'indian-hill-oh', name: 'Indian Hill', state: 'OH', county: 'Hamilton County', population: 6000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/indian_hill/codes/code_of_ordinances' },
  { id: 'mariemont-oh', name: 'Mariemont', state: 'OH', county: 'Hamilton County', population: 3400, status: 'planned', municodeUrl: 'https://library.municode.com/oh/mariemont/codes/code_of_ordinances' },
  { id: 'evendale-oh', name: 'Evendale', state: 'OH', county: 'Hamilton County', population: 2800, status: 'planned', municodeUrl: 'https://library.municode.com/oh/evendale/codes/code_of_ordinances' },
  { id: 'glendale-oh', name: 'Glendale', state: 'OH', county: 'Hamilton County', population: 2200, status: 'planned', municodeUrl: 'https://library.municode.com/oh/glendale/codes/code_of_ordinances' },
  { id: 'woodlawn-oh', name: 'Woodlawn', state: 'OH', county: 'Hamilton County', population: 3500, status: 'planned', municodeUrl: 'https://library.municode.com/oh/woodlawn/codes/code_of_ordinances' },
  { id: 'lincoln-heights-oh', name: 'Lincoln Heights', state: 'OH', county: 'Hamilton County', population: 3200, status: 'planned', municodeUrl: 'https://library.municode.com/oh/lincoln_heights/codes/code_of_ordinances' },
  { id: 'lockland-oh', name: 'Lockland', state: 'OH', county: 'Hamilton County', population: 3400, status: 'planned', municodeUrl: 'https://library.municode.com/oh/lockland/codes/code_of_ordinances' },
  { id: 'wyoming-oh', name: 'Wyoming', state: 'OH', county: 'Hamilton County', population: 8500, status: 'planned', municodeUrl: 'https://library.municode.com/oh/wyoming/codes/code_of_ordinances' },
  { id: 'springdale-oh', name: 'Springdale', state: 'OH', county: 'Hamilton County', population: 11500, status: 'planned', municodeUrl: 'https://library.municode.com/oh/springdale/codes/code_of_ordinances' },
  { id: 'forest-park-oh', name: 'Forest Park', state: 'OH', county: 'Hamilton County', population: 18700, status: 'planned', municodeUrl: 'https://library.municode.com/oh/forest_park/codes/code_of_ordinances' },

  // OHIO - Warren County
  { id: 'mason-oh', name: 'Mason', state: 'OH', county: 'Warren County', population: 34000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/mason/codes/code_of_ordinances' },
  { id: 'lebanon-oh', name: 'Lebanon', state: 'OH', county: 'Warren County', population: 21000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/lebanon/codes/code_of_ordinances' },
  { id: 'loveland-oh', name: 'Loveland', state: 'OH', county: 'Warren County', population: 13000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/loveland/codes/code_of_ordinances' },
  { id: 'franklin-oh', name: 'Franklin', state: 'OH', county: 'Warren County', population: 11900, status: 'planned', municodeUrl: 'https://library.municode.com/oh/franklin/codes/code_of_ordinances' },
  { id: 'springboro-oh', name: 'Springboro', state: 'OH', county: 'Warren County', population: 18000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/springboro/codes/code_of_ordinances' },

  // OHIO - Butler County
  { id: 'hamilton-oh', name: 'Hamilton', state: 'OH', county: 'Butler County', population: 63000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/hamilton/codes/code_of_ordinances' },
  { id: 'fairfield-oh', name: 'Fairfield', state: 'OH', county: 'Butler County', population: 43000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/fairfield/codes/code_of_ordinances' },
  { id: 'middletown-oh', name: 'Middletown', state: 'OH', county: 'Butler County', population: 49000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/middletown/codes/code_of_ordinances' },
  { id: 'oxford-oh', name: 'Oxford', state: 'OH', county: 'Butler County', population: 23000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/oxford/codes/code_of_ordinances' },
  { id: 'trenton-oh', name: 'Trenton', state: 'OH', county: 'Butler County', population: 13000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/trenton/codes/code_of_ordinances' },
  { id: 'monroe-oh', name: 'Monroe', state: 'OH', county: 'Butler County', population: 15000, status: 'planned', municodeUrl: 'https://library.municode.com/oh/monroe/codes/code_of_ordinances' },

  // OHIO - Clermont County
  { id: 'milford-oh', name: 'Milford', state: 'OH', county: 'Clermont County', population: 6800, status: 'planned', municodeUrl: 'https://library.municode.com/oh/milford/codes/code_of_ordinances' },
  { id: 'batavia-oh', name: 'Batavia', state: 'OH', county: 'Clermont County', population: 1500, status: 'planned', municodeUrl: 'https://library.municode.com/oh/batavia/codes/code_of_ordinances' },

  // KENTUCKY - Kenton County
  { id: 'covington-ky', name: 'Covington', state: 'KY', county: 'Kenton County', population: 41000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/covington/codes/code_of_ordinances' },
  { id: 'erlanger-ky', name: 'Erlanger', state: 'KY', county: 'Kenton County', population: 19000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/erlanger/codes/code_of_ordinances' },
  { id: 'fort-mitchell-ky', name: 'Fort Mitchell', state: 'KY', county: 'Kenton County', population: 8500, status: 'planned', municodeUrl: 'https://library.municode.com/ky/fort_mitchell/codes/code_of_ordinances' },
  { id: 'independence-ky', name: 'Independence', state: 'KY', county: 'Kenton County', population: 29000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/independence/codes/code_of_ordinances' },
  { id: 'elsmere-ky', name: 'Elsmere', state: 'KY', county: 'Kenton County', population: 8600, status: 'planned', municodeUrl: 'https://library.municode.com/ky/elsmere/codes/code_of_ordinances' },
  { id: 'edgewood-ky', name: 'Edgewood', state: 'KY', county: 'Kenton County', population: 8800, status: 'planned', municodeUrl: 'https://library.municode.com/ky/edgewood/codes/code_of_ordinances' },
  { id: 'crestview-hills-ky', name: 'Crestview Hills', state: 'KY', county: 'Kenton County', population: 3300, status: 'planned', municodeUrl: 'https://library.municode.com/ky/crestview_hills/codes/code_of_ordinances' },
  { id: 'villa-hills-ky', name: 'Villa Hills', state: 'KY', county: 'Kenton County', population: 7500, status: 'planned', municodeUrl: 'https://library.municode.com/ky/villa_hills/codes/code_of_ordinances' },
  { id: 'lakeside-park-ky', name: 'Lakeside Park', state: 'KY', county: 'Kenton County', population: 2700, status: 'planned', municodeUrl: 'https://library.municode.com/ky/lakeside_park/codes/code_of_ordinances' },
  { id: 'taylor-mill-ky', name: 'Taylor Mill', state: 'KY', county: 'Kenton County', population: 6800, status: 'planned', municodeUrl: 'https://library.municode.com/ky/taylor_mill/codes/code_of_ordinances' },

  // KENTUCKY - Boone County
  { id: 'florence-ky', name: 'Florence', state: 'KY', county: 'Boone County', population: 33000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/florence/codes/code_of_ordinances' },
  { id: 'union-ky', name: 'Union', state: 'KY', county: 'Boone County', population: 7000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/union/codes/code_of_ordinances' },
  { id: 'walton-ky', name: 'Walton', state: 'KY', county: 'Boone County', population: 4000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/walton/codes/code_of_ordinances' },
  { id: 'hebron-ky', name: 'Hebron', state: 'KY', county: 'Boone County', population: 6000, status: 'planned', municodeUrl: null },
  { id: 'burlington-ky', name: 'Burlington', state: 'KY', county: 'Boone County', population: 18000, status: 'planned', municodeUrl: null },

  // KENTUCKY - Campbell County
  { id: 'newport-ky', name: 'Newport', state: 'KY', county: 'Campbell County', population: 15000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/newport/codes/code_of_ordinances' },
  { id: 'fort-thomas-ky', name: 'Fort Thomas', state: 'KY', county: 'Campbell County', population: 16000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/fort_thomas/codes/code_of_ordinances' },
  { id: 'cold-spring-ky', name: 'Cold Spring', state: 'KY', county: 'Campbell County', population: 6500, status: 'planned', municodeUrl: 'https://library.municode.com/ky/cold_spring/codes/code_of_ordinances' },
  { id: 'highland-heights-ky', name: 'Highland Heights', state: 'KY', county: 'Campbell County', population: 7300, status: 'planned', municodeUrl: 'https://library.municode.com/ky/highland_heights/codes/code_of_ordinances' },
  { id: 'bellevue-ky', name: 'Bellevue', state: 'KY', county: 'Campbell County', population: 5800, status: 'planned', municodeUrl: 'https://library.municode.com/ky/bellevue/codes/code_of_ordinances' },
  { id: 'dayton-ky', name: 'Dayton', state: 'KY', county: 'Campbell County', population: 5200, status: 'planned', municodeUrl: 'https://library.municode.com/ky/dayton/codes/code_of_ordinances' },
  { id: 'southgate-ky', name: 'Southgate', state: 'KY', county: 'Campbell County', population: 3900, status: 'planned', municodeUrl: 'https://library.municode.com/ky/southgate/codes/code_of_ordinances' },
  { id: 'alexandria-ky', name: 'Alexandria', state: 'KY', county: 'Campbell County', population: 10000, status: 'planned', municodeUrl: 'https://library.municode.com/ky/alexandria/codes/code_of_ordinances' },
];

async function seedJurisdictions() {
  console.log('Seeding Cincinnati metro jurisdictions...\n');

  let created = 0;
  let updated = 0;

  for (const j of JURISDICTIONS) {
    const existing = await prisma.jurisdiction.findUnique({
      where: { id: j.id },
    });

    if (existing) {
      await prisma.jurisdiction.update({
        where: { id: j.id },
        data: {
          name: j.name,
          state: j.state,
          county: j.county,
          population: j.population,
          // Don't overwrite status if already live
          status: existing.status === 'live' ? 'live' : j.status,
        },
      });
      updated++;
      console.log(`  Updated: ${j.name}, ${j.state}`);
    } else {
      await prisma.jurisdiction.create({
        data: {
          id: j.id,
          name: j.name,
          state: j.state,
          type: 'city',
          county: j.county,
          population: j.population,
          status: j.status,
          dataCompleteness: j.status === 'live' ? 100 : 0,
        },
      });
      created++;
      console.log(`  Created: ${j.name}, ${j.state}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}`);
  console.log(`Total jurisdictions: ${JURISDICTIONS.length}`);
}

seedJurisdictions()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
