import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';
import { config } from '@/lib/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Step 1: Phân tích text thành các scenes
    const scenesResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là chuyên gia phân tích kịch bản phim. Nhiệm vụ của bạn là phân tích văn bản thành các cảnh (scenes) riêng biệt. Mỗi cảnh nên có một địa điểm, thời gian hoặc hành động chính rõ ràng.

Trả về JSON với format:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneDescription": "Mô tả cảnh này"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Phân tích văn bản sau thành các cảnh:\n\n${text}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const scenesData = JSON.parse(scenesResponse.choices[0].message.content || '{}');
    const scenes = scenesData.scenes || [];

    // Step 2: Với mỗi scene, chia thành frames
    for (const scene of scenes) {
      const framesResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia phân cảnh phim. Nhiệm vụ của bạn là chia một cảnh thành các khung hình (frames) nhỏ hơn. Mỗi frame nên là một góc quay, hành động hoặc moment cụ thể.

Trả về JSON với format:
{
  "frames": [
    {
      "frameNumber": 1,
      "frameDescription": "Mô tả khung hình này"
    }
  ]
}`,
          },
          {
            role: 'user',
            content: `Chia cảnh sau thành các khung hình:\n\nCảnh ${scene.sceneNumber}: ${scene.sceneDescription}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const framesData = JSON.parse(framesResponse.choices[0].message.content || '{}');
      const frames = framesData.frames || [];

      // Step 3: Với mỗi frame, tạo prompt chi tiết
      scene.frames = [];
      for (const frame of frames) {
        const promptResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Bạn là chuyên gia viết prompt cho AI tạo video. Nhiệm vụ của bạn là viết prompt chi tiết, rõ ràng cho từng khung hình.

Prompt cần bao gồm:
- Mô tả hình ảnh cụ thể (màu sắc, ánh sáng, góc quay)
- Hành động và chuyển động
- Cảm xúc và không khí
- Chi tiết kỹ thuật (camera angle, lighting, mood)

Chỉ trả về prompt, không giải thích thêm.`,
            },
            {
              role: 'user',
              content: `Viết prompt chi tiết cho khung hình:\n\nCảnh ${scene.sceneNumber}: ${scene.sceneDescription}\nFrame ${frame.frameNumber}: ${frame.frameDescription}`,
            },
          ],
          temperature: 0.8,
        });

        scene.frames.push({
          frameNumber: frame.frameNumber,
          frameDescription: frame.frameDescription,
          prompt: promptResponse.choices[0].message.content?.trim() || '',
        });
      }
    }

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
