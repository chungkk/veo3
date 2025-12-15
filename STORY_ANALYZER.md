# Story to Video AI - Hướng dẫn sử dụng

## Tính năng mới

Hệ thống phân tích câu chuyện dài thành các cảnh, khung hình và prompts chi tiết để tạo video.

## Cấu trúc dữ liệu

```
Story
├── originalText (văn bản gốc)
├── scenes[] (các cảnh)
│   ├── sceneNumber
│   ├── sceneDescription
│   └── frames[] (các khung hình)
│       ├── frameNumber
│       ├── frameDescription
│       └── prompt (prompt chi tiết để generate video)
```

## Flow hoạt động

1. **User nhập text dài** → Submit
2. **OpenAI GPT-4o-mini phân tích:**
   - Call #1: Phân tích text → scenes
   - Call #2: Mỗi scene → frames
   - Call #3: Mỗi frame → prompt chi tiết
3. **Lưu vào MongoDB** với structure trên
4. **UI hiển thị** dạng hierarchical (có thể expand/collapse)
5. **Copy prompt** để đem đi generate video

## Setup

### 1. MongoDB
Đảm bảo MongoDB đang chạy:
```bash
# Nếu dùng MongoDB local
mongod

# Hoặc dùng MongoDB Atlas và update MONGODB_URI trong .env.local
```

### 2. Environment Variables
File `.env.local` cần có:
```env
OPENAI_API_KEY=sk-proj-...
MONGODB_URI=mongodb://localhost:27017/veo3
```

### 3. Chạy ứng dụng
```bash
npm run dev
```

## Sử dụng

### Bước 1: Nhập câu chuyện
- Vào trang chủ
- Nhập văn bản câu chuyện dài (ít nhất 100 từ)
- Click "🎬 Phân Tích Câu Chuyện"

### Bước 2: Đợi phân tích
- OpenAI sẽ xử lý trong vài phút
- Tùy thuộc độ dài của câu chuyện

### Bước 3: Xem kết quả
- Kết quả hiển thị theo cấu trúc:
  - **Cảnh** (Scene): Click để expand/collapse
  - **Khung hình** (Frame): Click để xem prompt
  - **Prompt**: Text chi tiết để generate video

### Bước 4: Sử dụng prompt
- Click button "🎥 Copy Prompt để Generate Video"
- Paste prompt vào tool tạo video (VEO, Runway, etc.)

## API Endpoints

### POST /api/analyze-story
Phân tích câu chuyện thành scenes → frames → prompts
```json
{
  "text": "Câu chuyện dài của bạn..."
}
```

Response:
```json
{
  "success": true,
  "story": {
    "_id": "...",
    "originalText": "...",
    "scenes": [
      {
        "sceneNumber": 1,
        "sceneDescription": "...",
        "frames": [
          {
            "frameNumber": 1,
            "frameDescription": "...",
            "prompt": "Chi tiết prompt..."
          }
        ]
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET /api/stories
Lấy danh sách stories đã phân tích (50 gần nhất)

### GET /api/stories/[id]
Lấy chi tiết một story theo ID

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB + Mongoose
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Vercel (recommended)

## Lưu ý

- Mỗi story có thể tốn ~20-30 OpenAI API calls
- GPT-4o-mini rất rẻ (~$0.15 per 1M input tokens)
- MongoDB lưu trữ tất cả kết quả để tái sử dụng
- Prompts được tối ưu cho video generation AI

## Ví dụ output

**Input:**
```
Một ngày nọ, cô bé Alice đang ngồi bên bờ sông cùng chị gái. Cô thấy chán nản vì không có gì để làm. Bỗng nhiên, một con thỏ trắng mặc áo vest chạy qua, nhìn đồng hồ và nói "Trễ rồi, trễ rồi!". Alice tò mò chạy theo...
```

**Output:**
- Scene 1: Alice bên bờ sông
  - Frame 1: Wide shot bờ sông, Alice và chị ngồi
    - Prompt: "Wide establishing shot of a peaceful riverbank on a sunny afternoon. Two figures sitting on green grass beside flowing water. Soft natural lighting, pastoral atmosphere, cinematic composition..."
  - Frame 2: Close-up Alice chán nản
    - Prompt: "Close-up shot of young girl Alice looking bored, sitting cross-legged. Natural daylight, shallow depth of field, contemplative mood..."
  
- Scene 2: Con thỏ xuất hiện
  - Frame 1: Con thỏ trắng chạy qua
    - Prompt: "Medium tracking shot of white rabbit in vest running quickly past camera. Motion blur, dynamic movement, whimsical lighting..."
