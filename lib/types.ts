export interface PromptSuggestion {
  suggestions: string[];
}

export interface PromptIdea {
  ideaNumber: number;
  ideaDescription: string;
  prompt: string;
}

export interface Sentence {
  sentenceNumber: number;
  sentenceText: string;
  ideas: PromptIdea[];
}

export interface Story {
  _id: string;
  originalText: string;
  sentences: Sentence[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoTranscript {
  _id: string;
  youtubeUrl: string;
  videoTitle: string;
  transcript: string;
  srt: string;
  duration: number;
  language: string;
  createdAt: string;
  updatedAt: string;
}
