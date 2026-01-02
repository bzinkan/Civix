import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

const MUNICODE_BASE = 'https://library.municode.com';

// Browser singleton for reuse
let browserInstance: Browser | null = null;

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
  error?: string;
}

export interface ScrapeResult {
  jurisdictionId: string;
  municodeUrl: string | null;
  chapters: Array<ChapterInfo & Partial<ChapterContent>>;
  scrapedAt: Date;
}

export interface ProgressCallback {
  (progress: { current: number; total: number; chapter: string }): void;
}

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });
  }
  return browserInstance;
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
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
 * Wait for Angular to finish loading
 */
async function waitForAngular(page: Page): Promise<void> {
  try {
    // Wait for Angular to be ready
    await page.waitForFunction(
      () => {
        const angular = (window as any).angular;
        if (!angular) return true; // Not an Angular app
        const elem = document.querySelector('[ng-app]');
        if (!elem) return true;
        const injector = angular.element(elem).injector();
        if (!injector) return true;
        const $http = injector.get('$http');
        return $http.pendingRequests.length === 0;
      },
      { timeout: 15000 }
    );
  } catch {
    // Timeout is okay, continue anyway
  }

  // Additional wait for content to render
  await new Promise((r) => setTimeout(r, 2000));
}

/**
 * Scrape table of contents from Municode using Puppeteer
 */
export async function scrapeTOC(jurisdictionId: string): Promise<ChapterInfo[]> {
  const url = getMunicodeUrl(jurisdictionId);
  if (!url) throw new Error(`No Municode URL for: ${jurisdictionId}`);

  console.log(`  [Municode] Navigating to: ${url}`);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for page to stabilize
    await new Promise((r) => setTimeout(r, 3000));

    // Check if we got redirected (city not on Municode)
    const currentUrl = page.url();
    if (!currentUrl.includes(jurisdictionId.replace('-', '_').replace('-', '/'))) {
      // Check if we're on a state listing page (redirect happened)
      const isStatePage = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        return bodyText.includes('Jumps to municipalities') ||
               !bodyText.includes('Code of Ordinances');
      });

      if (isStatePage) {
        console.log(`  [Municode] City not available on Municode (redirected to state page)`);
        return [];
      }
    }

    // Click the "Browse table of contents" button to expand the TOC
    console.log(`  [Municode] Looking for Browse TOC button...`);

    const clicked = await page.evaluate(() => {
      // Find the button with "Browse table of contents" text
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('browse table of contents') || text.includes('browse toc')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log(`  [Municode] Clicked Browse TOC button, waiting for content...`);
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      console.log(`  [Municode] No Browse button found, checking for existing TOC...`);
    }

    // Extract chapters from the rendered page
    const chapters = await page.evaluate(() => {
      const results: Array<{
        title: string;
        href: string;
      }> = [];

      // Get all links with nodeId parameter (these are the TOC items)
      document.querySelectorAll('a').forEach((anchor) => {
        const href = anchor.href || '';
        const title = anchor.textContent?.trim() || '';

        // Look for links with nodeId= in the URL (TOC structure)
        if (
          title &&
          href &&
          href.includes('nodeId=') &&
          title.length > 3 &&
          !results.some((r) => r.text === title)
        ) {
          results.push({ title, href });
        }
      });

      // Deduplicate by title
      return results.filter(
        (item, index, self) => self.findIndex((t) => t.title === item.title) === index
      );
    });

    console.log(`  [Municode] Found ${chapters.length} TOC links`);

    // Process and categorize chapters
    return chapters.map((ch) => {
      const title = ch.title;
      const isZoning = /zoning|land use|land development|planning|subdivision/i.test(title);
      const isBuilding = /building|construction|permit|housing|property maintenance|fire prevention/i.test(title);
      const isBusiness = /business|license|occupation|vendor|peddler/i.test(title);
      const isHealth = /health|food|sanitation|nuisance|environmental/i.test(title);
      const isAnimals = /animal/i.test(title);

      return {
        title,
        href: ch.href,
        isZoning,
        isBuilding,
        isBusiness,
        isHealth,
        isAnimals,
        isRelevant: isZoning || isBuilding || isBusiness || isHealth || isAnimals,
      };
    });
  } finally {
    await page.close();
  }
}

/**
 * Scrape full text of a chapter using Puppeteer
 */
export async function scrapeChapter(chapterUrl: string): Promise<ChapterContent> {
  console.log(`  [Municode] Scraping chapter: ${chapterUrl.substring(0, 80)}...`);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(chapterUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for Angular to load
    await waitForAngular(page);

    // Wait for content to appear
    await page.waitForSelector(
      '.chunk-content, .code-content, #codebody, .section-content, [class*="content"]',
      { timeout: 15000 }
    ).catch(() => {
      console.log('  [Municode] Content selector not found, continuing...');
    });

    // Extract content from the rendered page
    const content = await page.evaluate(() => {
      // Get all text content from the code body
      const contentSelectors = [
        '.chunk-content',
        '.code-content',
        '#codebody',
        '.section-content',
        '.codes-content',
        '.main-content',
        '[role="main"]',
        '#content',
      ];

      let fullText = '';
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          fullText = el.textContent.replace(/\s+/g, ' ').trim();
          if (fullText.length > 100) break;
        }
      }

      // If still no content, get body text
      if (fullText.length < 100) {
        fullText = document.body.textContent?.replace(/\s+/g, ' ').trim() || '';
      }

      // Extract sections
      const sections: Array<{ number: string; title: string; text: string }> = [];
      const sectionSelectors = [
        '.section',
        '[data-section]',
        '.chunk',
        '.code-section',
      ];

      for (const selector of sectionSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el) => {
            const numEl = el.querySelector('.section-number, .num, .sec-num');
            const titleEl = el.querySelector('.section-title, .heading, .sec-head');
            const num = numEl?.textContent?.trim() || '';
            const title = titleEl?.textContent?.trim() || '';
            const text = el.textContent?.trim() || '';

            if (num || title || text.length > 50) {
              sections.push({
                number: num,
                title: title,
                text: text.substring(0, 5000),
              });
            }
          });
          if (sections.length > 0) break;
        }
      }

      return { fullText, sections };
    });

    console.log(`  [Municode] Extracted ${content.fullText.length} chars, ${content.sections.length} sections`);

    return {
      url: chapterUrl,
      fullText: content.fullText.substring(0, 100000), // Limit size
      sections: content.sections,
      scrapedAt: new Date(),
    };
  } finally {
    await page.close();
  }
}

/**
 * Scrape all relevant chapters for a jurisdiction
 */
export async function scrapeJurisdiction(
  jurisdictionId: string,
  onProgress?: ProgressCallback
): Promise<ScrapeResult> {
  console.log(`[Municode] Starting scrape for: ${jurisdictionId}`);

  const toc = await scrapeTOC(jurisdictionId);
  const relevantChapters = toc.filter((ch) => ch.isRelevant);

  console.log(`[Municode] Found ${toc.length} total chapters, ${relevantChapters.length} relevant`);

  if (relevantChapters.length === 0) {
    // If no relevant chapters found, try scraping all chapters that look like content
    console.log('[Municode] No relevant chapters found, trying all content chapters...');
    const allChapters = toc.filter((ch) =>
      !ch.title.toLowerCase().includes('table of contents') &&
      !ch.title.toLowerCase().includes('home') &&
      ch.title.length > 3
    );
    relevantChapters.push(...allChapters.slice(0, 20)); // Limit to first 20
  }

  const results: ScrapeResult = {
    jurisdictionId,
    municodeUrl: getMunicodeUrl(jurisdictionId),
    chapters: [],
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
    } catch (error: any) {
      console.log(`  [Municode] Error scraping chapter: ${error.message}`);
      results.chapters.push({
        ...chapter,
        error: error.message,
      });
    }

    // Rate limiting - be nice to Municode
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Close browser when done with jurisdiction
  await closeBrowser();

  console.log(`[Municode] Completed scrape for ${jurisdictionId}: ${results.chapters.length} chapters`);

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
  if (!chapter) {
    await closeBrowser();
    return null;
  }

  const content = await scrapeChapter(chapter.href);
  await closeBrowser();
  return content;
}
