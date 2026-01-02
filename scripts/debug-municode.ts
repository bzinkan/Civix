import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// Test Cincinnati on Municode - click Browse TOC button
const testCincinnati = async (browser: any) => {
  console.log('='.repeat(80));
  console.log('Testing Cincinnati (Municode) - Click Browse TOC');
  console.log('='.repeat(80));

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const url = 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances';
  console.log(`Navigating to: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('Waiting for page to fully load...');
  await new Promise((r) => setTimeout(r, 3000));

  // Find and click the "Browse table of contents" button
  console.log('\nLooking for "Browse table of contents" button...');

  // Wait for the button
  try {
    await page.waitForSelector('button.code-publication-link', { timeout: 5000 });
    console.log('Found code-publication-link button');
  } catch {
    console.log('No code-publication-link button found, trying other selectors...');
  }

  // Click the button
  const clicked = await page.evaluate(() => {
    // Find the button with "Browse table of contents" text
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (text.includes('browse table of contents') || text.includes('browse toc')) {
        console.log('Clicking button:', btn.textContent);
        btn.click();
        return { success: true, text: btn.textContent?.trim() };
      }
    }

    // Also look for the link
    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      const text = link.textContent?.toLowerCase() || '';
      if (text.includes('browse table of contents')) {
        console.log('Clicking link:', link.textContent);
        link.click();
        return { success: true, text: link.textContent?.trim(), href: link.href };
      }
    }

    return { success: false };
  });

  console.log('Click result:', clicked);

  // Wait for navigation or content change
  console.log('Waiting for content to load...');
  await new Promise((r) => setTimeout(r, 5000));

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Get body text now
  const bodyText = await page.evaluate(() => document.body.innerText);

  // Check if we can see the TOC now
  const hasTocContent = bodyText.includes('TITLE') ||
                         bodyText.includes('CHAPTER') ||
                         bodyText.includes('Part') ||
                         bodyText.includes('Article');

  console.log(`\nHas TOC content: ${hasTocContent}`);
  console.log('\nBody text preview (first 3000 chars):');
  console.log(bodyText.substring(0, 3000));

  // Try to get the TOC links
  const tocLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter((a) => {
        const text = a.textContent?.trim() || '';
        const href = a.href || '';
        // Look for chapter/title links
        return (
          (text.match(/^(TITLE|CHAPTER|Part|Article|Appendix)/i) ||
           href.includes('nodeId=')) &&
          text.length > 3
        );
      })
      .map((a) => ({
        text: a.textContent?.trim().substring(0, 80),
        href: a.href,
      }))
      .filter((l, i, arr) => arr.findIndex((x) => x.text === l.text) === i);
  });

  console.log(`\nFound ${tocLinks.length} TOC-style links:`);
  tocLinks.slice(0, 30).forEach((l, i) => {
    console.log(`  ${i + 1}. ${l.text}`);
    console.log(`      ${l.href}`);
  });

  // Save screenshot
  await page.screenshot({ path: 'debug-cincinnati.png', fullPage: true });
  console.log('\nScreenshot saved to debug-cincinnati.png');

  await page.close();
};

async function debug() {
  console.log('Launching browser with stealth plugin...\n');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  await testCincinnati(browser);

  await browser.close();
  console.log('\nDone!');
}

debug().catch(console.error);
