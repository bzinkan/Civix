import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/civics/topics?jurisdiction=cincinnati-oh
 *
 * Returns list of available civics topics for a jurisdiction
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jurisdictionParam = searchParams.get('jurisdiction') || 'cincinnati-oh';

  // Determine jurisdiction folder
  const jurisdictionFolder = jurisdictionParam.replace('-oh', '').toLowerCase();
  const rulesDir = path.join(process.cwd(), 'data', 'rules', jurisdictionFolder);
  const indexPath = path.join(rulesDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    return NextResponse.json({
      jurisdiction: jurisdictionParam,
      topics: [],
      message: `No structured rules available for ${jurisdictionParam}`,
    });
  }

  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    return NextResponse.json({
      jurisdiction: index.jurisdiction,
      jurisdiction_name: index.jurisdiction_name,
      state: index.state,
      version: index.version,
      last_updated: index.last_updated,
      topics: index.topics.map((t: any) => ({
        id: t.id,
        title: t.title,
        keywords: t.keywords,
        ordinance_reference: t.ordinance_reference,
      })),
      common_questions: index.common_questions,
      contact: index.contact,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to load topics: ${error.message}` },
      { status: 500 }
    );
  }
}
