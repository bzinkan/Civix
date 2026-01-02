import { ScrapingBeeClient } from 'scrapingbee';

const client = new ScrapingBeeClient(process.env.SCRAPINGBEE_API_KEY || '');

export interface ScrapeResult {
  success: boolean;
  status?: number;
  html?: string;
  text?: string;
  markdown?: string;
  cost?: number;
  error?: string;
}

export interface ScrapeOptions {
  renderJs?: boolean;
  premiumProxy?: boolean;
  country?: string;
  wait?: number;
  waitFor?: string | null;
  blockResources?: boolean;
  returnText?: boolean;      // return_page_text - clean text output
  returnMarkdown?: boolean;  // return_page_markdown - markdown output
  lightRequest?: boolean;    // light_requests - 10 credits instead of 15
  params?: Record<string, any>;
}

/**
 * Fetch a URL using ScrapingBee (original HTML mode)
 */
export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  try {
    const params: Record<string, any> = {
      render_js: options.renderJs ?? true,
      premium_proxy: options.premiumProxy ?? false,
      country_code: options.country ?? 'us',
      wait: options.wait ?? 3000,
      wait_for: options.waitFor ?? undefined,
      block_resources: options.blockResources ?? false,
      ...options.params,
    };

    // Add text/markdown output options
    if (options.returnText) {
      params.return_page_text = true;
    }
    if (options.returnMarkdown) {
      params.return_page_markdown = true;
    }
    if (options.lightRequest) {
      params.light_requests = true;
    }

    const response = await client.get({ url, params });

    const result: ScrapeResult = {
      success: true,
      status: response.status,
      cost: parseInt(response.headers['spb-cost'] as string) || 1,
    };

    // Set appropriate response field based on output type
    if (options.returnText) {
      result.text = response.data.toString();
    } else if (options.returnMarkdown) {
      result.markdown = response.data.toString();
    } else {
      result.html = response.data.toString();
    }

    return result;
  } catch (error: any) {
    console.error(`ScrapingBee error for ${url}:`, error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Scrape URL and return clean text (LLM-friendly, no HTML parsing needed)
 */
export async function scrapeAsText(
  url: string,
  options: Omit<ScrapeOptions, 'returnText' | 'returnMarkdown'> = {}
): Promise<ScrapeResult> {
  return scrapeUrl(url, { ...options, returnText: true });
}

/**
 * Scrape URL and return markdown (LLM-friendly)
 */
export async function scrapeAsMarkdown(
  url: string,
  options: Omit<ScrapeOptions, 'returnText' | 'returnMarkdown'> = {}
): Promise<ScrapeResult> {
  return scrapeUrl(url, { ...options, returnMarkdown: true });
}

/**
 * Light request - cheaper (10 credits vs 15), no JS rendering
 * Good for simple HTML pages
 */
export async function scrapeLightAsText(url: string): Promise<ScrapeResult> {
  return scrapeUrl(url, {
    returnText: true,
    lightRequest: true,
    renderJs: false,
  });
}

/**
 * Smart scrape: Try light request first (cheaper), fall back to full JS render if content looks incomplete
 */
export async function scrapeUrlSmart(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  // Try light request first (10 credits instead of 15)
  console.log(`  [Smart] Trying light request: ${url.substring(0, 50)}...`);
  let result = await scrapeLightAsText(url);

  // Check if content looks complete (has enough text)
  if (result.success && result.text && result.text.length > 500) {
    console.log(`  [Smart] Light request successful (${result.text.length} chars, ${result.cost} credits)`);
    return result;
  }

  // Fall back to full JS rendering with text output
  console.log(`  [Smart] Light incomplete, trying full JS render...`);
  result = await scrapeAsText(url, {
    renderJs: true,
    wait: options.wait ?? 3000,
    ...options,
  });

  if (result.success) {
    console.log(`  [Smart] Full render successful (${result.text?.length} chars, ${result.cost} credits)`);
  }

  return result;
}

/**
 * Fetch with automatic retry on failure
 */
export async function scrapeUrlWithRetry(
  url: string,
  options: ScrapeOptions = {},
  maxRetries: number = 3
): Promise<ScrapeResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(
      `  [ScrapingBee] Attempt ${attempt}/${maxRetries}: ${url.substring(0, 60)}...`
    );

    const result = await scrapeUrl(url, options);

    if (result.success) {
      console.log(`  [ScrapingBee] Success! (${result.cost} credits used)`);
      return result;
    }

    lastError = result.error;
    console.log(`  [ScrapingBee] Attempt ${attempt} failed: ${lastError}`);

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Fetch as clean text with automatic retry
 */
export async function scrapeAsTextWithRetry(
  url: string,
  options: Omit<ScrapeOptions, 'returnText' | 'returnMarkdown'> = {},
  maxRetries: number = 3
): Promise<ScrapeResult> {
  return scrapeUrlWithRetry(url, { ...options, returnText: true }, maxRetries);
}

/**
 * Smart scrape with retry: Try light first, fall back to full, with retries
 */
export async function scrapeSmartWithRetry(
  url: string,
  options: ScrapeOptions = {},
  maxRetries: number = 2
): Promise<ScrapeResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  [SmartRetry] Attempt ${attempt}/${maxRetries}`);

    const result = await scrapeUrlSmart(url, options);

    if (result.success && result.text && result.text.length > 100) {
      return result;
    }

    lastError = result.error || 'Empty or minimal content';

    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Check API credit balance
 */
export async function getCredits(): Promise<{
  credits_remaining?: number;
  error?: string;
} | null> {
  try {
    const response = await fetch('https://app.scrapingbee.com/api/v1/usage', {
      headers: {
        Authorization: `Bearer ${process.env.SCRAPINGBEE_API_KEY}`,
      },
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to get ScrapingBee credits:', error);
    return null;
  }
}

/**
 * Check if we have enough credits before starting
 */
export async function checkCreditsBeforeExtraction(
  estimatedCredits: number = 50
): Promise<boolean> {
  const usage = await getCredits();

  if (!usage) {
    console.warn('⚠️ Could not check ScrapingBee credits');
    return true; // Proceed anyway
  }

  if (usage.error) {
    console.warn(`⚠️ ScrapingBee error: ${usage.error}`);
    return true;
  }

  const remaining = usage.credits_remaining || 0;

  console.log(`\n📊 ScrapingBee Credits:`);
  console.log(`   Remaining: ${remaining}`);
  console.log(`   Estimated needed: ${estimatedCredits}`);

  if (remaining < estimatedCredits) {
    console.error(
      `❌ Not enough credits! Need ~${estimatedCredits}, have ${remaining}`
    );
    return false;
  }

  console.log(`   ✅ Sufficient credits\n`);
  return true;
}
