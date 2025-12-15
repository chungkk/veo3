'use client';

import { useState } from 'react';
import { Story } from '@/lib/types';

export default function Home() {
  const [storyText, setStoryText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set());
  const [expandedFrames, setExpandedFrames] = useState<Set<string>>(new Set());

  const analyzeStory = async () => {
    if (!storyText.trim()) {
      alert('Vui lòng nhập văn bản câu chuyện');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setStory(null);

    try {
      const response = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: storyText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze story');
      }

      const data = await response.json();
      setStory(data.story);
      setExpandedScenes(new Set([1]));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleScene = (sceneNumber: number) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneNumber)) {
      newExpanded.delete(sceneNumber);
    } else {
      newExpanded.add(sceneNumber);
    }
    setExpandedScenes(newExpanded);
  };

  const toggleFrame = (key: string) => {
    const newExpanded = new Set(expandedFrames);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedFrames(newExpanded);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Story to Video AI</h1>
          <p className="text-gray-600 mt-2">Phân tích câu chuyện thành cảnh, khung hình và prompts</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Nhập Câu Chuyện</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Văn bản câu chuyện của bạn
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              rows={12}
              placeholder="Nhập câu chuyện dài của bạn ở đây... (ít nhất 100 từ)"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {storyText.trim().split(/\s+/).filter(w => w).length} từ
              </span>
              <button
                onClick={analyzeStory}
                disabled={analyzing}
                className="px-6 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? '🤖 Đang phân tích...' : '🎬 Phân Tích Câu Chuyện'}
              </button>
            </div>
          </div>

          {analyzing && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-center">
                ⏳ Đang xử lý với OpenAI GPT-4o-mini... Có thể mất vài phút.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ Lỗi: {error}</p>
          </div>
        )}

        {story && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Kết Quả Phân Tích</h2>
              <span className="text-sm text-gray-500">
                {story.scenes.length} cảnh • {story.scenes.reduce((acc, s) => acc + s.frames.length, 0)} khung hình
              </span>
            </div>

            <div className="space-y-4">
              {story.scenes.map((scene) => (
                <div key={scene.sceneNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleScene(scene.sceneNumber)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 transition text-left flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{expandedScenes.has(scene.sceneNumber) ? '🎬' : '📽️'}</span>
                      <div>
                        <h3 className="font-bold text-lg">Cảnh {scene.sceneNumber}</h3>
                        <p className="text-sm text-gray-700">{scene.sceneDescription}</p>
                      </div>
                    </div>
                    <span className="text-gray-500">
                      {expandedScenes.has(scene.sceneNumber) ? '▼' : '▶'} {scene.frames.length} frames
                    </span>
                  </button>

                  {expandedScenes.has(scene.sceneNumber) && (
                    <div className="p-4 space-y-3 bg-gray-50">
                      {scene.frames.map((frame) => {
                        const frameKey = `${scene.sceneNumber}-${frame.frameNumber}`;
                        const isExpanded = expandedFrames.has(frameKey);

                        return (
                          <div key={frameKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleFrame(frameKey)}
                              className="w-full px-4 py-3 hover:bg-gray-50 transition text-left flex justify-between items-center"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">🎞️</span>
                                <div>
                                  <h4 className="font-semibold">Frame {frame.frameNumber}</h4>
                                  <p className="text-sm text-gray-600">{frame.frameDescription}</p>
                                </div>
                              </div>
                              <span className="text-gray-500 text-sm">
                                {isExpanded ? '▼ Ẩn' : '▶ Xem prompt'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="px-4 py-3 bg-gradient-to-br from-green-50 to-teal-50 border-t border-gray-200">
                                <h5 className="font-semibold text-sm text-gray-700 mb-2">📝 Video Prompt:</h5>
                                <p className="text-sm leading-relaxed text-gray-800 mb-3 p-3 bg-white rounded border border-green-200">
                                  {frame.prompt}
                                </p>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(frame.prompt);
                                    alert('Đã copy prompt vào clipboard!');
                                  }}
                                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition"
                                >
                                  🎥 Copy Prompt để Generate Video
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
