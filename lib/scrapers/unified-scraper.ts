/**
 * Unified Scraper - Tries multiple sources in priority order
 *
 * Priority:
 * 1. Municode (most structured, best quality)
 * 2. American Legal Publishing
 * 3. eCode360 / General Code
 * 4. Sterling Codifiers
 * 5. City Website (last resort)
 */

import * as municode from './municode';
import * as amlegal from './amlegal';
import * as ecode360 from './ecode360';
import * as sterling from './sterling';

export type CodeSource = 'municode' | 'amlegal' | 'ecode360' | 'sterling' | 'city-website' | 'unknown';

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

export interface UnifiedScrapeResult {
  jurisdictionId: string;
  source: CodeSource;
  sourceUrl: string | null;
  chapters: Array<ChapterInfo & Partial<ChapterContent>>;
  totalCredits: number;
  scrapedAt: Date;
  fallbacksAttempted: CodeSource[];
}

/**
 * Known code sources for each jurisdiction
 * This helps skip unnecessary scrapes and provides accurate source URLs
 *
 * Source verification:
 * - Most Cincinnati metro cities use American Legal Publishing
 * - Cincinnati itself is on Municode
 * - Some smaller cities use eCode360 or Sterling
 */
const JURISDICTION_SOURCES: Record<string, CodeSource> = {
  // Municode cities
  'cincinnati-oh': 'municode',

  // American Legal cities - Ohio
  'hamilton-oh': 'amlegal',
  'middletown-oh': 'amlegal',
  'fairfield-oh': 'amlegal',
  'lebanon-oh': 'amlegal',
  'mason-oh': 'amlegal',
  'oxford-oh': 'amlegal',
  'springboro-oh': 'amlegal',
  'trenton-oh': 'amlegal',
  'blue-ash-oh': 'amlegal',
  'reading-oh': 'amlegal',
  'deer-park-oh': 'amlegal',
  'sharonville-oh': 'amlegal',
  'norwood-oh': 'amlegal',
  'montgomery-oh': 'amlegal',
  'madeira-oh': 'amlegal',
  'silverton-oh': 'amlegal',
  'wyoming-oh': 'amlegal',
  'mariemont-oh': 'amlegal',
  'indian-hill-oh': 'amlegal',
  'evendale-oh': 'amlegal',
  'glendale-oh': 'amlegal',
  'golf-manor-oh': 'amlegal',
  'amberley-village-oh': 'amlegal',
  'lockland-oh': 'amlegal',
  'lincoln-heights-oh': 'amlegal',
  'woodlawn-oh': 'amlegal',
  'springdale-oh': 'amlegal',
  'forest-park-oh': 'amlegal',
  'loveland-oh': 'amlegal',
  'milford-oh': 'amlegal',
  'batavia-oh': 'amlegal',
  'monroe-oh': 'amlegal',
  'franklin-oh': 'amlegal',

  // American Legal cities - Kentucky
  'covington-ky': 'amlegal',
  'newport-ky': 'amlegal',
  'erlanger-ky': 'amlegal',
  'fort-thomas-ky': 'amlegal',
  'independence-ky': 'amlegal',
  'florence-ky': 'amlegal',
  'fort-mitchell-ky': 'amlegal',
  'bellevue-ky': 'amlegal',
  'dayton-ky': 'amlegal',
  'southgate-ky': 'amlegal',
  'cold-spring-ky': 'amlegal',
  'highland-heights-ky': 'amlegal',
  'taylor-mill-ky': 'amlegal',
  'alexandria-ky': 'amlegal',
  'union-ky': 'amlegal',
  'walton-ky': 'amlegal',
  'edgewood-ky': 'amlegal',
  'elsmere-ky': 'amlegal',
  'villa-hills-ky': 'amlegal',
  'lakeside-park-ky': 'amlegal',
  'crestview-hills-ky': 'amlegal',
};

/**
 * Get the known source for a jurisdiction
 */
export function getKnownSource(jurisdictionId: string): CodeSource {
  return JURISDICTION_SOURCES[jurisdictionId] || 'unknown';
}

/**
 * Get source URL for a jurisdiction
 */
export function getSourceUrl(jurisdictionId: string): string | null {
  const source = getKnownSource(jurisdictionId);

  switch (source) {
    case 'municode':
      return municode.getMunicodeUrl(jurisdictionId);
    case 'amlegal':
      return amlegal.getAmlegalUrl(jurisdictionId);
    case 'ecode360':
      return ecode360.getEcode360Url(jurisdictionId);
    case 'sterling':
      return sterling.getSterlingUrl(jurisdictionId);
    default:
      return null;
  }
}

/**
 * Check if we have a known source for this jurisdiction
 */
export function hasKnownSource(jurisdictionId: string): boolean {
  return jurisdictionId in JURISDICTION_SOURCES;
}

/**
 * Scrape a jurisdiction using the known source
 */
async function scrapeWithKnownSource(
  jurisdictionId: string,
  source: CodeSource
): Promise<UnifiedScrapeResult | null> {
  try {
    let result;

    switch (source) {
      case 'municode':
        result = await municode.scrapeJurisdiction(jurisdictionId);
        break;
      case 'amlegal':
        result = await amlegal.scrapeJurisdiction(jurisdictionId);
        break;
      case 'ecode360':
        result = await ecode360.scrapeJurisdiction(jurisdictionId);
        break;
      case 'sterling':
        result = await sterling.scrapeJurisdiction(jurisdictionId);
        break;
      default:
        return null;
    }

    // Check if we got any chapters
    if (result.chapters.length === 0) {
      console.log(`  [Unified] ${source} returned 0 chapters`);
      return null;
    }

    return {
      jurisdictionId,
      source,
      sourceUrl: result.sourceUrl || result.municodeUrl || null,
      chapters: result.chapters,
      totalCredits: result.totalCredits,
      scrapedAt: result.scrapedAt,
      fallbacksAttempted: [],
    };
  } catch (error: any) {
    console.log(`  [Unified] ${source} failed: ${error.message}`);
    return null;
  }
}

/**
 * Scrape a jurisdiction, trying fallback sources if needed
 */
export async function scrapeJurisdiction(
  jurisdictionId: string,
  options: {
    skipFallbacks?: boolean;
    preferredSource?: CodeSource;
  } = {}
): Promise<UnifiedScrapeResult> {
  console.log(`\n[Unified] Starting scrape for: ${jurisdictionId}`);

  const fallbacksAttempted: CodeSource[] = [];

  // Determine source order
  const knownSource = getKnownSource(jurisdictionId);
  let sourceOrder: CodeSource[];

  if (options.preferredSource) {
    sourceOrder = [options.preferredSource];
    if (!options.skipFallbacks) {
      sourceOrder.push('municode', 'amlegal', 'ecode360', 'sterling');
      // Remove duplicates
      sourceOrder = [...new Set(sourceOrder)];
    }
  } else if (knownSource !== 'unknown') {
    sourceOrder = [knownSource];
    if (!options.skipFallbacks) {
      // Add fallbacks in priority order
      const fallbacks: CodeSource[] = ['municode', 'amlegal', 'ecode360', 'sterling'];
      sourceOrder = [knownSource, ...fallbacks.filter((s) => s !== knownSource)];
    }
  } else {
    // Unknown source - try all in priority order
    sourceOrder = ['municode', 'amlegal', 'ecode360', 'sterling'];
  }

  console.log(`  [Unified] Source order: ${sourceOrder.join(' -> ')}`);

  // Try each source
  for (const source of sourceOrder) {
    console.log(`  [Unified] Trying: ${source}`);

    const result = await scrapeWithKnownSource(jurisdictionId, source);

    if (result) {
      result.fallbacksAttempted = fallbacksAttempted;
      console.log(
        `  [Unified] Success with ${source}: ${result.chapters.length} chapters`
      );
      return result;
    }

    fallbacksAttempted.push(source);
  }

  // All sources failed
  console.log(`  [Unified] All sources failed for ${jurisdictionId}`);

  return {
    jurisdictionId,
    source: 'unknown',
    sourceUrl: null,
    chapters: [],
    totalCredits: fallbacksAttempted.length, // Count failed attempts
    scrapedAt: new Date(),
    fallbacksAttempted,
  };
}

/**
 * Scrape TOC only (for quick checks)
 */
export async function scrapeTOC(
  jurisdictionId: string
): Promise<{ source: CodeSource; chapters: ChapterInfo[] }> {
  const knownSource = getKnownSource(jurisdictionId);

  try {
    let chapters: ChapterInfo[] = [];

    switch (knownSource) {
      case 'municode':
        chapters = await municode.scrapeTOC(jurisdictionId);
        break;
      case 'amlegal':
        chapters = await amlegal.scrapeTOC(jurisdictionId);
        break;
      case 'ecode360':
        chapters = await ecode360.scrapeTOC(jurisdictionId);
        break;
      case 'sterling':
        chapters = await sterling.scrapeTOC(jurisdictionId);
        break;
    }

    return { source: knownSource, chapters };
  } catch (error: any) {
    console.log(`  [Unified] TOC scrape failed: ${error.message}`);
    return { source: 'unknown', chapters: [] };
  }
}

/**
 * Get all supported jurisdictions with their sources
 */
export function getSupportedJurisdictions(): Array<{
  id: string;
  source: CodeSource;
  url: string | null;
}> {
  return Object.entries(JURISDICTION_SOURCES).map(([id, source]) => ({
    id,
    source,
    url: getSourceUrl(id),
  }));
}

/**
 * Check scraping availability for a jurisdiction
 */
export function checkAvailability(jurisdictionId: string): {
  hasSource: boolean;
  source: CodeSource;
  url: string | null;
} {
  const source = getKnownSource(jurisdictionId);
  return {
    hasSource: source !== 'unknown',
    source,
    url: getSourceUrl(jurisdictionId),
  };
}
