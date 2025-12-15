import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userInput, openaiApiKey } = await request.json();

    if (!userInput) {
      return NextResponse.json({ error: 'User input is required' }, { status: 400 });
    }

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating detailed video generation prompts for Veo 3.1, Google's AI video generation model.

Given a user's basic idea, expand it into a detailed, cinematic prompt that includes:
- Camera movements and angles (close-up, wide shot, tracking, etc.)
- Lighting and atmosphere
- Specific actions and movements
- Audio descriptions if relevant
- Style and mood
- Important visual details

Generate 3 different variations of prompts based on the user's input. Each should be detailed and ready to use with Veo 3.1.

Return ONLY a JSON object with this structure:
{
  "suggestions": ["prompt 1", "prompt 2", "prompt 3"]
}`,
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(content);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error suggesting prompt:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
