# Veo 3.1 - Quick Start Guide

## Cài đặt nhanh (5 phút)

### 1. Cấu hình API Key

Chỉnh sửa file `.env.local`:

```bash
# Gemini API Keys (có thể dùng nhiều keys, phân tách bằng dấu phẩy)
GEMINI_API_KEYS=your_gemini_api_key_here

# OpenAI API Key (cho tính năng gợi ý prompt)
OPENAI_API_KEY=your_openai_key_here
```

**Lấy API Key:**
- Gemini API: https://aistudio.google.com/apikey
- OpenAI API: https://platform.openai.com/api-keys

### 2. Chạy project

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Tính năng chính

### ✅ Đã có sẵn trong project:
1. **Text-to-Video** - Tạo video từ văn bản
2. **Image-to-Video** - Tạo video từ ảnh
3. **Prompt Suggestions** - Gợi ý prompt bằng AI
4. **Video Download** - Tải video về máy

### ✨ Tính năng mới đã thêm:
1. **Reference Images** - Sử dụng tối đa 3 ảnh tham khảo
2. **Video Extension** - Kéo dài video thêm 7 giây
3. **Frame Interpolation** - Tạo video từ khung đầu + khung cuối
4. **Negative Prompts** - Loại bỏ elements không mong muốn
5. **Multiple Models** - Hỗ trợ tất cả models Veo 3.1 và 3.0

## Sử dụng cơ bản

### 1. Tạo video đơn giản
```typescript
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "A golden retriever puppy playing in a sunny park",
    resolution: '720p',
    aspectRatio: '16:9',
    duration: 8
  })
});

const { operationName } = await response.json();
```

### 2. Với reference images
```typescript
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "The character walks through a magical forest",
    referenceImages: [
      {
        image: "data:image/png;base64,...", // Base64 image
        type: "asset"  // hoặc "style"
      }
    ],
    resolution: '720p'
  })
});
```

### 3. Extend video
```typescript
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "The scene continues with birds flying",
    video: "previous_video_uri",  // URI từ video trước
    resolution: '720p'
  })
});
```

### 4. Frame interpolation
```typescript
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Smooth transition from day to night",
    image: "first_frame_base64",      // Khung đầu
    lastFrame: "last_frame_base64",   // Khung cuối
    resolution: '720p'
  })
});
```

## Viết Prompts tốt

### Cấu trúc tốt:
```
[Camera] + [Subject] + [Action] + [Setting] + [Mood/Style] + [Audio]
```

### Ví dụ prompts:

**Cinematic:**
```
A cinematic wide-angle shot of a lone astronaut floating in space, 
Earth visible in the background, the sound of breathing and distant 
radio chatter, contemplative mood, stunning cosmic lighting, 
professional color grading with deep blues and blacks
```

**Animation:**
```
A whimsical, Studio Ghibli-style animation of a friendly forest spirit 
dancing among glowing fireflies in an enchanted grove at twilight, 
magical chimes and soft woodland sounds, dreamy and ethereal atmosphere
```

**Realistic:**
```
Extreme close-up of water droplets falling in slow motion onto a 
vibrant green leaf, each drop creating ripples, soft rain ambience, 
natural morning light, hyper-realistic macro photography style
```

## Models

| Model | Tốc độ | Use Case |
|-------|--------|----------|
| veo-3.1-generate-preview | Trung bình | Production quality |
| veo-3.1-fast-generate-preview | Nhanh | Rapid prototyping |
| veo-3.0-generate-001 | Trung bình | Stable version |
| veo-3.0-fast-generate-001 | Nhanh | Fast stable |

Chọn model khi tạo video:
```typescript
{
  prompt: "...",
  model: "veo-3.1-fast-generate-preview",  // Nhanh hơn
  resolution: '720p'
}
```

## Giới hạn quan trọng

### Thời gian
- **Tạo video**: 11 giây - 6 phút
- **Lưu trữ**: 2 ngày (phải download trong 2 ngày)

### Kỹ thuật
- **Reference images**: Tối đa 3 ảnh
- **Video extension**: Chỉ video do Veo tạo, tối đa 141 giây
- **1080p**: Chỉ với 16:9, 8 giây
- **Extension**: Chỉ 720p

### Pricing (tham khảo)
- Veo 3.1: ~$0.20-0.30 / video
- Veo 3.1 Fast: ~$0.15-0.20 / video

## Troubleshooting

### Video generation fails
- Kiểm tra API key trong `.env.local`
- Prompt có thể vi phạm safety filters
- Thử với prompt đơn giản hơn

### Timeout errors
- Video đang generate (có thể mất 6 phút)
- Thử lại với fast model
- Check operation status manually

### Reference images not working
- Max 3 images
- Image phải < 20MB
- Format: PNG, JPEG, WebP

### Video extension fails
- Chỉ dùng được với video do Veo tạo
- Video < 141 giây
- Chỉ hỗ trợ 720p

## Resources

📖 **Tài liệu:**
- [VEO3_DOCUMENTATION.md](./VEO3_DOCUMENTATION.md) - Tài liệu chi tiết
- [EXAMPLES.md](./EXAMPLES.md) - Code examples đầy đủ

🔧 **Code:**
- `lib/veo-client.ts` - Client library
- `lib/types.ts` - TypeScript types
- `app/api/generate-video/route.ts` - API route

🌐 **Links:**
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs/video)
- [Get API Key](https://aistudio.google.com/apikey)
- [Cookbook](https://github.com/google-gemini/cookbook)

## Next Steps

1. **Đọc tài liệu đầy đủ**: [VEO3_DOCUMENTATION.md](./VEO3_DOCUMENTATION.md)
2. **Xem examples**: [EXAMPLES.md](./EXAMPLES.md)
3. **Test với project**: http://localhost:3000
4. **Tạo video đầu tiên!** 🎬

## Support

- Issues: GitHub Issues
- Docs: https://ai.google.dev/gemini-api/docs/video
- Community: https://discuss.ai.google.dev/
