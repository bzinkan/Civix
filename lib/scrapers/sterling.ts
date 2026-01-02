import * as cheerio from 'cheerio';
import { scrapeUrlWithRetry } from './scrapingbee-client';

const STERLING_BASE = 'https://sterlingcodifiers.com';

/**
 * Known Sterling Codifiers paths for Cincinnati metro cities
 * Note: Sterling was acquired by CivicPlus, some URLs may redirect
 */
const STERLING_PATHS: Record<string, string> = {
  'loveland-oh': '/codebook/index.php?book_id=591',
  'milford-oh': '/codebook/index.php?book_id=634',
  'batavia-oh': '/codebook/index.php?book_id=54',
  'monroe-oh': '/codebook/index.php?book_id=643',
  'franklin-oh': '/codebook/index.php?book_id=305',
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
 * Get Sterling Codifiers URL for a jurisdiction
 */
export function getSterlingUrl(jurisdictionId: string): string | null {
  const path = STERLING_PATHS[jurisdictionId];
  if (!path) return null;
  return `${STERLING_BASE}${path}`;
}

/**
 * Check if a jurisdiction has a known Sterling URL
 */
export function hasSterlingUrl(jurisdictionId: string): boolean {
  return jurisdictionId in STERLING_PATHS;
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
 * Scrape table of contents from Sterling Codifiers
 */
export async function scrapeTOC(jurisdictionId: string): Promise<ChapterInfo[]> {
  const url = getSterlingUrl(jurisdictionId);
  if (!url) throw new Error(`No Sterling URL for: ${jurisdictionId}`);

  console.log(`  [Sterling] Fetching TOC: ${url}`);

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

  // Sterling uses a tree structure with title/chapter links
  $('a[href*="chapter_id"], a[href*="title_id"]').each((i, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');

    if (!title || !href || title.length < 3) return;

    // Skip navigation links
    if (title.toLowerCase().includes('home') ||
        title.toLowerCase().includes('search')) return;

    // Skip duplicate titles
    if (chapters.some((ch) => ch.title === title)) return;

    const fullHref = href.startsWith('http') ? href : `${STERLING_BASE}${href}`;
    const classification = classifyChapter(title);

    chapters.push({
      title,
      href: fullHref,
      ...classification,
    });
  });

  // Try alternative selectors
  if (chapters.length === 0) {
    $('.toc a, .nav-tree a, #toc a').each((i, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');

      if (!title || !href || title.length < 3) return;
      if (chapters.some((ch) => ch.title === title)) return;

      const fullHref = href.startsWith('http') ? href : `${STERLING_BASE}${href}`;
      const classification = classifyChapter(title);

      chapters.push({
        title,
        href: fullHref,
        ...classification,
      });
    });
  }

  console.log(
    `  [Sterling] Found ${chapters.length} chapters, ${chapters.filter((c) => c.isRelevant).length} relevant`
  );

  return chapters;
}

/**
 * Scrape full text of a chapter from Sterling
 */
export async function scrapeChapter(chapterUrl: string): Promise<ChapterContent> {
  console.log(`  [Sterling] Scraping: ${chapterUrl.substring(0, 70)}...`);

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

  // Remove script and style elements
  $('style, script, noscript').remove();

  // Get main content area
  const contentSelectors = [
    '#content',
    '.content-area',
    '.code-content',
    'main',
    'article',
    'body',
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length) {
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
  $('.section, [data-section], .code-section').each((i, el) => {
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
    `  [Sterling] Extracted ${content.length} chars, ${sections.length} sections`
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
  console.log(`\n[Sterling] Starting scrape for: ${jurisdictionId}`);

  const toc = await scrapeTOC(jurisdictionId);
  let relevantChapters = toc.filter((ch) => ch.isRelevant);

  console.log(
    `[Sterling] Found ${toc.length} total chapters, ${relevantChapters.length} relevant`
  );

  if (relevantChapters.length === 0 && toc.length > 0) {
    console.log('[Sterling] No relevant chapters found, trying all content chapters...');
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
    sourceUrl: getSterlingUrl(jurisdictionId),
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
      console.log(`  [Sterling] Error scraping chapter: ${error.message}`);
      results.chapters.push({
        ...chapter,
        error: error.message,
      });
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    `[Sterling] Completed scrape for ${jurisdictionId}: ${results.chapters.length} chapters (${results.totalCredits} credits)`
  );

  return results;
}
