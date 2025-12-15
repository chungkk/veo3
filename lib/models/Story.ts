import mongoose, { Schema, Document } from 'mongoose';

export interface IFrame {
  frameNumber: number;
  frameDescription: string;
  prompt: string;
}

export interface IScene {
  sceneNumber: number;
  sceneDescription: string;
  frames: IFrame[];
}

export interface IStory extends Document {
  originalText: string;
  scenes: IScene[];
  createdAt: Date;
  updatedAt: Date;
}

const FrameSchema = new Schema({
  frameNumber: { type: Number, required: true },
  frameDescription: { type: String, required: true },
  prompt: { type: String, required: true },
});

const SceneSchema = new Schema({
  sceneNumber: { type: Number, required: true },
  sceneDescription: { type: String, required: true },
  frames: [FrameSchema],
});

const StorySchema = new Schema(
  {
    originalText: { type: String, required: true },
    scenes: [SceneSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);
