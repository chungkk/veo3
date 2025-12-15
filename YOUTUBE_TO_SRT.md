# YouTube to SRT - Hướng dẫn sử dụng

## Tính năng

Tải video từ YouTube và tự động tạo subtitle (SRT) bằng OpenAI Whisper AI.

## Flow hoạt động

1. User nhập YouTube URL
2. Backend tải audio từ YouTube video (dùng ytdl-core)
3. Gửi audio lên OpenAI Whisper API
4. Nhận transcript + SRT với timestamps
5. Lưu vào MongoDB (cache để tránh xử lý lại)
6. Hiển thị kết quả + cho phép download SRT

## Setup

### 1. Dependencies
```bash
npm install @distube/ytdl-core fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

### 2. Environment Variables
File `.env.local`:
```env
OPENAI_API_KEY=sk-proj-...
MONGODB_URI=mongodb://localhost:27017/veo3
```

### 3. MongoDB
Đảm bảo MongoDB đang chạy:
```bash
mongod
```

## Sử dụng

### Bước 1: Mở tab YouTube to SRT
- Click tab "📹 YouTube to SRT" trên navigation

### Bước 2: Nhập YouTube URL
- Paste URL YouTube video (ví dụ: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
- Chọn ngôn ngữ:
  - Tiếng Việt (vi)
  - English (en)
  - 日本語 (ja)
  - 한국어 (ko)
  - 中文 (zh)

### Bước 3: Xử lý
- Click "📹 Tạo Subtitle"
- Đợi 1-3 phút (tùy độ dài video)
- Quá trình:
  1. Download audio từ YouTube
  2. Upload lên Whisper AI
  3. Generate transcript & SRT
  4. Lưu vào database

### Bước 4: Xem kết quả
- **Video Title**: Tên video
- **Duration**: Thời lượng video
- **Transcript**: Text đầy đủ không có timestamps
- **SRT Format**: Subtitle với timestamps đầy đủ

### Bước 5: Download SRT
- Click button "⬇️ Download SRT"
- File .srt sẽ được tải về máy
- Sử dụng với video player (VLC, etc.)

## API Endpoints

### POST /api/youtube-to-srt
Xử lý YouTube video và tạo SRT

**Request:**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "language": "vi"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": {
    "_id": "...",
    "youtubeUrl": "...",
    "videoTitle": "...",
    "transcript": "Full text...",
    "srt": "1\n00:00:00,000 --> 00:00:05,000\nText...\n\n2\n...",
    "duration": 180,
    "language": "vi",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "cached": false
}
```

**Lưu ý:**
- Nếu `cached: true`, kết quả lấy từ database (đã xử lý trước đó)
- Nếu `cached: false`, vừa mới xử lý

### GET /api/transcripts
Lấy danh sách video đã xử lý (50 gần nhất)

**Response:**
```json
{
  "transcripts": [
    {
      "_id": "...",
      "youtubeUrl": "...",
      "videoTitle": "...",
      "duration": 180,
      "language": "vi",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

## SRT Format

Ví dụ SRT output:
```
1
00:00:00,000 --> 00:00:05,123
Xin chào các bạn

2
00:00:05,123 --> 00:00:10,456
Hôm nay tôi sẽ hướng dẫn các bạn

3
00:00:10,456 --> 00:00:15,789
Cách sử dụng AI để tạo subtitle
```

## Giới hạn

### YouTube
- Chỉ support public videos
- Không support age-restricted videos
- Không support live streams
- Video phải có audio

### OpenAI Whisper
- Max file size: 25 MB
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
- Cost: ~$0.006 per minute of audio

### Performance
- Video ngắn (< 5 phút): ~1-2 phút
- Video trung bình (5-15 phút): ~2-4 phút
- Video dài (> 15 phút): ~4-10 phút

## Troubleshooting

### Lỗi "Invalid YouTube URL"
- Kiểm tra URL có đúng format không
- Thử paste lại URL
- Đảm bảo video là public

### Lỗi "Failed to download"
- Video có thể bị private hoặc deleted
- Region-locked video
- Age-restricted content

### Lỗi "Whisper API failed"
- Kiểm tra OPENAI_API_KEY
- Kiểm tra balance OpenAI account
- Audio file quá lớn (> 25 MB)

### Xử lý chậm
- Video dài sẽ mất nhiều thời gian
- Whisper API có thể bị rate limit
- Network connection chậm

## Tech Stack

- **YouTube Downloader**: @distube/ytdl-core
- **Audio Processing**: fluent-ffmpeg, @ffmpeg-installer/ffmpeg
- **Speech-to-Text**: OpenAI Whisper API (whisper-1 model)
- **Database**: MongoDB + Mongoose
- **Backend**: Next.js API Routes

## Cost Estimation

OpenAI Whisper API pricing: **$0.006 per minute**

Examples:
- 5-minute video: $0.03
- 10-minute video: $0.06
- 30-minute video: $0.18
- 60-minute video: $0.36

Rất rẻ so với các dịch vụ transcription khác!

## Future Enhancements

- [ ] Support multiple video sources (Vimeo, Dailymotion, etc.)
- [ ] Batch processing (nhiều videos cùng lúc)
- [ ] Speaker diarization (phân biệt người nói)
- [ ] Auto-translation (dịch sang ngôn ngữ khác)
- [ ] Custom vocabulary/glossary
- [ ] Format options (VTT, ASS, etc.)
- [ ] Video thumbnail preview
- [ ] Progress bar during processing
