'use client';

import { useState } from 'react';
import { Story, VideoTranscript } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'story' | 'youtube'>('story');
  
  // Story Analyzer State
  const [storyText, setStoryText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [expandedSentences, setExpandedSentences] = useState<Set<number>>(new Set());
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [copiedIdeas, setCopiedIdeas] = useState<Set<string>>(new Set());

  // YouTube to SRT State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [ytError, setYtError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState<VideoTranscript | null>(null);
  const [language, setLanguage] = useState('vi');

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
      setExpandedSentences(new Set([1]));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSentence = (sentenceNumber: number) => {
    const newExpanded = new Set(expandedSentences);
    if (newExpanded.has(sentenceNumber)) {
      newExpanded.delete(sentenceNumber);
    } else {
      newExpanded.add(sentenceNumber);
    }
    setExpandedSentences(newExpanded);
  };

  const toggleIdea = (key: string) => {
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedIdeas(newExpanded);
  };

  const copyPrompt = (ideaKey: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIdeas((prev) => {
      const newCopied = new Set(prev);
      newCopied.add(ideaKey);
      return newCopied;
    });
    
    setTimeout(() => {
      setCopiedIdeas((prev) => {
        const resetCopied = new Set(prev);
        resetCopied.delete(ideaKey);
        return resetCopied;
      });
    }, 2000);
  };

  const processYouTube = async () => {
    if (!youtubeUrl.trim()) {
      alert('Vui lòng nhập YouTube URL');
      return;
    }

    setProcessing(true);
    setYtError(null);
    setTranscript(null);

    try {
      const response = await fetch('/api/youtube-to-srt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process YouTube video');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      if (data.cached) {
        alert('✅ Kết quả từ cache (đã xử lý trước đó)');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('YouTube processing error:', err);
      setYtError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadSRT = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript.srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.videoTitle.replace(/[^a-z0-9]/gi, '_')}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">AI Video Tools</h1>
          <p className="text-gray-600 mt-2">Story Analyzer & YouTube to SRT</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('story')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'story'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎬 Story Analyzer
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📹 YouTube to SRT
          </button>
        </div>

        {/* Story Analyzer Tab */}
        {activeTab === 'story' && (
          <>
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
                {story.sentences.length} câu • {story.sentences.reduce((acc, s) => acc + s.ideas.length, 0)} ý tưởng
              </span>
            </div>

            <div className="space-y-4">
              {story.sentences.map((sentence) => (
                <div key={sentence.sentenceNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSentence(sentence.sentenceNumber)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 transition text-left flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{expandedSentences.has(sentence.sentenceNumber) ? '📝' : '📄'}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Câu {sentence.sentenceNumber}</h3>
                        <p className="text-sm text-gray-700 line-clamp-2">{sentence.sentenceText}</p>
                      </div>
                    </div>
                    <span className="text-gray-500 flex-shrink-0 ml-2">
                      {expandedSentences.has(sentence.sentenceNumber) ? '▼' : '▶'} {sentence.ideas.length} ý
                    </span>
                  </button>

                  {expandedSentences.has(sentence.sentenceNumber) && (
                    <div className="p-4 space-y-3 bg-gray-50">
                      {sentence.ideas.map((idea) => {
                        const ideaKey = `${sentence.sentenceNumber}-${idea.ideaNumber}`;
                        const isExpanded = expandedIdeas.has(ideaKey);

                        return (
                          <div key={ideaKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleIdea(ideaKey)}
                              className="w-full px-4 py-3 hover:bg-gray-50 transition text-left flex justify-between items-center"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">💡</span>
                                <div>
                                  <h4 className="font-semibold">Ý {idea.ideaNumber}</h4>
                                  <p className="text-sm text-gray-600">{idea.ideaDescription}</p>
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
                                  {idea.prompt}
                                </p>
                                <button
                                  onClick={() => copyPrompt(ideaKey, idea.prompt)}
                                  className={`w-full px-4 py-2 font-semibold rounded-lg transition-all ${
                                    copiedIdeas.has(ideaKey)
                                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white scale-105'
                                      : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700'
                                  }`}
                                >
                                  {copiedIdeas.has(ideaKey) ? '✅ Đã Copy!' : '🎥 Copy Prompt để Generate Video'}
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
          </>
        )}

        {/* YouTube to SRT Tab */}
        {activeTab === 'youtube' && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">YouTube to SRT</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Ngôn ngữ:</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="ko">한국어</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                  <button
                    onClick={processYouTube}
                    disabled={processing}
                    className="px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? '⏳ Đang xử lý...' : '📹 Tạo Subtitle'}
                  </button>
                </div>
              </div>

              {processing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-center">
                    ⏳ Đang tải video và xử lý với Whisper AI... Có thể mất vài phút.
                  </p>
                </div>
              )}
            </div>

            {ytError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">❌ Lỗi: {ytError}</p>
              </div>
            )}

            {transcript && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold">{transcript.videoTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Duration: {Math.floor(transcript.duration / 60)}:{String(transcript.duration % 60).padStart(2, '0')} • 
                        Language: {transcript.language}
                      </p>
                    </div>
                    <button
                      onClick={downloadSRT}
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                    >
                      ⬇️ Download SRT
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold mb-2">Transcript:</h4>
                    <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript.transcript}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-semibold mb-2">SRT Format:</h4>
                    <div className="p-4 bg-gray-900 text-green-400 rounded-lg max-h-60 overflow-y-auto font-mono text-xs">
                      <pre>{transcript.srt}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
