import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoTranscript extends Document {
  youtubeUrl: string;
  videoTitle: string;
  transcript: string;
  srt: string;
  duration: number;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoTranscriptSchema = new Schema(
  {
    youtubeUrl: { type: String, required: true, unique: true },
    videoTitle: { type: String, required: true },
    transcript: { type: String, required: true },
    srt: { type: String, required: true },
    duration: { type: Number },
    language: { type: String, default: 'vi' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.VideoTranscript || 
  mongoose.model<IVideoTranscript>('VideoTranscript', VideoTranscriptSchema);
