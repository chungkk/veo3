import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, geminiApiKey } = await request.json();

    if (!videoUrl || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Video URL and API key are required' },
        { status: 400 }
      );
    }

    const response = await fetch(videoUrl, {
      headers: {
        'x-goog-api-key': geminiApiKey,
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
