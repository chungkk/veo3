# Veo 3.1 Video Generator

Ứng dụng web đơn giản để tạo video bằng Google Veo 3.1 API với tính năng gợi ý prompt từ OpenAI.

## Tính năng

- ✅ Tạo video từ text prompt
- ✅ Tạo video từ hình ảnh
- ✅ Hỗ trợ nhiều Gemini API keys với auto-rotation khi quota hết
- ✅ Gợi ý prompt thông minh bằng OpenAI
- ✅ Tùy chỉnh resolution (720p/1080p), aspect ratio (16:9/9:16), duration (4/6/8s)
- ✅ Theo dõi tiến trình generate real-time
- ✅ Preview và download video

## Cài đặt

```bash
# Clone hoặc tải project
cd veo3

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Truy cập http://localhost:3000

## Cách sử dụng

### 1. Cấu hình API Keys

Khi mở ứng dụng lần đầu, click vào nút **⚙️ Settings** để cấu hình:

- **Gemini API Keys**: Nhập nhiều API keys (mỗi key một dòng). Hệ thống sẽ tự động rotate khi một key hết quota.
- **OpenAI API Key**: Key để sử dụng tính năng gợi ý prompt.

API keys được lưu trong localStorage của trình duyệt.

### 2. Tạo Video

1. **Nhập prompt**: Mô tả video bạn muốn tạo
2. **Get AI Suggestions** (optional): Click để OpenAI gợi ý 3 prompts chi tiết hơn
3. **Upload ảnh** (optional): Thêm reference image để generate video từ ảnh
4. **Chọn options**:
   - Resolution: 720p hoặc 1080p
   - Aspect Ratio: 16:9 (ngang) hoặc 9:16 (dọc)
   - Duration: 4, 6, hoặc 8 giây
5. **Click Generate Video**: Đợi khoảng 1-6 phút để video được tạo
6. **Download**: Khi hoàn thành, xem preview và download video

## API Rotation Logic

Khi một Gemini API key gặp lỗi (quota exceeded, rate limit), hệ thống sẽ:
- Tự động chuyển sang key tiếp theo
- Tracking số lỗi của mỗi key
- Sau 3 lỗi liên tiếp, key sẽ bị bỏ qua tạm thời
- Reset error count khi request thành công

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini API** - Veo 3.1 video generation
- **OpenAI API** - Prompt suggestions

## Lưu ý

- Video generation mất 1-6 phút tùy vào độ phức tạp
- Video được lưu trên server Google trong 2 ngày
- Độ phân giải 1080p chỉ hỗ trợ video 8 giây
- Mỗi request tốn quota của Gemini API

## Troubleshooting

**Lỗi "All API keys failed"**: 
- Kiểm tra API keys có đúng không
- Kiểm tra quota còn lại của các keys
- Thêm thêm API keys vào settings

**Video không hiển thị**:
- Đợi thêm vài phút, quá trình generate có thể chậm
- Check console log để xem lỗi chi tiết

**OpenAI suggestions không hoạt động**:
- Kiểm tra OpenAI API key
- Kiểm tra quota OpenAI API

## License

MIT
