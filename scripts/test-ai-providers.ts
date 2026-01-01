// Test script to verify all AI provider APIs are working
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

async function testGemini(): Promise<{ success: boolean; message: string; tokens?: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'GEMINI_API_KEY not configured' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say "Gemini API working" in exactly 3 words.' }] }],
    });

    const response = result.response;
    const text = response.text();
    const tokens = response.usageMetadata?.totalTokenCount;

    return {
      success: true,
      message: `Response: "${text.trim()}"`,
      tokens
    };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function testAnthropic(): Promise<{ success: boolean; message: string; tokens?: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'ANTHROPIC_API_KEY not configured' };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "Anthropic API working" in exactly 3 words.' }],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    const tokens = response.usage.input_tokens + response.usage.output_tokens;

    return {
      success: true,
      message: `Response: "${text.trim()}"`,
      tokens
    };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function testOpenAI(): Promise<{ success: boolean; message: string; tokens?: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'OPENAI_API_KEY not configured' };
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "OpenAI API working" in exactly 3 words.' }],
    });

    const text = response.choices[0].message.content || '';
    const tokens = response.usage?.total_tokens;

    return {
      success: true,
      message: `Response: "${text.trim()}"`,
      tokens
    };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Testing AI Provider APIs');
  console.log('='.repeat(60));
  console.log('');

  // Test Anthropic
  console.log('1. Testing Anthropic (Claude) API...');
  const anthropicResult = await testAnthropic();
  console.log(`   Status: ${anthropicResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   ${anthropicResult.message}`);
  if (anthropicResult.tokens) console.log(`   Tokens used: ${anthropicResult.tokens}`);
  console.log('');

  // Test OpenAI
  console.log('2. Testing OpenAI API...');
  const openaiResult = await testOpenAI();
  console.log(`   Status: ${openaiResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   ${openaiResult.message}`);
  if (openaiResult.tokens) console.log(`   Tokens used: ${openaiResult.tokens}`);
  console.log('');

  // Test Gemini
  console.log('3. Testing Gemini API...');
  const geminiResult = await testGemini();
  console.log(`   Status: ${geminiResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   ${geminiResult.message}`);
  if (geminiResult.tokens) console.log(`   Tokens used: ${geminiResult.tokens}`);
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  const results = [
    { name: 'Anthropic (Claude)', ...anthropicResult },
    { name: 'OpenAI (GPT)', ...openaiResult },
    { name: 'Gemini', ...geminiResult },
  ];

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    console.log(`  ${r.success ? '[PASS]' : '[FAIL]'} ${r.name}`);
  });
  console.log('');
  console.log(`Result: ${passed}/${results.length} APIs working`);

  if (failed > 0) {
    console.log('\nFailed APIs may have invalid or expired API keys.');
  }
}

main().catch(console.error);
