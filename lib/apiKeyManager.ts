// API Key Manager with rotation logic
export class ApiKeyManager {
  private geminiKeys: string[] = [];
  private currentGeminiIndex: number = 0;
  private keyUsageCount: Map<string, number> = new Map();
  private keyErrorCount: Map<string, number> = new Map();
  private readonly MAX_ERRORS_PER_KEY = 3;

  constructor(geminiKeys: string[]) {
    this.geminiKeys = geminiKeys.filter(key => key.trim() !== '');
  }

  getCurrentGeminiKey(): string | null {
    if (this.geminiKeys.length === 0) {
      return null;
    }

    // Try to find a working key
    const startIndex = this.currentGeminiIndex;
    do {
      const key = this.geminiKeys[this.currentGeminiIndex];
      const errors = this.keyErrorCount.get(key) || 0;
      
      if (errors < this.MAX_ERRORS_PER_KEY) {
        return key;
      }
      
      this.currentGeminiIndex = (this.currentGeminiIndex + 1) % this.geminiKeys.length;
    } while (this.currentGeminiIndex !== startIndex);

    // All keys have too many errors, reset and try again
    this.keyErrorCount.clear();
    return this.geminiKeys[this.currentGeminiIndex];
  }

  rotateToNextGeminiKey(): string | null {
    if (this.geminiKeys.length === 0) {
      return null;
    }
    
    this.currentGeminiIndex = (this.currentGeminiIndex + 1) % this.geminiKeys.length;
    return this.getCurrentGeminiKey();
  }

  recordKeySuccess(key: string) {
    const count = this.keyUsageCount.get(key) || 0;
    this.keyUsageCount.set(key, count + 1);
    // Reset error count on success
    this.keyErrorCount.set(key, 0);
  }

  recordKeyError(key: string) {
    const count = this.keyErrorCount.get(key) || 0;
    this.keyErrorCount.set(key, count + 1);
    
    // Auto rotate if this key has too many errors
    if (count + 1 >= this.MAX_ERRORS_PER_KEY) {
      this.rotateToNextGeminiKey();
    }
  }

  getKeyStats() {
    return {
      totalKeys: this.geminiKeys.length,
      currentIndex: this.currentGeminiIndex,
      usageCount: Object.fromEntries(this.keyUsageCount),
      errorCount: Object.fromEntries(this.keyErrorCount)
    };
  }
}
