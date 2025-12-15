export interface PromptSuggestion {
  suggestions: string[];
}

export interface Frame {
  frameNumber: number;
  frameDescription: string;
  prompt: string;
}

export interface Scene {
  sceneNumber: number;
  sceneDescription: string;
  frames: Frame[];
}

export interface Story {
  _id: string;
  originalText: string;
  scenes: Scene[];
  createdAt: string;
  updatedAt: string;
}
