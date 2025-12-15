'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ApiKeys {
  geminiKeys: string[];
  openaiKey: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('16:9');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ geminiKeys: [], openaiKey: '' });
  const [showSettings, setShowSettings] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load API keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('veo3-api-keys');
    if (saved) {
      setApiKeys(JSON.parse(saved));
    } else {
      setShowSettings(true);
    }
  }, []);

  const saveApiKeys = (keys: ApiKeys) => {
    localStorage.setItem('veo3-api-keys', JSON.stringify(keys));
    setApiKeys(keys);
    setShowSettings(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSuggestions = async () => {
    if (!prompt.trim() || !apiKeys.openaiKey) {
      alert('Please enter a prompt and set OpenAI API key');
      return;
    }

    setLoadingSuggestions(true);
    setSuggestions([]);
    setError(null);

    try {
      const response = await fetch('/api/suggest-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: prompt,
          openaiApiKey: apiKeys.openaiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (apiKeys.geminiKeys.length === 0) {
      alert('Please add at least one Gemini API key in settings');
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress(0);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          image,
          resolution,
          aspectRatio,
          duration,
          geminiApiKeys: apiKeys.geminiKeys,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();
      setOperationName(data.operationName);
      pollStatus(data.operationName);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const pollStatus = async (opName: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationName: opName,
            geminiApiKey: apiKeys.geminiKeys[0],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.done) {
          clearInterval(interval);
          setIsGenerating(false);
          if (data.videoUrl) {
            setVideoUrl(data.videoUrl);
            setProgress(100);
          } else if (data.error) {
            setError(data.error);
          }
        } else {
          setProgress(data.progress || 0);
        }
      } catch (err: any) {
        clearInterval(interval);
        setError(err.message);
        setIsGenerating(false);
      }
    }, 10000); // Poll every 10 seconds
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch('/api/download-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          geminiApiKey: apiKeys.geminiKeys[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'veo3-generated-video.mp4';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Veo 3.1 Video Generator</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
          >
            ⚙️ Settings
          </button>
        </div>

        {showSettings && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">API Keys Settings</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemini API Keys (one per line)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter Gemini API keys, one per line"
                value={apiKeys.geminiKeys.join('\n')}
                onChange={(e) =>
                  setApiKeys({
                    ...apiKeys,
                    geminiKeys: e.target.value.split('\n').filter((k) => k.trim()),
                  })
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key (for prompt suggestions)
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk-..."
                value={apiKeys.openaiKey}
                onChange={(e) => setApiKeys({ ...apiKeys, openaiKey: e.target.value })}
              />
            </div>

            <button
              onClick={() => saveApiKeys(apiKeys)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save Settings
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Create Your Video</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Prompt
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe the video you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={getSuggestions}
              disabled={loadingSuggestions || !apiKeys.openaiKey}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loadingSuggestions ? '🤖 Getting suggestions...' : '✨ Get AI Suggestions'}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold mb-2">Suggested Prompts:</h3>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="mb-2 p-3 bg-white rounded border border-purple-200 cursor-pointer hover:bg-purple-100 transition"
                  onClick={() => setPrompt(suggestion)}
                >
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {image && (
              <div className="mt-2 relative w-32 h-32">
                <Image
                  src={image}
                  alt="Preview"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as 4 | 6 | 8)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="4">4 seconds</option>
                <option value="6">6 seconds</option>
                <option value="8">8 seconds</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateVideo}
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '🎬 Generating Video...' : '🎥 Generate Video'}
          </button>
        </div>

        {isGenerating && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Generating...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center mt-2 text-gray-600">
              {progress > 0 ? `${progress}%` : 'Starting...'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ Error: {error}</p>
          </div>
        )}

        {videoUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">✅ Video Generated Successfully!</h3>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg mb-4"
            />
            <button
              onClick={downloadVideo}
              className="w-full px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition"
            >
              ⬇️ Download Video
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
