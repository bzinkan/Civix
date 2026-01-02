import * as cheerio from 'cheerio';
import { scrapeUrlWithRetry } from './scrapingbee-client';

const MUNICODE_BASE = 'https://library.municode.com';

/**
 * Known Municode paths for Cincinnati metro cities
 */
const MUNICODE_PATHS: Record<string, string> = {
  'cincinnati-oh': '/oh/cincinnati/codes/code_of_ordinances',
  'covington-ky': '/ky/covington/codes/code_of_ordinances',
  'newport-ky': '/ky/newport/codes/code_of_ordinances',
  'florence-ky': '/ky/florence/codes/code_of_ordinances',
  'mason-oh': '/oh/mason/codes/code_of_ordinances',
  'fairfield-oh': '/oh/fairfield/codes/code_of_ordinances',
  'hamilton-oh': '/oh/hamilton/codes/code_of_ordinances',
  'blue-ash-oh': '/oh/blue_ash/codes/code_of_ordinances',
  'norwood-oh': '/oh/norwood/codes/code_of_ordinances',
  'sharonville-oh': '/oh/sharonville/codes/code_of_ordinances',
  'montgomery-oh': '/oh/montgomery/codes/code_of_ordinances',
  'madeira-oh': '/oh/madeira/codes/code_of_ordinances',
  'loveland-oh': '/oh/loveland/codes/code_of_ordinances',
  'milford-oh': '/oh/milford/codes/code_of_ordinances',
  'reading-oh': '/oh/reading/codes/code_of_ordinances',
  'deer-park-oh': '/oh/deer_park/codes/code_of_ordinances',
  'erlanger-ky': '/ky/erlanger/codes/code_of_ordinances',
  'fort-mitchell-ky': '/ky/fort_mitchell/codes/code_of_ordinances',
  'fort-thomas-ky': '/ky/fort_thomas/codes/code_of_ordinances',
  'independence-ky': '/ky/independence/codes/code_of_ordinances',
  'middletown-oh': '/oh/middletown/codes/code_of_ordinances',
  'lebanon-oh': '/oh/lebanon/codes/code_of_ordinances',
  'springdale-oh': '/oh/springdale/codes/code_of_ordinances',
  'forest-park-oh': '/oh/forest_park/codes/code_of_ordinances',
  'wyoming-oh': '/oh/wyoming/codes/code_of_ordinances',
  'indian-hill-oh': '/oh/indian_hill/codes/code_of_ordinances',
  'mariemont-oh': '/oh/mariemont/codes/code_of_ordinances',
  'evendale-oh': '/oh/evendale/codes/code_of_ordinances',
  'glendale-oh': '/oh/glendale/codes/code_of_ordinances',
  'woodlawn-oh': '/oh/woodlawn/codes/code_of_ordinances',
  'lincoln-heights-oh': '/oh/lincoln_heights/codes/code_of_ordinances',
  'lockland-oh': '/oh/lockland/codes/code_of_ordinances',
  'silverton-oh': '/oh/silverton/codes/code_of_ordinances',
  'golf-manor-oh': '/oh/golf_manor/codes/code_of_ordinances',
  'amberley-village-oh': '/oh/amberley_village/codes/code_of_ordinances',
  'springboro-oh': '/oh/springboro/codes/code_of_ordinances',
  'trenton-oh': '/oh/trenton/codes/code_of_ordinances',
  'monroe-oh': '/oh/monroe/codes/code_of_ordinances',
  'oxford-oh': '/oh/oxford/codes/code_of_ordinances',
  'batavia-oh': '/oh/batavia/codes/code_of_ordinances',
  'franklin-oh': '/oh/franklin/codes/code_of_ordinances',
  'elsmere-ky': '/ky/elsmere/codes/code_of_ordinances',
  'edgewood-ky': '/ky/edgewood/codes/code_of_ordinances',
  'crestview-hills-ky': '/ky/crestview_hills/codes/code_of_ordinances',
  'villa-hills-ky': '/ky/villa_hills/codes/code_of_ordinances',
  'lakeside-park-ky': '/ky/lakeside_park/codes/code_of_ordinances',
  'taylor-mill-ky': '/ky/taylor_mill/codes/code_of_ordinances',
  'cold-spring-ky': '/ky/cold_spring/codes/code_of_ordinances',
  'highland-heights-ky': '/ky/highland_heights/codes/code_of_ordinances',
  'bellevue-ky': '/ky/bellevue/codes/code_of_ordinances',
  'dayton-ky': '/ky/dayton/codes/code_of_ordinances',
  'southgate-ky': '/ky/southgate/codes/code_of_ordinances',
  'alexandria-ky': '/ky/alexandria/codes/code_of_ordinances',
  'union-ky': '/ky/union/codes/code_of_ordinances',
  'walton-ky': '/ky/walton/codes/code_of_ordinances',
};

export interface ChapterInfo {
  title: string;
  href: string;
  isZoning: boolean;
  isBuilding: boolean;
  isBusiness: boolean;
  isHealth: boolean;
  isAnimals: boolean;
  isRelevant: boolean;
}

export interface ChapterContent {
  url: string;
  fullText: string;
  sections: Array<{
    number: string;
    title: string;
    text: string;
  }>;
  scrapedAt: Date;
  creditCost?: number;
  error?: string;
}

export interface ScrapeResult {
  jurisdictionId: string;
  municodeUrl: string | null;
  chapters: Array<ChapterInfo & Partial<ChapterContent>>;
  totalCredits: number;
  scrapedAt: Date;
}

export interface ProgressCallback {
  (progress: { current: number; total: number; chapter: string }): void;
}

/**
 * Get Municode URL for a jurisdiction
 */
export function getMunicodeUrl(jurisdictionId: string): string | null {
  const path = MUNICODE_PATHS[jurisdictionId];
  if (!path) return null;
  return `${MUNICODE_BASE}${path}`;
}

/**
 * Check if a jurisdiction has a known Municode URL
 */
export function hasMunicodeUrl(jurisdictionId: string): boolean {
  return jurisdictionId in MUNICODE_PATHS;
}

/**
 * Get list of all supported jurisdictions
 */
export function getSupportedJurisdictions(): string[] {
  return Object.keys(MUNICODE_PATHS);
}

/**
 * Scrape table of contents from Municode using ScrapingBee
 */
export async function scrapeTOC(jurisdictionId: string): Promise<ChapterInfo[]> {
  const url = getMunicodeUrl(jurisdictionId);
  if (!url) throw new Error(`No Municode URL for: ${jurisdictionId}`);

  console.log(`  [Municode] Fetching TOC: ${url}`);

  const result = await scrapeUrlWithRetry(url, {
    renderJs: true,
    wait: 5000, // Wait for Angular to render
    blockResources: false, // Need all resources for Angular
  });

  if (!result.success) {
    throw new Error(`Failed to scrape TOC: ${result.error}`);
  }

  const html = result.html || '';
  const $ = cheerio.load(html);

  // Check if we got redirected to state page (city not on Municode)
  const pageTitle = $('title').text();
  const bodyText = $('body').text();

  if (
    pageTitle.includes('| Municode Library') &&
    !pageTitle.includes('Code of Ordinances') &&
    bodyText.includes('Jumps to municipalities')
  ) {
    console.log(`  [Municode] City not available on Municode (redirected to state page)`);
    return [];
  }

  const chapters: ChapterInfo[] = [];

  // Find all chapter/title links with nodeId in URL
  $('a[href*="nodeId="]').each((i, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');

    if (!title || !href || title.length < 3) return;

    // Skip duplicate titles
    if (chapters.some((ch) => ch.title === title)) return;

    // Identify relevant chapters by keywords
    const titleLower = title.toLowerCase();
    const isZoning = /zoning|land use|land usage|land development|planning|subdivision/i.test(titleLower);
    const isBuilding = /building|construction|permit|housing|property maintenance|fire prevention|fire code/i.test(titleLower);
    const isBusiness = /business|license|occupation|vendor|peddler|commercial/i.test(titleLower);
    const isHealth = /health|food|sanitation|nuisance|environmental|public works/i.test(titleLower);
    const isAnimals = /animal/i.test(titleLower);

    chapters.push({
      title,
      href: href.startsWith('http') ? href : `${MUNICODE_BASE}${href}`,
      isZoning,
      isBuilding,
      isBusiness,
      isHealth,
      isAnimals,
      isRelevant: isZoning || isBuilding || isBusiness || isHealth || isAnimals,
    });
  });

  // If no nodeId links found, try other selectors
  if (chapters.length === 0) {
    $('a[href*="/codes/code_of_ordinances"]').each((i, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');

      if (!title || !href || title.length < 3) return;
      if (chapters.some((ch) => ch.title === title)) return;

      const titleLower = title.toLowerCase();
      const isZoning = /zoning|land use|land usage|land development|planning|subdivision/i.test(titleLower);
      const isBuilding = /building|construction|permit|housing|property maintenance|fire prevention|fire code/i.test(titleLower);
      const isBusiness = /business|license|occupation|vendor|peddler|commercial/i.test(titleLower);
      const isHealth = /health|food|sanitation|nuisance|environmental|public works/i.test(titleLower);
      const isAnimals = /animal/i.test(titleLower);

      chapters.push({
        title,
        href: href.startsWith('http') ? href : `${MUNICODE_BASE}${href}`,
        isZoning,
        isBuilding,
        isBusiness,
        isHealth,
        isAnimals,
        isRelevant: isZoning || isBuilding || isBusiness || isHealth || isAnimals,
      });
    });
  }

  console.log(
    `  [Municode] Found ${chapters.length} chapters, ${chapters.filter((c) => c.isRelevant).length} relevant`
  );

  return chapters;
}

/**
 * Scrape full text of a chapter using ScrapingBee
 */
export async function scrapeChapter(chapterUrl: string): Promise<ChapterContent> {
  console.log(`  [Municode] Scraping: ${chapterUrl.substring(0, 70)}...`);

  const result = await scrapeUrlWithRetry(chapterUrl, {
    renderJs: true,
    wait: 5000,
    blockResources: false,
  });

  if (!result.success) {
    return {
      url: chapterUrl,
      fullText: '',
      sections: [],
      scrapedAt: new Date(),
      error: result.error,
    };
  }

  const $ = cheerio.load(result.html || '');

  // Get main content area
  const contentSelectors = [
    '#codebody',
    '.codes-content',
    '.chunk-content',
    '.code-content',
    '.main-content',
    '[role="main"]',
    'main',
    'article',
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length) {
      content = el.text().replace(/\s+/g, ' ').trim();
      if (content.length > 100) break;
    }
  }

  if (!content || content.length < 100) {
    content = $('body').text().replace(/\s+/g, ' ').trim();
  }

  // Get section structure
  const sections: Array<{ number: string; title: string; text: string }> = [];
  $('.section, [data-section], .chunk').each((i, el) => {
    const $el = $(el);
    const num = $el.find('.num, .section-number, .secnum').first().text().trim();
    const title = $el.find('.heading, .section-title, .sectitle').first().text().trim();
    const text = $el.text().trim();

    if (num || title || text.length > 50) {
      sections.push({
        number: num,
        title,
        text: text.substring(0, 5000),
      });
    }
  });

  console.log(
    `  [Municode] Extracted ${content.length} chars, ${sections.length} sections`
  );

  return {
    url: chapterUrl,
    fullText: content.substring(0, 100000), // Limit size
    sections,
    scrapedAt: new Date(),
    creditCost: result.cost,
  };
}

/**
 * Scrape all relevant chapters for a jurisdiction
 */
export async function scrapeJurisdiction(
  jurisdictionId: string,
  onProgress?: ProgressCallback
): Promise<ScrapeResult> {
  console.log(`\n[Municode] Starting scrape for: ${jurisdictionId}`);

  const toc = await scrapeTOC(jurisdictionId);
  let relevantChapters = toc.filter((ch) => ch.isRelevant);

  console.log(
    `[Municode] Found ${toc.length} total chapters, ${relevantChapters.length} relevant`
  );

  if (relevantChapters.length === 0 && toc.length > 0) {
    // If no relevant chapters found, try scraping all chapters that look like content
    console.log('[Municode] No relevant chapters found, trying all content chapters...');
    const allChapters = toc.filter(
      (ch) =>
        !ch.title.toLowerCase().includes('table of contents') &&
        !ch.title.toLowerCase().includes('home') &&
        ch.title.length > 3
    );
    relevantChapters = allChapters.slice(0, 15); // Limit to first 15
  }

  const results: ScrapeResult = {
    jurisdictionId,
    municodeUrl: getMunicodeUrl(jurisdictionId),
    chapters: [],
    totalCredits: 1, // TOC scrape
    scrapedAt: new Date(),
  };

  for (let i = 0; i < relevantChapters.length; i++) {
    const chapter = relevantChapters[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: relevantChapters.length,
        chapter: chapter.title,
      });
    }

    try {
      const content = await scrapeChapter(chapter.href);
      results.chapters.push({
        ...chapter,
        ...content,
      });
      results.totalCredits += content.creditCost || 1;
    } catch (error: any) {
      console.log(`  [Municode] Error scraping chapter: ${error.message}`);
      results.chapters.push({
        ...chapter,
        error: error.message,
      });
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    `[Municode] Completed scrape for ${jurisdictionId}: ${results.chapters.length} chapters (${results.totalCredits} credits)`
  );

  return results;
}

/**
 * Scrape a specific chapter type for a jurisdiction
 */
export async function scrapeChapterType(
  jurisdictionId: string,
  chapterType: 'zoning' | 'building' | 'business' | 'health' | 'animals'
): Promise<ChapterContent | null> {
  const toc = await scrapeTOC(jurisdictionId);

  const typeMap: Record<string, keyof ChapterInfo> = {
    zoning: 'isZoning',
    building: 'isBuilding',
    business: 'isBusiness',
    health: 'isHealth',
    animals: 'isAnimals',
  };

  const chapter = toc.find((ch) => ch[typeMap[chapterType]]);
  if (!chapter) return null;

  return scrapeChapter(chapter.href);
}

/**
 * List all available jurisdictions with their URLs
 */
export function listAvailableJurisdictions(): Array<{ id: string; url: string | null }> {
  return Object.keys(MUNICODE_PATHS).map((id) => ({
    id,
    url: getMunicodeUrl(id),
  }));
}
