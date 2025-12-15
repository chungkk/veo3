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

Nhiệm vụ: Phân tích văn bản thành cấu trúc hierarchical:
1. **Scenes**: Các cảnh riêng biệt (địa điểm/thời gian/hành động chính)
2. **Frames**: Mỗi cảnh chia thành 2-4 khung hình nhỏ (góc quay/moment cụ thể)
3. **Prompts**: Mỗi frame có prompt chi tiết để generate video

Prompt phải bao gồm: màu sắc, ánh sáng, góc quay, hành động, cảm xúc, camera angle, mood.

Trả về JSON format:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneDescription": "Mô tả cảnh",
      "frames": [
        {
          "frameNumber": 1,
          "frameDescription": "Mô tả frame",
          "prompt": "Detailed video generation prompt with all technical details..."
        }
      ]
    }
  ]
}`,
          },
          {
            role: 'user',
            content: `Phân tích văn bản sau thành scenes → frames → prompts:\n\n${text}`,
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
    const scenes = result.scenes || [];

    // Step 4: Lưu vào MongoDB
    await connectDB();
    const story = new Story({
      originalText: text,
      scenes,
    });
    await story.save();

    return NextResponse.json({
      success: true,
      story: {
        _id: story._id,
        originalText: story.originalText,
        scenes: story.scenes,
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
