const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('temp-scrape.html', 'utf8');
const $ = cheerio.load(html);

// Remove unwanted elements
$('script, style, nav, header, footer').remove();

// Get text and clean it
const text = $('body').text().replace(/\s+/g, ' ').trim();

// Print sections 127.xx
console.log('=== CHAPTER 127 CONTENT ===\n');
const match = text.match(/§\s*127\.\d+.*?(?=§\s*127\.\d+|$)/gs);
if (match) {
  match.forEach((section, i) => {
    console.log(`\n--- Section ${i + 1} ---`);
    console.log(section.substring(0, 2000));
  });
}

// Print total length
console.log('\n\n=== TOTAL TEXT LENGTH ===');
console.log(text.length, 'characters');

// Save clean text
fs.writeFileSync('temp-clean.txt', text);
console.log('\nSaved clean text to temp-clean.txt');
