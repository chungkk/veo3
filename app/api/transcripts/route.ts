import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoTranscript from '@/lib/models/VideoTranscript';

export async function GET() {
  try {
    await connectDB();
    const transcripts = await VideoTranscript.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-srt -transcript');
    
    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcripts' },
      { status: 500 }
    );
  }
}
