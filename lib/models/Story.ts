import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptIdea {
  ideaNumber: number;
  ideaDescription: string;
  prompt: string;
}

export interface ISentence {
  sentenceNumber: number;
  sentenceText: string;
  ideas: IPromptIdea[];
}

export interface IStory extends Document {
  originalText: string;
  sentences: ISentence[];
  createdAt: Date;
  updatedAt: Date;
}

const PromptIdeaSchema = new Schema({
  ideaNumber: { type: Number, required: true },
  ideaDescription: { type: String, required: true },
  prompt: { type: String, required: true },
});

const SentenceSchema = new Schema({
  sentenceNumber: { type: Number, required: true },
  sentenceText: { type: String, required: true },
  ideas: [PromptIdeaSchema],
});

const StorySchema = new Schema(
  {
    originalText: { type: String, required: true },
    sentences: [SentenceSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);
