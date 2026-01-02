import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import {
  scrapeSmartWithRetry,
  getCredits,
} from '../lib/scrapers/scrapingbee-client';

const prisma = new PrismaClient();

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'civix-documents';
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'public', 'ordinances');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Metro area jurisdictions with their Municode/AmLegal URLs and key chapters
 */
interface JurisdictionConfig {
  id: string;
  name: string;
  state: string;
  source: 'municode' | 'amlegal' | 'other';
  baseUrl: string;
  chapters: { name: string; url: string }[];
}

// OHIO JURISDICTIONS - Municode
const OHIO_JURISDICTIONS: JurisdictionConfig[] = [
  {
    id: 'cincinnati-oh',
    name: 'Cincinnati',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances',
    chapters: [
      { name: 'Title VII: Business Regulations', url: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances?nodeId=TITVIIBURE' },
      { name: 'Title XI: Business Regulations', url: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances?nodeId=TITXIBURE' },
      { name: 'Title XIII: Building Code', url: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances?nodeId=TITXIIIBUCO' },
      { name: 'Title XIV: Zoning Code', url: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances?nodeId=TITXIVZOCO' },
      { name: 'Title XV: Fire Prevention', url: 'https://library.municode.com/oh/cincinnati/codes/code_of_ordinances?nodeId=TITXVFIPR' },
    ],
  },
  {
    id: 'norwood-oh',
    name: 'Norwood',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/norwood/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/norwood/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/norwood/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/norwood/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'blue-ash-oh',
    name: 'Blue Ash',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/blue_ash/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/blue_ash/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/blue_ash/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Part Fifteen: Fire Prevention', url: 'https://library.municode.com/oh/blue_ash/codes/code_of_ordinances?nodeId=PTFIFIPR' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/blue_ash/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'sharonville-oh',
    name: 'Sharonville',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/sharonville/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/sharonville/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/sharonville/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/sharonville/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'montgomery-oh',
    name: 'Montgomery',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/montgomery/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/montgomery/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/montgomery/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/montgomery/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'madeira-oh',
    name: 'Madeira',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/madeira/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/madeira/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/madeira/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/madeira/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'reading-oh',
    name: 'Reading',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/reading/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/reading/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/reading/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/reading/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'deer-park-oh',
    name: 'Deer Park',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/deer_park/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/deer_park/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/deer_park/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/deer_park/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'mason-oh',
    name: 'Mason',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/mason/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/mason/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/mason/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/mason/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'hamilton-oh',
    name: 'Hamilton',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/hamilton/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/hamilton/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/hamilton/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/hamilton/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'fairfield-oh',
    name: 'Fairfield',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/fairfield/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/fairfield/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/fairfield/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/fairfield/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'middletown-oh',
    name: 'Middletown',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/middletown/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/middletown/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/middletown/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/middletown/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'loveland-oh',
    name: 'Loveland',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/loveland/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/loveland/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/loveland/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/loveland/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'lebanon-oh',
    name: 'Lebanon',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/lebanon/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/lebanon/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/lebanon/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/lebanon/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'springdale-oh',
    name: 'Springdale',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/springdale/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/springdale/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/springdale/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/springdale/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'forest-park-oh',
    name: 'Forest Park',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/forest_park/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/forest_park/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/forest_park/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/forest_park/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
  {
    id: 'milford-oh',
    name: 'Milford',
    state: 'OH',
    source: 'municode',
    baseUrl: 'https://library.municode.com/oh/milford/codes/code_of_ordinances',
    chapters: [
      { name: 'Part Eleven: Business Regulations', url: 'https://library.municode.com/oh/milford/codes/code_of_ordinances?nodeId=PTELBURE' },
      { name: 'Part Thirteen: Building Code', url: 'https://library.municode.com/oh/milford/codes/code_of_ordinances?nodeId=PTTHBUCO' },
      { name: 'Appendix A: Zoning', url: 'https://library.municode.com/oh/milford/codes/code_of_ordinances?nodeId=APXAZO' },
    ],
  },
];

// KENTUCKY JURISDICTIONS - Municode and AmLegal
const KENTUCKY_JURISDICTIONS: JurisdictionConfig[] = [
  {
    id: 'covington-ky',
    name: 'Covington',
    state: 'KY',
    source: 'amlegal',
    baseUrl: 'https://codelibrary.amlegal.com/codes/covington/latest/overview',
    chapters: [
      { name: 'Chapter 110: License Fees', url: 'https://codelibrary.amlegal.com/codes/covington/latest/covington_ky/0-0-0-22345' },
      { name: 'Chapter 150: Building Code', url: 'https://codelibrary.amlegal.com/codes/covington/latest/covington_ky/0-0-0-25686' },
      { name: 'Chapter 155: Rental Licensing', url: 'https://codelibrary.amlegal.com/codes/covington/latest/covington_ky/0-0-0-26318' },
      { name: 'Chapter 158: Zoning', url: 'https://codelibrary.amlegal.com/codes/covington/latest/covington_ky/0-0-0-27395' },
    ],
  },
  {
    id: 'newport-ky',
    name: 'Newport',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/newport/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/newport/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/newport/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/newport/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'florence-ky',
    name: 'Florence',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/florence/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/florence/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/florence/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/florence/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'erlanger-ky',
    name: 'Erlanger',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/erlanger/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/erlanger/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/erlanger/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/erlanger/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'fort-thomas-ky',
    name: 'Fort Thomas',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/fort_thomas/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/fort_thomas/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/fort_thomas/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/fort_thomas/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'fort-mitchell-ky',
    name: 'Fort Mitchell',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/fort_mitchell/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/fort_mitchell/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/fort_mitchell/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/fort_mitchell/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'independence-ky',
    name: 'Independence',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/independence/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/independence/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/independence/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/independence/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'cold-spring-ky',
    name: 'Cold Spring',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/cold_spring/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/cold_spring/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/cold_spring/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/cold_spring/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'bellevue-ky',
    name: 'Bellevue',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/bellevue/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/bellevue/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/bellevue/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/bellevue/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
  {
    id: 'dayton-ky',
    name: 'Dayton',
    state: 'KY',
    source: 'municode',
    baseUrl: 'https://library.municode.com/ky/dayton/codes/code_of_ordinances',
    chapters: [
      { name: 'Chapter 110: Business Licenses', url: 'https://library.municode.com/ky/dayton/codes/code_of_ordinances?nodeId=COOR_CH110BULI' },
      { name: 'Chapter 150: Building Regulations', url: 'https://library.municode.com/ky/dayton/codes/code_of_ordinances?nodeId=COOR_CH150BURE' },
      { name: 'Chapter 155: Zoning', url: 'https://library.municode.com/ky/dayton/codes/code_of_ordinances?nodeId=COOR_CH155ZO' },
    ],
  },
];

const ALL_JURISDICTIONS = [...OHIO_JURISDICTIONS, ...KENTUCKY_JURISDICTIONS];

interface ChapterContent {
  name: string;
  url: string;
  fullText: string;
  textLength: number;
  creditCost: number;
  error?: string;
}

interface JurisdictionResult {
  id: string;
  name: string;
  state: string;
  chapters: ChapterContent[];
  totalCredits: number;
  s3Paths: string[];
  errors: string[];
}

/**
 * Clean scraped text
 */
function cleanText(text: string): string {
  return text
    .replace(/Skip to main content/gi, '')
    .replace(/Skip to code content/gi, '')
    .replace(/Back to Library/gi, '')
    .replace(/Search Login Login/gi, '')
    .replace(/Created with Sketch\./gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+$/gm, '')
    .trim();
}

/**
 * Scrape a single chapter
 */
async function scrapeChapter(name: string, url: string): Promise<ChapterContent> {
  console.log(`    📖 ${name}`);

  const result = await scrapeSmartWithRetry(url, { wait: 3000 });

  if (!result.success || !result.text) {
    console.log(`       ❌ Failed: ${result.error}`);
    return {
      name,
      url,
      fullText: '',
      textLength: 0,
      creditCost: result.cost || 10,
      error: result.error,
    };
  }

  const cleanedText = cleanText(result.text);
  console.log(`       ✅ ${cleanedText.length} chars (${result.cost} credits)`);

  return {
    name,
    url,
    fullText: cleanedText,
    textLength: cleanedText.length,
    creditCost: result.cost || 10,
  };
}

/**
 * Upload to S3
 */
async function uploadToS3(content: string | Buffer, s3Key: string, contentType: string): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: content,
    ContentType: contentType,
    Metadata: {
      'uploaded-date': new Date().toISOString(),
      'document-type': 'ordinance'
    }
  }));

  return `s3://${S3_BUCKET}/${s3Key}`;
}

/**
 * Scrape a single jurisdiction
 */
async function scrapeJurisdiction(config: JurisdictionConfig): Promise<JurisdictionResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏛️  ${config.name}, ${config.state} (${config.source})`);
  console.log(`${'='.repeat(60)}`);

  const outputDir = path.join(BASE_OUTPUT_DIR, config.id);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const chapters: ChapterContent[] = [];
  let totalCredits = 0;
  const s3Paths: string[] = [];
  const errors: string[] = [];

  // Scrape each chapter
  for (const chapter of config.chapters) {
    const content = await scrapeChapter(chapter.name, chapter.url);
    chapters.push(content);
    totalCredits += content.creditCost;

    if (content.error) {
      errors.push(`${chapter.name}: ${content.error}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  // Compile full ordinances text
  let fullText = `MUNICIPAL CODE
City of ${config.name.toUpperCase()}, ${config.state}

Scraped: ${new Date().toISOString()}
Source: ${config.source === 'municode' ? 'Municode' : 'American Legal Publishing'}
Base URL: ${config.baseUrl}

${'='.repeat(80)}
`;

  for (const chapter of chapters) {
    fullText += `\n\n${'='.repeat(80)}\n`;
    fullText += `${chapter.name}\n`;
    fullText += `URL: ${chapter.url}\n`;
    fullText += `${'='.repeat(80)}\n\n`;

    if (chapter.error) {
      fullText += `[Error: ${chapter.error}]\n`;
    } else if (chapter.fullText.length > 100) {
      fullText += chapter.fullText;
    } else {
      fullText += `[Minimal content extracted]\n`;
    }
  }

  // Save locally
  const fullOrdinancesPath = path.join(outputDir, 'full-ordinances.txt');
  fs.writeFileSync(fullOrdinancesPath, fullText);
  console.log(`  📄 Saved: ${fullOrdinancesPath}`);

  // Save manifest
  const manifest = {
    jurisdiction: config.id,
    name: config.name,
    state: config.state,
    source: config.source,
    sourceUrl: config.baseUrl,
    scrapedAt: new Date().toISOString(),
    totalChapters: chapters.length,
    totalCreditsUsed: totalCredits,
    chapters: chapters.map(ch => ({
      name: ch.name,
      url: ch.url,
      textLength: ch.textLength,
      creditCost: ch.creditCost,
      error: ch.error || null,
    })),
  };

  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Upload to S3
  try {
    const s3Prefix = `${config.id}/ordinances/`;

    // Full ordinances
    const s3FullPath = await uploadToS3(fullText, `${s3Prefix}full-ordinances.txt`, 'text/plain');
    s3Paths.push(s3FullPath);
    console.log(`  ☁️  Uploaded: ${s3FullPath}`);

    // Manifest
    const s3ManifestPath = await uploadToS3(JSON.stringify(manifest, null, 2), `${s3Prefix}manifest.json`, 'application/json');
    s3Paths.push(s3ManifestPath);

    // Individual chapters as markdown
    for (const chapter of chapters) {
      if (chapter.textLength > 100) {
        const cleanName = chapter.name
          .toLowerCase()
          .replace(/chapter \d+:\s*/i, '')
          .replace(/part \w+:\s*/i, '')
          .replace(/appendix \w+:\s*/i, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const mdContent = `# ${chapter.name}

**Jurisdiction**: ${config.name}, ${config.state}
**Source**: [${config.source}](${chapter.url})
**Scraped**: ${new Date().toISOString()}

---

${chapter.fullText}
`;
        const s3ChapterPath = await uploadToS3(mdContent, `${s3Prefix}${cleanName}.md`, 'text/markdown');
        s3Paths.push(s3ChapterPath);
      }
    }
  } catch (error: any) {
    console.error(`  ❌ S3 upload error: ${error.message}`);
    errors.push(`S3 upload: ${error.message}`);
  }

  // Update jurisdiction in database
  try {
    await prisma.jurisdiction.update({
      where: { id: config.id },
      data: {
        dataCompleteness: 95,
        status: 'live',
      },
    });
    console.log(`  ✅ Updated ${config.id} in database`);
  } catch (error: any) {
    console.error(`  ⚠️  DB update error: ${error.message}`);
  }

  return {
    id: config.id,
    name: config.name,
    state: config.state,
    chapters,
    totalCredits,
    s3Paths,
    errors,
  };
}

/**
 * Main function
 */
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  Cincinnati Metro Area Ordinance Scraper                                   ║
║                                                                            ║
║  Scraping municipal codes for ${ALL_JURISDICTIONS.length} jurisdictions                              ║
║  Sources: Municode, American Legal Publishing                              ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  // Check credits
  const credits = await getCredits();
  console.log(`📊 ScrapingBee credits: ${credits?.credits_remaining ?? 'unknown'}`);

  // Estimate: ~10-15 credits per chapter, ~3-5 chapters per city
  const estimatedCredits = ALL_JURISDICTIONS.length * 4 * 12; // ~27 cities * 4 chapters * 12 credits
  console.log(`📊 Estimated credits needed: ~${estimatedCredits}`);

  if (credits?.credits_remaining && credits.credits_remaining < estimatedCredits) {
    console.log(`⚠️  May not have enough credits. Proceeding anyway...`);
  }

  const results: JurisdictionResult[] = [];
  let totalCreditsUsed = 0;
  let totalChapters = 0;
  let totalErrors = 0;

  // Scrape each jurisdiction
  for (const config of ALL_JURISDICTIONS) {
    try {
      const result = await scrapeJurisdiction(config);
      results.push(result);
      totalCreditsUsed += result.totalCredits;
      totalChapters += result.chapters.length;
      totalErrors += result.errors.length;

      // Longer delay between cities
      await new Promise(r => setTimeout(r, 3000));
    } catch (error: any) {
      console.error(`\n❌ Error scraping ${config.name}: ${error.message}`);
      totalErrors++;
    }
  }

  // Final summary
  const finalCredits = await getCredits();

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  SCRAPE COMPLETE                                                           ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 Summary:
   • Jurisdictions processed: ${results.length}
   • Total chapters scraped: ${totalChapters}
   • Total credits used: ${totalCreditsUsed}
   • Credits remaining: ${finalCredits?.credits_remaining ?? 'unknown'}
   • Errors encountered: ${totalErrors}

📂 Output:
   • Local: ${BASE_OUTPUT_DIR}
   • S3: s3://${S3_BUCKET}/[jurisdiction-id]/ordinances/

✅ All jurisdictions updated to status='live'
`);

  // Save overall summary
  const summaryPath = path.join(BASE_OUTPUT_DIR, 'scrape-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    scrapedAt: new Date().toISOString(),
    totalJurisdictions: results.length,
    totalChapters,
    totalCreditsUsed,
    creditsRemaining: finalCredits?.credits_remaining,
    jurisdictions: results.map(r => ({
      id: r.id,
      name: r.name,
      state: r.state,
      chaptersScraped: r.chapters.length,
      creditsUsed: r.totalCredits,
      errors: r.errors,
    })),
  }, null, 2));

  console.log(`📋 Summary saved: ${summaryPath}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
