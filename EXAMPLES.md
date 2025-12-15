# Veo 3.1 - Ví dụ Sử dụng

Các ví dụ code thực tế để sử dụng Veo 3.1 API trong dự án Next.js.

## 1. Text-to-Video Cơ bản

### Sử dụng API Route
```typescript
// app/my-page/page.tsx
'use client';

async function generateBasicVideo() {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "A cinematic wide shot of a golden retriever puppy running through a meadow at sunset, warm colors, joyful atmosphere",
      resolution: '720p',
      aspectRatio: '16:9',
      duration: 8
    })
  });

  const data = await response.json();
  console.log('Operation started:', data.operationName);
  
  // Poll for completion
  pollStatus(data.operationName);
}
```

### Sử dụng VeoClient (Server-side)
```typescript
// lib/examples/basic-text-to-video.ts
import { VeoClient } from '@/lib/veo-client';

export async function exampleBasicVideo() {
  const client = new VeoClient({
    apiKey: process.env.GEMINI_API_KEYS!.split(',')[0],
    model: 'veo-3.1-generate-preview'
  });

  const result = await client.generateFromText(
    "A majestic eagle soaring through mountain peaks at dawn, epic cinematic shot"
  );

  // Poll until complete
  const video = await result.poll();
  
  if (video.success) {
    console.log('Video ready:', video.videoUrl);
    return video.videoUrl;
  } else {
    console.error('Error:', video.error);
  }
}
```

## 2. Image-to-Video

### Upload ảnh và tạo video
```typescript
// app/components/ImageToVideo.tsx
'use client';
import { useState } from 'react';

export default function ImageToVideo() {
  const [image, setImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image) return;

    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "The character turns around and waves at the camera with a warm smile",
        image: image,
        resolution: '720p',
        duration: 8
      })
    });

    const data = await response.json();
    return data.operationName;
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      <button onClick={generateVideo}>Generate Video</button>
      {image && <img src={image} alt="Preview" style={{ maxWidth: 200 }} />}
    </div>
  );
}
```

## 3. Reference Images (Asset Consistency)

### Sử dụng 3 reference images để giữ nguyên diện mạo
```typescript
// lib/examples/reference-images.ts
import { VeoClient } from '@/lib/veo-client';

export async function exampleReferenceImages() {
  const client = new VeoClient({
    apiKey: process.env.GEMINI_API_KEYS!.split(',')[0]
  });

  // Giả sử bạn đã có 3 ảnh base64
  const characterImage = "data:image/png;base64,iVBORw0KG..."; // Ảnh nhân vật
  const dressImage = "data:image/png;base64,iVBORw0KG...";     // Ảnh váy
  const accessoryImage = "data:image/png;base64,iVBORw0KG..."; // Ảnh phụ kiện

  const result = await client.generateWithReferences(
    `A cinematic medium shot of a beautiful woman with dark hair wearing 
    an elegant flamingo-pink dress and heart-shaped sunglasses, walking 
    confidently through a turquoise lagoon at sunset, the dress train 
    floating gracefully on water, dreamy atmosphere`,
    [
      { image: characterImage, type: 'asset' },  // Giữ nguyên người
      { image: dressImage, type: 'asset' },      // Giữ nguyên váy
      { image: accessoryImage, type: 'asset' }   // Giữ nguyên kính
    ],
    {
      resolution: '720p',
      aspectRatio: '16:9',
      duration: 8
    }
  );

  return await result.poll();
}
```

### Frontend với nhiều reference images
```typescript
// app/components/ReferenceImagesForm.tsx
'use client';
import { useState } from 'react';
import { ReferenceImage } from '@/lib/types';

export default function ReferenceImagesForm() {
  const [prompt, setPrompt] = useState('');
  const [references, setReferences] = useState<ReferenceImage[]>([]);

  const addReference = (imageBase64: string, type: 'asset' | 'style') => {
    if (references.length >= 3) {
      alert('Maximum 3 reference images allowed');
      return;
    }
    
    setReferences([...references, { image: imageBase64, type }]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'asset' | 'style') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      addReference(reader.result as string, type);
    };
    reader.readAsDataURL(file);
  };

  const generateVideo = async () => {
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        referenceImages: references,
        resolution: '720p',
        duration: 8
      })
    });

    const data = await response.json();
    return data.operationName;
  };

  return (
    <div className="space-y-4">
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your video..."
        className="w-full p-2 border rounded"
      />

      <div className="space-y-2">
        <h3>Reference Images ({references.length}/3)</h3>
        
        <div>
          <label>Asset Reference (maintains appearance):</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleFileChange(e, 'asset')}
            disabled={references.length >= 3}
          />
        </div>

        <div>
          <label>Style Reference (artistic style):</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleFileChange(e, 'style')}
            disabled={references.length >= 3}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {references.map((ref, idx) => (
          <div key={idx} className="relative">
            <img src={ref.image} alt={`Ref ${idx + 1}`} className="w-full" />
            <span className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-xs">
              {ref.type}
            </span>
            <button 
              onClick={() => setReferences(references.filter((_, i) => i !== idx))}
              className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={generateVideo}
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        Generate Video
      </button>
    </div>
  );
}
```

## 4. Video Extension (Kéo dài Video)

### Extend một video đã tạo
```typescript
// lib/examples/video-extension.ts
import { VeoClient } from '@/lib/veo-client';

export async function exampleVideoExtension() {
  const client = new VeoClient({
    apiKey: process.env.GEMINI_API_KEYS!.split(',')[0]
  });

  // Bước 1: Tạo video ban đầu
  console.log('Generating initial video...');
  const initialResult = await client.generateFromText(
    "A paper origami butterfly with delicate folds flies gracefully out of a French window into a sunny garden"
  );

  const initialVideo = await initialResult.poll();
  
  if (!initialVideo.success || !initialVideo.videoUrl) {
    throw new Error('Failed to generate initial video');
  }

  console.log('Initial video ready:', initialVideo.videoUrl);

  // Bước 2: Kéo dài video
  console.log('Extending video...');
  const extendedResult = await client.extendVideo(
    "The butterfly lands gently on an orange origami flower. A fluffy white puppy runs up playfully and gently pats the flower with its paw, the butterfly flutters its wings",
    initialVideo.videoUrl,
    {
      resolution: '720p' // Extensions only support 720p
    }
  );

  const extendedVideo = await extendedResult.poll();
  
  if (extendedVideo.success) {
    console.log('Extended video ready:', extendedVideo.videoUrl);
    return extendedVideo.videoUrl;
  }
}
```

### Frontend cho video extension
```typescript
// app/components/VideoExtender.tsx
'use client';
import { useState } from 'react';

export default function VideoExtender() {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [extensionPrompt, setExtensionPrompt] = useState('');

  const extendVideo = async () => {
    if (!currentVideoUrl) {
      alert('No video to extend');
      return;
    }

    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: extensionPrompt,
        video: currentVideoUrl, // URI của video trước
        resolution: '720p'
      })
    });

    const data = await response.json();
    // Poll for new extended video...
  };

  return (
    <div className="space-y-4">
      {currentVideoUrl && (
        <>
          <video src={currentVideoUrl} controls className="w-full" />
          
          <div>
            <textarea
              value={extensionPrompt}
              onChange={(e) => setExtensionPrompt(e.target.value)}
              placeholder="What happens next in your video?"
              className="w-full p-2 border rounded"
              rows={3}
            />
            
            <button 
              onClick={extendVideo}
              className="mt-2 w-full bg-green-500 text-white p-2 rounded"
            >
              Extend Video (+7 seconds)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## 5. Frame Interpolation (First + Last Frame)

### Tạo video từ 2 khung hình
```typescript
// lib/examples/frame-interpolation.ts
import { VeoClient } from '@/lib/veo-client';

export async function exampleFrameInterpolation() {
  const client = new VeoClient({
    apiKey: process.env.GEMINI_API_KEYS!.split(',')[0]
  });

  // Khung hình đầu: Người phụ nữ ma quái trên xích đu
  const firstFrame = "data:image/png;base64,iVBORw0KG...";
  
  // Khung hình cuối: Xích đu rỗng, người biến mất
  const lastFrame = "data:image/png;base64,iVBORw0KG...";

  const result = await client.generateWithFrames(
    `A cinematic, haunting video. A ghostly woman with long white hair and 
    a flowing dress swings gently on a rope swing beneath a massive tree in 
    a foggy moonlit clearing. The fog thickens and swirls around her, and 
    she slowly fades away, vanishing completely. The empty swing continues 
    swaying rhythmically in the eerie silence.`,
    firstFrame,
    lastFrame,
    {
      resolution: '720p',
      duration: 8
    }
  );

  return await result.poll();
}
```

### Frontend với first/last frame
```typescript
// app/components/FrameInterpolation.tsx
'use client';
import { useState } from 'react';

export default function FrameInterpolation() {
  const [firstFrame, setFirstFrame] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateInterpolation = async () => {
    if (!firstFrame || !lastFrame) {
      alert('Please upload both frames');
      return;
    }

    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image: firstFrame,
        lastFrame: lastFrame,
        resolution: '720p',
        duration: 8
      })
    });

    const data = await response.json();
    return data.operationName;
  };

  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the transition between frames..."
        className="w-full p-2 border rounded"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">First Frame:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, setFirstFrame)}
          />
          {firstFrame && <img src={firstFrame} alt="First" className="mt-2 w-full" />}
        </div>

        <div>
          <label className="block mb-2">Last Frame:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, setLastFrame)}
          />
          {lastFrame && <img src={lastFrame} alt="Last" className="mt-2 w-full" />}
        </div>
      </div>

      <button
        onClick={generateInterpolation}
        disabled={!firstFrame || !lastFrame}
        className="w-full bg-purple-500 text-white p-2 rounded disabled:opacity-50"
      >
        Generate Interpolated Video
      </button>
    </div>
  );
}
```

## 6. Negative Prompts

### Sử dụng negative prompts để loại bỏ elements
```typescript
// lib/examples/negative-prompts.ts
import { VeoClient } from '@/lib/veo-client';

export async function exampleNegativePrompts() {
  const client = new VeoClient({
    apiKey: process.env.GEMINI_API_KEYS!.split(',')[0]
  });

  const result = await client.generateVideo({
    prompt: `A serene nature scene: a majestic oak tree standing alone in 
    a vast grassy field, leaves rustling in a gentle breeze, peaceful 
    countryside atmosphere, golden hour lighting, cinematic wide shot`,
    
    negativePrompt: `urban elements, buildings, people, vehicles, animals, 
    dark atmosphere, stormy weather, artificial structures, fences, roads`,
    
    resolution: '720p',
    aspectRatio: '16:9',
    duration: 8
  });

  return await result.poll();
}
```

## 7. Aspect Ratios và Resolutions

### Vertical video (9:16) cho social media
```typescript
async function generateVerticalVideo() {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "A stunning aerial descent through misty layers revealing a hidden waterfall in a lush Hawaiian rainforest, cinematic vertical composition",
      resolution: '720p',
      aspectRatio: '9:16', // Portrait cho TikTok, Instagram Reels
      duration: 8
    })
  });
}
```

### High resolution (1080p) cho chất lượng cao
```typescript
async function generateHighResVideo() {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "A cinematic establishing shot of a futuristic city at night with neon lights and flying vehicles",
      resolution: '1080p', // Chỉ hỗ trợ với 16:9
      aspectRatio: '16:9',
      duration: 8 // 1080p chỉ cho 8 giây
    })
  });
}
```

## 8. Sử dụng Fast Model cho Rapid Prototyping

### Dùng veo-3.1-fast cho tốc độ nhanh hơn
```typescript
async function generateFastVideo() {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "A quick test animation of a spinning cube with colorful lights",
      model: 'veo-3.1-fast-generate-preview', // Fast model
      resolution: '720p',
      duration: 4 // Shorter duration for rapid testing
    })
  });
}
```

## 9. Prompts với Audio Details

### Mô tả cụ thể âm thanh trong prompt
```typescript
const audioRichPrompt = `
Medium shot of ocean waves crashing dramatically against rocky cliffs. 
The sound of powerful waves breaking, foam splashing, and seagulls crying 
in the distance. Water spray catches golden sunset light. The rhythmic 
roar of the ocean creates a powerful, immersive soundscape. Cinematic 
nature documentary style.
`;

await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: audioRichPrompt,
    resolution: '720p',
    duration: 8
  })
});
```

## 10. Error Handling và Retry Logic

### Xử lý lỗi và retry
```typescript
async function generateVideoWithRetry(prompt: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, resolution: '720p' })
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 429) {
          // Rate limit - wait and retry
          console.log(`Rate limited, waiting before retry ${attempt}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
          continue;
        }
        
        throw new Error(error.error);
      }

      const data = await response.json();
      return data.operationName;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
    }
  }
}
```

## Resources

- **Documentation**: `/VEO3_DOCUMENTATION.md`
- **Client Library**: `/lib/veo-client.ts`
- **Types**: `/lib/types.ts`
- **API Routes**: `/app/api/generate-video/route.ts`
