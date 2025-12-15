import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    if (!config.geminiApiKeys || config.geminiApiKeys.length === 0) {
      return NextResponse.json({ error: 'Gemini API keys not configured' }, { status: 500 });
    }

    const response = await fetch(videoUrl, {
      headers: {
        'x-goog-api-key': config.geminiApiKeys[0],
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download video: ${response.status}` },
        { status: response.status }
      );
    }

    const videoBuffer = await response.arrayBuffer();

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="generated-video.mp4"',
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error downloading video:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
