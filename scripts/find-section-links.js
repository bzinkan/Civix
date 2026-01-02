const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('temp-scrape.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== Finding section links ===\n');

// Find all links with section references
$('a[href*="/codes/covington/"]').each((i, el) => {
  const href = $(el).attr('href');
  const text = $(el).text().trim();

  // Look for section numbers like "§ 127.01" or just "127.01"
  if (text.match(/^\s*§?\s*\d+\.\d+/)) {
    console.log(`Section link found: "${text}" -> ${href}`);
  }
});

console.log('\n=== All href patterns ===\n');

// Show unique href patterns
const hrefs = new Set();
$('a[href*="/codes/covington/"]').each((i, el) => {
  const href = $(el).attr('href');
  if (href && !hrefs.has(href)) {
    hrefs.add(href);
  }
});

// Filter to section-like URLs (numeric suffix)
Array.from(hrefs)
  .filter(h => h.match(/0-0-0-\d+$/))
  .slice(0, 30)
  .forEach(h => console.log(h));
