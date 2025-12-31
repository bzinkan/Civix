/**
 * Test RAG System with Cincinnati Ordinances
 *
 * Usage:
 *   npx tsx scripts/test-rag.ts
 */

import { answerQuestion, answerQuestionsBatch } from '../lib/ordinances/rag';
import { getOrdinanceStats } from '../lib/ordinances/search';

// Test questions covering different aspects of Cincinnati STR ordinances
const TEST_QUESTIONS = [
  "Can I operate a short-term rental in Cincinnati?",
  "Do I need insurance for a short-term rental?",
  "How many short-term rentals are allowed in a building?",
  "Is affordable housing eligible for short-term rental?",
  "What is the definition of a short-term rental?",
  "How do I register my short-term rental?",
  "Can I have chickens in my backyard in Cincinnati?",  // Should say "not covered"
  "What are the penalties for operating without registration?",
  "Do I need to live within 50 miles of my STR?",
  "Are there limits on the number of units in my building?",
];

async function main() {
  console.log('🧪 Testing RAG System with Cincinnati Ordinances\n');
  console.log('='.repeat(70));

  // Show ordinance coverage stats
  console.log('\n📊 Ordinance Coverage:\n');
  const stats = await getOrdinanceStats();
  console.log(`   Total chunks: ${stats.totalChunks}`);
  console.log(`   Chapters covered: ${stats.chaptersCovered}`);
  console.log(`   Jurisdictions: ${stats.jurisdictions.length}\n`);

  for (const jurisdiction of stats.jurisdictions) {
    console.log(`   - ${jurisdiction.name}, ${jurisdiction.state} (${jurisdiction.documents} documents)`);
  }

  console.log('\n' + '='.repeat(70));

  // Test individual questions
  console.log('\n🤖 Testing Questions:\n');

  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const question = TEST_QUESTIONS[i];

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Question ${i + 1}/${TEST_QUESTIONS.length}: ${question}`);
    console.log('─'.repeat(70));

    try {
      const result = await answerQuestion(question, {
        jurisdictionSlug: 'cincinnati-oh',
      });

      console.log(`\n✅ Answer (Confidence: ${result.confidence}):`);
      console.log(`   ${result.answer}\n`);

      if (result.citations.length > 0) {
        console.log(`📚 Citations (${result.citations.length}):`);
        result.citations.slice(0, 3).forEach((cite, idx) => {
          const section = cite.section || cite.chapter;
          console.log(`   ${idx + 1}. Section ${section} (similarity: ${cite.similarity.toFixed(2)})`);
          console.log(`      ${cite.title}`);
        });
      } else {
        console.log('📚 No citations found');
      }

      if (result.suggestLawyer) {
        console.log('\n⚖️  Recommendation: Consult with a lawyer for legal advice specific to your situation.');
      }

    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`);
    }

    // Rate limiting between questions
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Testing complete!\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:');
  console.error(error);
  process.exit(1);
});
