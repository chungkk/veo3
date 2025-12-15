export const config = {
  geminiApiKeys: process.env.GEMINI_API_KEYS?.split(',').map(k => k.trim()).filter(Boolean) || [],
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};
