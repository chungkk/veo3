import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function POST(req: NextRequest) {
  try {
    const { youtubeUrl } = await req.json();
    
    console.log('Testing YouTube URL:', youtubeUrl);
    
    // Validate URL
    const isValid = ytdl.validateURL(youtubeUrl);
    console.log('URL valid:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }
    
    // Try to get info
    console.log('Fetching video info...');
    const info = await ytdl.getInfo(youtubeUrl);
    
    return NextResponse.json({
      success: true,
      video: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        author: info.videoDetails.author.name,
        viewCount: info.videoDetails.viewCount,
        uploadDate: info.videoDetails.uploadDate,
        formats: info.formats.length,
        hasAudio: info.formats.some(f => f.hasAudio),
      }
    });
  } catch (error) {
    console.error('YouTube test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch YouTube video',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
