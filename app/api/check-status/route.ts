import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export async function POST(request: NextRequest) {
  try {
    const { operationName, geminiApiKey } = await request.json();

    if (!operationName || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Operation name and API key are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BASE_URL}/${operationName}`, {
      method: 'GET',
      headers: {
        'x-goog-api-key': geminiApiKey,
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
