import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyManager } from '@/lib/apiKeyManager';
import { VideoGenerationRequest } from '@/lib/types';
import { config } from '@/lib/config';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export async function POST(request: NextRequest) {
  try {
    console.log('[Veo3] Received video generation request');
    const body: VideoGenerationRequest = await request.json();
    console.log('[Veo3] Request body parsed:', { hasPrompt: !!body.prompt, hasImage: !!body.image });
    const { prompt, image, resolution = '720p', aspectRatio = '16:9' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('[Veo3] Checking API keys from env...');
    console.log('[Veo3] GEMINI_API_KEYS env var:', process.env.GEMINI_API_KEYS ? 'exists' : 'missing');
    console.log('[Veo3] Config geminiApiKeys length:', config.geminiApiKeys.length);
    
    if (!config.geminiApiKeys || config.geminiApiKeys.length === 0) {
      return NextResponse.json({ error: 'Gemini API keys not configured' }, { status: 500 });
    }

    console.log(`[Veo3] Using ${config.geminiApiKeys.length} API key(s)`);
    const keyManager = new ApiKeyManager(config.geminiApiKeys);
    let currentKey = keyManager.getCurrentGeminiKey();
    let lastError: Error | null = null;

    // Try with each available API key
    for (let attempt = 0; attempt < config.geminiApiKeys.length; attempt++) {
      if (!currentKey) {
        break;
      }

      try {
        // Build request payload - Veo 3.1 does not support parameters inside instances
        const payload: {
          instances: Array<{
            prompt: string;
            image?: { bytesBase64Encoded: string };
          }>;
        } = {
          instances: [
            {
              prompt: prompt,
            },
          ],
        };

        // Add image if provided
        if (image) {
          const imageData = image.replace(/^data:image\/\w+;base64,/, '');
          payload.instances[0].image = {
            bytesBase64Encoded: imageData,
          };
        }

        const response = await fetch(
          `${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': currentKey,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Veo3] API Error: ${response.status}`, errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        keyManager.recordKeySuccess(currentKey);

        return NextResponse.json({
          operationName: data.name,
          message: 'Video generation started successfully',
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Error with API key ${attempt + 1}:`, err.message);
        keyManager.recordKeyError(currentKey);
        lastError = err;
        currentKey = keyManager.rotateToNextGeminiKey();
      }
    }

    // All keys failed
    return NextResponse.json(
      {
        error: 'All API keys failed',
        details: lastError?.message || 'Unknown error',
      },
      { status: 500 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error generating video:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
