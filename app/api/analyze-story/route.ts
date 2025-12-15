import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';
import { config } from '@/lib/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function POST(req: NextRequest) {
  try {
    console.log('=== Analyze Story API Called ===');
    const { text } = await req.json();
    console.log('Text length:', text?.length || 0);

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('Error: Text is required');
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Single OpenAI call để phân tích toàn bộ
    console.log('Analyzing story with OpenAI...');
    const analysisResponse = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia phân tích kịch bản phim và viết prompt cho AI video generation.

Nhiệm vụ: Phân tích văn bản thành cấu trúc hierarchical chi tiết:
1. **Sentences**: Tách văn bản thành từng câu riêng biệt
2. **Ideas**: Mỗi câu phân tích thành các ý nhỏ (visual concepts, metaphors, actions)
3. **Prompts**: Mỗi ý nhỏ có prompt chi tiết để generate video

Quy trình phân tích:
- Tách text thành các câu hoàn chỉnh
- Mỗi câu xác định các ý chính (thường 1-3 ý/câu)
- Mỗi ý tạo prompt video với: màu sắc, ánh sáng, góc quay, hành động, cảm xúc, camera angle, mood

Ví dụ:
Câu: "Hãy tưởng tượng bạn là một người điều hành điên rồ quyết định đốt sạch toàn bộ giá trị vốn hóa của hãng xe Ford Motor"
→ Ý 1: Người điều hành điên rồ (visual: crazy executive)
→ Ý 2: Đốt sạch giá trị Ford Motor (metaphor: burning money/value)

Trả về JSON format:
{
  "sentences": [
    {
      "sentenceNumber": 1,
      "sentenceText": "Câu gốc...",
      "ideas": [
        {
          "ideaNumber": 1,
          "ideaDescription": "Mô tả ý chính",
          "prompt": "Detailed video generation prompt..."
        }
      ]
    }
  ]
}`,
          },
          {
            role: 'user',
            content: `Phân tích văn bản sau thành sentences → ideas → prompts:\n\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI request timeout after 60s')), 60000)
      )
    ]);
    console.log('OpenAI analysis completed');

    const response = analysisResponse as ChatCompletion;
    const result = JSON.parse(response.choices[0].message.content || '{}');
    const sentences = result.sentences || [];

    // Step 4: Lưu vào MongoDB
    await connectDB();
    const story = new Story({
      originalText: text,
      sentences,
    });
    await story.save();

    return NextResponse.json({
      success: true,
      story: {
        _id: story._id,
        originalText: story.originalText,
        sentences: story.sentences,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error analyzing story:', error);
    return NextResponse.json(
      { error: 'Failed to analyze story', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
