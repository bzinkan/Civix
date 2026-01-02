import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const CITIES_TO_CHECK = [
  // Ohio
  'cincinnati-oh',
  'norwood-oh',
  'blue-ash-oh',
  'sharonville-oh',
  'mason-oh',
  'fairfield-oh',
  'hamilton-oh',
  'middletown-oh',
  'lebanon-oh',
  'springdale-oh',
  'forest-park-oh',
  'montgomery-oh',
  // Kentucky
  'covington-ky',
  'newport-ky',
  'florence-ky',
  'erlanger-ky',
  'fort-thomas-ky',
  'independence-ky',
];

const MUNICODE_BASE = 'https://library.municode.com';

const MUNICODE_PATHS: Record<string, string> = {
  'cincinnati-oh': '/oh/cincinnati/codes/code_of_ordinances',
  'norwood-oh': '/oh/norwood/codes/code_of_ordinances',
  'blue-ash-oh': '/oh/blue_ash/codes/code_of_ordinances',
  'sharonville-oh': '/oh/sharonville/codes/code_of_ordinances',
  'mason-oh': '/oh/mason/codes/code_of_ordinances',
  'fairfield-oh': '/oh/fairfield/codes/code_of_ordinances',
  'hamilton-oh': '/oh/hamilton/codes/code_of_ordinances',
  'middletown-oh': '/oh/middletown/codes/code_of_ordinances',
  'lebanon-oh': '/oh/lebanon/codes/code_of_ordinances',
  'springdale-oh': '/oh/springdale/codes/code_of_ordinances',
  'forest-park-oh': '/oh/forest_park/codes/code_of_ordinances',
  'montgomery-oh': '/oh/montgomery/codes/code_of_ordinances',
  'covington-ky': '/ky/covington/codes/code_of_ordinances',
  'newport-ky': '/ky/newport/codes/code_of_ordinances',
  'florence-ky': '/ky/florence/codes/code_of_ordinances',
  'erlanger-ky': '/ky/erlanger/codes/code_of_ordinances',
  'fort-thomas-ky': '/ky/fort_thomas/codes/code_of_ordinances',
  'independence-ky': '/ky/independence/codes/code_of_ordinances',
};

async function checkAvailability() {
  console.log('Checking Municode availability for Cincinnati metro cities...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const available: string[] = [];
  const notAvailable: string[] = [];

  for (const cityId of CITIES_TO_CHECK) {
    const path = MUNICODE_PATHS[cityId];
    const url = `${MUNICODE_BASE}${path}`;

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

      const finalUrl = page.url();
      const title = await page.title();

      // Check if we're on the actual city page or got redirected
      const isAvailable = title.includes('Code of Ordinances') && !finalUrl.endsWith('/oh') && !finalUrl.endsWith('/ky');

      if (isAvailable) {
        console.log(`✓ ${cityId} - AVAILABLE`);
        available.push(cityId);
      } else {
        console.log(`✗ ${cityId} - NOT AVAILABLE (redirected)`);
        notAvailable.push(cityId);
      }
    } catch (e: any) {
      console.log(`✗ ${cityId} - ERROR: ${e.message}`);
      notAvailable.push(cityId);
    }

    await page.close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nAvailable on Municode (${available.length}):`);
  available.forEach((c) => console.log(`  - ${c}`));
  console.log(`\nNOT available on Municode (${notAvailable.length}):`);
  notAvailable.forEach((c) => console.log(`  - ${c}`));
}

checkAvailability().catch(console.error);
