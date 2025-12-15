import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyManager } from '@/lib/apiKeyManager';
import { VideoGenerationRequest } from '@/lib/types';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest & { geminiApiKeys: string[] } = await request.json();
    const { prompt, image, resolution = '720p', aspectRatio = '16:9', geminiApiKeys } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!geminiApiKeys || geminiApiKeys.length === 0) {
      return NextResponse.json({ error: 'At least one Gemini API key is required' }, { status: 400 });
    }

    const keyManager = new ApiKeyManager(geminiApiKeys);
    let currentKey = keyManager.getCurrentGeminiKey();
    let lastError: any = null;

    // Try with each available API key
    for (let attempt = 0; attempt < geminiApiKeys.length; attempt++) {
      if (!currentKey) {
        break;
      }

      try {
        // Build request payload
        const payload: any = {
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

        // Add configuration
        payload.instances[0].parameters = {
          aspectRatio: aspectRatio,
          resolution: resolution,
        };

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
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        keyManager.recordKeySuccess(currentKey);

        return NextResponse.json({
          operationName: data.name,
          message: 'Video generation started successfully',
        });
      } catch (error: any) {
        console.error(`Error with API key ${attempt + 1}:`, error.message);
        keyManager.recordKeyError(currentKey);
        lastError = error;
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
  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
