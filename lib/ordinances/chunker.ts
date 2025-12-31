/**
 * Ordinance Text Chunker
 *
 * Intelligently splits ordinance documents into semantic chunks for vector embedding.
 * Preserves section structure and metadata.
 */

export interface OrdinanceChunk {
  chapter: string;
  section?: string;
  title: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

export interface ChunkerOptions {
  maxTokens?: number;      // Max tokens per chunk (default: 512)
  overlapTokens?: number;  // Overlap between chunks (default: 50)
  preserveSections?: boolean; // Keep sections intact (default: true)
}

const DEFAULT_OPTIONS: Required<ChunkerOptions> = {
  maxTokens: 512,
  overlapTokens: 50,
  preserveSections: true,
};

/**
 * Rough token count estimator (1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract chapter and section numbers from ordinance text
 * Examples: "856-17(a)", "Sec. 856-1-H", "Chapter 856"
 */
function extractMetadata(text: string): { chapter: string; section?: string } {
  // Try to match section patterns
  const sectionMatch = text.match(/(?:Sec\.|Section)?\s*(\d+)-(\d+(?:-[A-Z]\d?)?(?:\([a-z]\d?\))?)/i);
  if (sectionMatch) {
    return {
      chapter: sectionMatch[1],
      section: `${sectionMatch[1]}-${sectionMatch[2]}`,
    };
  }

  // Try to match chapter-only pattern
  const chapterMatch = text.match(/Chapter\s*(\d+)/i);
  if (chapterMatch) {
    return {
      chapter: chapterMatch[1],
    };
  }

  return { chapter: 'unknown' };
}

/**
 * Extract title from ordinance section
 * Looks for headings like "## Sec. 856-17. Limitations on Operation"
 */
function extractTitle(text: string): string {
  const lines = text.split('\n');

  // Look for markdown headings
  for (const line of lines.slice(0, 5)) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
  }

  // Fallback: use first non-empty line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length > 0) {
      return trimmed.substring(0, 100);
    }
  }

  return 'Untitled Section';
}

/**
 * Split markdown text by section boundaries
 * Sections are identified by markdown headers (##, ###)
 */
function splitIntoSections(text: string): string[] {
  const sections: string[] = [];
  const lines = text.split('\n');
  let currentSection: string[] = [];

  for (const line of lines) {
    // Check if this is a section boundary (## or ### heading)
    if (line.match(/^#{2,3}\s+Sec\.\s*\d+/)) {
      // Save previous section if it exists
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        currentSection = [];
      }
    }
    currentSection.push(line);
  }

  // Add final section
  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }

  return sections.filter(s => s.trim().length > 0);
}

/**
 * Chunk a single section if it exceeds maxTokens
 */
function chunkSection(
  sectionText: string,
  maxTokens: number,
  overlapTokens: number
): string[] {
  const tokens = estimateTokens(sectionText);

  // If section fits in one chunk, return as-is
  if (tokens <= maxTokens) {
    return [sectionText];
  }

  // Split into paragraphs
  const paragraphs = sectionText.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);

    // If adding this paragraph would exceed max, start new chunk
    if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));

      // Start new chunk with overlap (last few paragraphs)
      const overlapParagraphs = currentChunk.slice(-2); // Keep last 2 paragraphs
      currentChunk = overlapParagraphs;
      currentTokens = estimateTokens(currentChunk.join('\n\n'));
    }

    currentChunk.push(paragraph);
    currentTokens += paragraphTokens;
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
}

/**
 * Main chunking function
 *
 * Takes ordinance text (markdown format) and returns an array of semantic chunks
 * optimized for vector embedding and semantic search.
 */
export function chunkOrdinance(
  text: string,
  options: ChunkerOptions = {}
): OrdinanceChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: OrdinanceChunk[] = [];

  // Split into sections first
  const sections = opts.preserveSections
    ? splitIntoSections(text)
    : [text];

  let globalChunkIndex = 0;

  for (const section of sections) {
    const metadata = extractMetadata(section);
    const title = extractTitle(section);

    // Chunk the section if needed
    const sectionChunks = chunkSection(section, opts.maxTokens, opts.overlapTokens);

    for (const chunkText of sectionChunks) {
      chunks.push({
        chapter: metadata.chapter,
        section: metadata.section,
        title,
        content: chunkText,
        chunkIndex: globalChunkIndex++,
        tokenCount: estimateTokens(chunkText),
      });
    }
  }

  return chunks;
}

/**
 * Chunk an entire ordinance document (multiple chapters)
 */
export function chunkOrdinanceDocument(
  chapterTexts: Map<string, string>,
  options: ChunkerOptions = {}
): OrdinanceChunk[] {
  const allChunks: OrdinanceChunk[] = [];

  for (const [chapter, text] of chapterTexts) {
    const chunks = chunkOrdinance(text, options);

    // Override chapter if it wasn't detected correctly
    for (const chunk of chunks) {
      if (chunk.chapter === 'unknown') {
        chunk.chapter = chapter;
      }
    }

    allChunks.push(...chunks);
  }

  return allChunks;
}
