import * as cheerio from 'cheerio';
import { scrapeUrlWithRetry } from './scrapingbee-client';

const AMLEGAL_BASE = 'https://codelibrary.amlegal.com';

/**
 * Known American Legal Publishing paths for Cincinnati metro cities
 * URL format: /codes/{city_code}/latest/overview
 */
const AMLEGAL_PATHS: Record<string, string> = {
  // Kentucky cities
  'covington-ky': '/codes/covington/latest/overview',
  'newport-ky': '/codes/newportky/latest/overview',
  'erlanger-ky': '/codes/erlanger/latest/overview',
  'fort-thomas-ky': '/codes/fortthomas/latest/overview',
  'independence-ky': '/codes/independence/latest/overview',
  'florence-ky': '/codes/florence/latest/overview',
  'fort-mitchell-ky': '/codes/fortmitchell/latest/overview',
  'bellevue-ky': '/codes/bellevue/latest/overview',
  'dayton-ky': '/codes/dayton/latest/overview',
  'southgate-ky': '/codes/southgate/latest/overview',
  'cold-spring-ky': '/codes/coldspring/latest/overview',
  'highland-heights-ky': '/codes/highlandheights/latest/overview',
  'taylor-mill-ky': '/codes/taylormill/latest/overview',
  'alexandria-ky': '/codes/alexandria/latest/overview',
  'union-ky': '/codes/union/latest/overview',
  'walton-ky': '/codes/walton/latest/overview',
  'edgewood-ky': '/codes/edgewood/latest/overview',
  'elsmere-ky': '/codes/elsmere/latest/overview',
  'villa-hills-ky': '/codes/villahills/latest/overview',
  'lakeside-park-ky': '/codes/lakesidepark/latest/overview',
  'crestview-hills-ky': '/codes/crestviewhills/latest/overview',

  // Ohio cities
  'hamilton-oh': '/codes/hamilton/latest/overview',
  'middletown-oh': '/codes/middletown/latest/overview',
  'fairfield-oh': '/codes/fairfield/latest/overview',
  'lebanon-oh': '/codes/lebanon/latest/overview',
  'mason-oh': '/codes/mason/latest/overview',
  'oxford-oh': '/codes/oxford/latest/overview',
  'springboro-oh': '/codes/springboro/latest/overview',
  'trenton-oh': '/codes/trenton/latest/overview',
  'blue-ash-oh': '/codes/blueash/latest/overview',
  'reading-oh': '/codes/reading/latest/overview',
  'deer-park-oh': '/codes/deerpark/latest/overview',
  'sharonville-oh': '/codes/sharonville/latest/overview',
  'norwood-oh': '/codes/norwood/latest/overview',
  'montgomery-oh': '/codes/montgomery/latest/overview',
  'madeira-oh': '/codes/madeira/latest/overview',
  'silverton-oh': '/codes/silverton/latest/overview',
  'wyoming-oh': '/codes/wyoming/latest/overview',
  'mariemont-oh': '/codes/mariemont/latest/overview',
  'indian-hill-oh': '/codes/indianhill/latest/overview',
  'evendale-oh': '/codes/evendale/latest/overview',
  'glendale-oh': '/codes/glendale/latest/overview',
  'golf-manor-oh': '/codes/golfmanor/latest/overview',
  'amberley-village-oh': '/codes/amberley/latest/overview',
  'lockland-oh': '/codes/lockland/latest/overview',
  'lincoln-heights-oh': '/codes/lincolnheights/latest/overview',
  'woodlawn-oh': '/codes/woodlawn/latest/overview',
  'springdale-oh': '/codes/springdale/latest/overview',
  'forest-park-oh': '/codes/forestpark/latest/overview',
  'loveland-oh': '/codes/loveland/latest/overview',
  'milford-oh': '/codes/milford/latest/overview',
  'batavia-oh': '/codes/batavia/latest/overview',
  'monroe-oh': '/codes/monroe/latest/overview',
  'franklin-oh': '/codes/franklin/latest/overview',
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
  sourceUrl: string | null;
  chapters: Array<ChapterInfo & Partial<ChapterContent>>;
  totalCredits: number;
  scrapedAt: Date;
}

/**
 * Get American Legal URL for a jurisdiction
 */
export function getAmlegalUrl(jurisdictionId: string): string | null {
  const path = AMLEGAL_PATHS[jurisdictionId];
  if (!path) return null;
  return `${AMLEGAL_BASE}${path}`;
}

/**
 * Check if a jurisdiction has a known American Legal URL
 */
export function hasAmlegalUrl(jurisdictionId: string): boolean {
  return jurisdictionId in AMLEGAL_PATHS;
}

/**
 * Classify chapter by keywords
 */
function classifyChapter(title: string): Omit<ChapterInfo, 'title' | 'href'> {
  const titleLower = title.toLowerCase();
  const isZoning = /zoning|land use|land usage|land development|planning|subdivision/i.test(titleLower);
  const isBuilding = /building|construction|permit|housing|property maintenance|fire prevention|fire code/i.test(titleLower);
  const isBusiness = /business|license|occupation|vendor|peddler|commercial/i.test(titleLower);
  const isHealth = /health|food|sanitation|nuisance|environmental|public works/i.test(titleLower);
  const isAnimals = /animal/i.test(titleLower);

  return {
    isZoning,
    isBuilding,
    isBusiness,
    isHealth,
    isAnimals,
    isRelevant: isZoning || isBuilding || isBusiness || isHealth || isAnimals,
  };
}

/**
 * Scrape table of contents from American Legal Publishing
 */
export async function scrapeTOC(jurisdictionId: string): Promise<ChapterInfo[]> {
  const url = getAmlegalUrl(jurisdictionId);
  if (!url) throw new Error(`No American Legal URL for: ${jurisdictionId}`);

  console.log(`  [AmLegal] Fetching TOC: ${url}`);

  const result = await scrapeUrlWithRetry(url, {
    renderJs: true,
    wait: 3000,
    blockResources: false,
  });

  if (!result.success) {
    throw new Error(`Failed to scrape TOC: ${result.error}`);
  }

  const html = result.html || '';
  const $ = cheerio.load(html);

  const chapters: ChapterInfo[] = [];

  // American Legal uses a tree structure with links
  // Look for chapter links in the TOC
  $('a[href*="/codes/"]').each((i, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');

    if (!title || !href || title.length < 3) return;

    // Skip navigation links
    if (title.toLowerCase().includes('home') ||
        title.toLowerCase().includes('search') ||
        title.toLowerCase().includes('overview')) return;

    // Skip duplicate titles
    if (chapters.some((ch) => ch.title === title)) return;

    const fullHref = href.startsWith('http') ? href : `${AMLEGAL_BASE}${href}`;
    const classification = classifyChapter(title);

    chapters.push({
      title,
      href: fullHref,
      ...classification,
    });
  });

  // Also try the TOC tree nodes
  if (chapters.length === 0) {
    $('.toc-node a, .tocTree a, .nav-tree a').each((i, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');

      if (!title || !href || title.length < 3) return;
      if (chapters.some((ch) => ch.title === title)) return;

      const fullHref = href.startsWith('http') ? href : `${AMLEGAL_BASE}${href}`;
      const classification = classifyChapter(title);

      chapters.push({
        title,
        href: fullHref,
        ...classification,
      });
    });
  }

  console.log(
    `  [AmLegal] Found ${chapters.length} chapters, ${chapters.filter((c) => c.isRelevant).length} relevant`
  );

  return chapters;
}

/**
 * Scrape full text of a chapter from American Legal
 */
export async function scrapeChapter(chapterUrl: string): Promise<ChapterContent> {
  console.log(`  [AmLegal] Scraping: ${chapterUrl.substring(0, 70)}...`);

  const result = await scrapeUrlWithRetry(chapterUrl, {
    renderJs: true,
    wait: 3000,
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

  // Remove script, style, and clear navigation elements (be careful not to remove content)
  $('style, script, noscript').remove();

  // Get main content area - AmLegal specific selectors first
  // AmLegal uses .chunk classes for content sections
  const contentSelectors = [
    '.chunk',           // AmLegal main content chunks
    '.chunk-content',
    '.code-chunk',
    '.codenav__content',
    '.code-body',
    '.content-body',
    '.code-content',
    '.document-content',
    '#content-area',
    '#content',
    'main',
    'article',
    'body',
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length) {
      // Clone and remove navigation elements from the clone
      const clone = el.clone();
      clone.find('nav, header, footer, .breadcrumb, .toc, .navigation, .sidebar').remove();
      content = clone.text().replace(/\s+/g, ' ').trim();
      if (content.length > 500) break;
    }
  }

  // Clean up any remaining CSS artifacts
  content = content.replace(/\.[a-z-]+[\s\S]*?\{[^}]*\}/gi, '').trim();
  content = content.replace(/\s+/g, ' ').trim();

  // Get section structure
  const sections: Array<{ number: string; title: string; text: string }> = [];
  $('.section, .code-section, [data-section]').each((i, el) => {
    const $el = $(el);
    const num = $el.find('.section-number, .num').first().text().trim();
    const title = $el.find('.section-title, .heading').first().text().trim();
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
    `  [AmLegal] Extracted ${content.length} chars, ${sections.length} sections`
  );

  return {
    url: chapterUrl,
    fullText: content.substring(0, 100000),
    sections,
    scrapedAt: new Date(),
    creditCost: result.cost,
  };
}

/**
 * Scrape all relevant chapters for a jurisdiction
 */
export async function scrapeJurisdiction(jurisdictionId: string): Promise<ScrapeResult> {
  console.log(`\n[AmLegal] Starting scrape for: ${jurisdictionId}`);

  const toc = await scrapeTOC(jurisdictionId);
  let relevantChapters = toc.filter((ch) => ch.isRelevant);

  console.log(
    `[AmLegal] Found ${toc.length} total chapters, ${relevantChapters.length} relevant`
  );

  if (relevantChapters.length === 0 && toc.length > 0) {
    console.log('[AmLegal] No relevant chapters found, trying all content chapters...');
    const allChapters = toc.filter(
      (ch) =>
        !ch.title.toLowerCase().includes('table of contents') &&
        !ch.title.toLowerCase().includes('home') &&
        ch.title.length > 3
    );
    relevantChapters = allChapters.slice(0, 15);
  }

  const results: ScrapeResult = {
    jurisdictionId,
    sourceUrl: getAmlegalUrl(jurisdictionId),
    chapters: [],
    totalCredits: 1,
    scrapedAt: new Date(),
  };

  for (let i = 0; i < relevantChapters.length; i++) {
    const chapter = relevantChapters[i];

    try {
      const content = await scrapeChapter(chapter.href);
      results.chapters.push({
        ...chapter,
        ...content,
      });
      results.totalCredits += content.creditCost || 1;
    } catch (error: any) {
      console.log(`  [AmLegal] Error scraping chapter: ${error.message}`);
      results.chapters.push({
        ...chapter,
        error: error.message,
      });
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    `[AmLegal] Completed scrape for ${jurisdictionId}: ${results.chapters.length} chapters (${results.totalCredits} credits)`
  );

  return results;
}
