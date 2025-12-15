import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGeminiKeys: !!process.env.GEMINI_API_KEYS,
    geminiKeysLength: process.env.GEMINI_API_KEYS?.split(',').filter(k => k.trim()).length || 0,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
