import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  // Check Cincinnati's data
  const cincinnati = await prisma.jurisdiction.findUnique({
    where: { id: 'cincinnati-oh' },
    include: {
      _count: {
        select: {
          zoning: true,
          ordinanceChunks: true,
        },
      },
    },
  });

  // Count related data
  const zoningCount = await prisma.zoningDistrict.count({
    where: { jurisdictionId: 'cincinnati-oh' },
  });
  const permitCount = await prisma.permitRequirement.count({
    where: { jurisdictionId: 'cincinnati-oh' },
  });
  const codeCount = await prisma.buildingCodeChunk.count({
    where: { jurisdictionId: 'cincinnati-oh' },
  });
  const questionCount = await prisma.commonQuestion.count({
    where: { jurisdictionId: 'cincinnati-oh' },
  });

  console.log('Cincinnati Data:');
  console.log('  Status:', cincinnati?.status);
  console.log('  Zoning Districts:', zoningCount);
  console.log('  Permit Requirements:', permitCount);
  console.log('  Building Code Chunks:', codeCount);
  console.log('  Common Questions:', questionCount);

  // Count planned jurisdictions
  const planned = await prisma.jurisdiction.count({
    where: { status: 'planned' },
  });
  console.log('\nPlanned jurisdictions to extract:', planned);

  // List them
  const allPlanned = await prisma.jurisdiction.findMany({
    where: { status: 'planned' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  console.log('\nCities to extract:');
  allPlanned.forEach((j) => console.log('  -', j.id));

  await prisma.$disconnect();
}

check();
