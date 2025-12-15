export interface VideoGenerationRequest {
  prompt: string;
  image?: string; // base64 image
  resolution?: '720p' | '1080p';
  aspectRatio?: '9:16' | '16:9';
  duration?: 4 | 6 | 8;
}

export interface VideoGenerationResponse {
  operationName: string;
  message: string;
}

export interface OperationStatus {
  done: boolean;
  operationName: string;
  progress?: number;
  videoUrl?: string;
  error?: string;
}

export interface PromptSuggestion {
  suggestions: string[];
}
