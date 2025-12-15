import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import connectDB from '@/lib/mongodb';
import VideoTranscript from '@/lib/models/VideoTranscript';
import { config } from '@/lib/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const unlink = promisify(fs.unlink);

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

function convertToSRT(segments: WhisperSegment[]): string {
  return segments
    .map((segment, index) => {
      const startTime = formatTime(segment.start);
      const endTime = formatTime(segment.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
    })
    .join('\n');
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export async function POST(req: NextRequest) {
  let audioPath: string | null = null;

  try {
    console.log('=== YouTube to SRT API Called ===');
    const { youtubeUrl, language = 'vi' } = await req.json();
    console.log('YouTube URL:', youtubeUrl);
    console.log('Language:', language);

    if (!youtubeUrl || !ytdl.validateURL(youtubeUrl)) {
      console.log('Error: Invalid YouTube URL');
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Check if already exists in DB
    await connectDB();
    const existing = await VideoTranscript.findOne({ youtubeUrl });
    if (existing) {
      return NextResponse.json({
        success: true,
        transcript: existing,
        cached: true,
      });
    }

    // Get video info
    const info = await ytdl.getInfo(youtubeUrl);
    const videoTitle = info.videoDetails.title;
    const duration = parseInt(info.videoDetails.lengthSeconds);

    // Download audio
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    audioPath = path.join(tempDir, `audio-${timestamp}.mp3`);

    await new Promise<void>((resolve, reject) => {
      const audioStream = ytdl(youtubeUrl, {
        quality: 'lowestaudio',
        filter: 'audioonly',
      });

      const writeStream = fs.createWriteStream(audioPath!);
      audioStream.pipe(writeStream);

      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
      audioStream.on('error', reject);
    });

    // Send to OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Generate SRT
    const srt = convertToSRT(transcription.segments || []);
    const transcript = transcription.text;

    // Save to DB
    const videoTranscript = new VideoTranscript({
      youtubeUrl,
      videoTitle,
      transcript,
      srt,
      duration,
      language,
    });
    await videoTranscript.save();

    // Cleanup audio file
    if (audioPath && fs.existsSync(audioPath)) {
      await unlink(audioPath);
    }

    return NextResponse.json({
      success: true,
      transcript: {
        _id: videoTranscript._id,
        youtubeUrl: videoTranscript.youtubeUrl,
        videoTitle: videoTranscript.videoTitle,
        transcript: videoTranscript.transcript,
        srt: videoTranscript.srt,
        duration: videoTranscript.duration,
        language: videoTranscript.language,
        createdAt: videoTranscript.createdAt,
        updatedAt: videoTranscript.updatedAt,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Error processing YouTube video:', error);

    // Cleanup on error
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        await unlink(audioPath);
      } catch (e) {
        console.error('Failed to cleanup audio file:', e);
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to process YouTube video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
