import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/civics/topics/[topic]?jurisdiction=cincinnati-oh
 *
 * Returns full rule data for a specific topic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;
  const searchParams = request.nextUrl.searchParams;
  const jurisdictionParam = searchParams.get('jurisdiction') || 'cincinnati-oh';

  // Determine jurisdiction folder
  const jurisdictionFolder = jurisdictionParam.replace('-oh', '').toLowerCase();
  const rulesDir = path.join(process.cwd(), 'data', 'rules', jurisdictionFolder);
  const indexPath = path.join(rulesDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    return NextResponse.json(
      { error: `No rules available for ${jurisdictionParam}` },
      { status: 404 }
    );
  }

  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    // Find the topic
    const topicInfo = index.topics.find((t: any) => t.id === topic);

    if (!topicInfo) {
      return NextResponse.json(
        {
          error: `Topic "${topic}" not found`,
          available_topics: index.topics.map((t: any) => t.id),
        },
        { status: 404 }
      );
    }

    // Load the topic file
    const topicPath = path.join(rulesDir, topicInfo.file);

    if (!fs.existsSync(topicPath)) {
      return NextResponse.json(
        { error: `Topic file not found: ${topicInfo.file}` },
        { status: 404 }
      );
    }

    const topicData = JSON.parse(fs.readFileSync(topicPath, 'utf-8'));

    return NextResponse.json({
      jurisdiction: index.jurisdiction,
      jurisdiction_name: index.jurisdiction_name,
      topic: topicInfo,
      data: topicData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to load topic: ${error.message}` },
      { status: 500 }
    );
  }
}
