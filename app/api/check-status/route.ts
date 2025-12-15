import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export async function POST(request: NextRequest) {
  try {
    const { operationName } = await request.json();

    if (!operationName) {
      return NextResponse.json(
        { error: 'Operation name is required' },
        { status: 400 }
      );
    }

    if (!config.geminiApiKeys || config.geminiApiKeys.length === 0) {
      return NextResponse.json({ error: 'Gemini API keys not configured' }, { status: 500 });
    }

    const response = await fetch(`${BASE_URL}/${operationName}`, {
      method: 'GET',
      headers: {
        'x-goog-api-key': config.geminiApiKeys[0],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.done) {
      // Extract video URI
      const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

      if (videoUri) {
        return NextResponse.json({
          done: true,
          operationName,
          videoUrl: videoUri,
        });
      } else {
        return NextResponse.json({
          done: true,
          operationName,
          error: 'Video generation completed but no video URL found',
        });
      }
    }

    // Still processing
    return NextResponse.json({
      done: false,
      operationName,
      progress: data.metadata?.progressPercentage || 0,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error checking status:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
