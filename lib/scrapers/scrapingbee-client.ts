import { ScrapingBeeClient } from 'scrapingbee';

const client = new ScrapingBeeClient(process.env.SCRAPINGBEE_API_KEY || '');

export interface ScrapeResult {
  success: boolean;
  status?: number;
  html?: string;
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
  params?: Record<string, any>;
}

/**
 * Fetch a URL using ScrapingBee
 */
export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  try {
    const response = await client.get({
      url,
      params: {
        render_js: options.renderJs ?? true,
        premium_proxy: options.premiumProxy ?? false,
        country_code: options.country ?? 'us',
        wait: options.wait ?? 3000,
        wait_for: options.waitFor ?? undefined,
        block_resources: options.blockResources ?? false,
        ...options.params,
      },
    });

    return {
      success: true,
      status: response.status,
      html: response.data.toString(),
      cost: parseInt(response.headers['spb-cost'] as string) || 1,
    };
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
