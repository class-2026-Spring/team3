'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Haversine formula to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  stations?: any[];
};

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: '무엇을 도와드릴까요?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nearestContext, setNearestContext] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch('/jeju_stations.json');
          const data = await res.json();

          // Calculate distances
          const stationsWithDist = data.map((station: any) => ({
            ...station,
            distance: getDistanceFromLatLonInKm(latitude, longitude, parseFloat(station.lat), parseFloat(station.lng)).toFixed(2)
          }));

          // Filter within 1km
          const within1km = stationsWithDist.filter((s: any) => parseFloat(s.distance) <= 1.0);

          // Sort and get top 10
          within1km.sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
          const top10 = within1km.slice(0, 10);

          setNearestContext(top10);

          const userText = `현재 제 위치(위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}) 반경 1km 이내의 가장 가까운 충전소들을 알려줘.`;
          
          const currentHistory = [...messages];
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            text: userText
          }]);

          await fetchAIResponse(userText, currentHistory, top10, true);

        } catch (error) {
          console.error("데이터 로딩 실패:", error);
          alert("충전소 데이터를 불러오는 데 실패했습니다.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        alert("위치 정보를 가져오는 데 실패했습니다. 설정에서 위치 접근을 허용해주세요.");
        setIsLocating(false);
      }
    );
  };

  const fetchAIResponse = async (userMessage: string, history: Message[], context: any[], attachContext: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: history.map(h => ({ id: h.id, role: h.role === 'ai' ? 'model' : 'user', text: h.text })),
          context 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI response');
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.reply,
        stations: attachContext ? context : undefined
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `오류가 발생했습니다: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    
    const currentHistory = [...messages];
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);

    await fetchAIResponse(userMessage, currentHistory, nearestContext);
  };

  return (
    <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100/80 flex-1 min-h-[500px] flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 19H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V9h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2zm4 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2z" /></svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-[15px]">EV</h2>
            <p className="text-[11px] text-teal-500 font-medium">Gemini</p>
          </div>
        </div>

        <button
          onClick={handleGetLocation}
          disabled={isLocating || isLoading}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50"
        >
          {isLocating ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          )}
          {isLocating ? '위치 찾는 중...' : '현재 위치 기반'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfdfd]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm flex flex-col gap-3 ${msg.role === 'user'
              ? 'bg-teal-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
              }`}>
              {/* Parse markdown for AI messages, plain text for user */}
              <div className={`whitespace-pre-wrap ${msg.role === 'ai' ? 'markdown-body' : ''}`}>
                {msg.role === 'ai' ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-teal-800" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="" {...props} />,
                      a: ({node, ...props}) => <a className="text-teal-600 underline hover:text-teal-800" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 text-gray-800" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 text-gray-800" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2 text-gray-800" {...props} />,
                      code: ({node, inline, className, children, ...props}: any) => {
                        return inline 
                          ? <code className="bg-gray-100 text-teal-600 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                          : <code className="block bg-gray-100 text-gray-800 p-2 rounded text-xs overflow-x-auto my-2" {...props}>{children}</code>
                      },
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
              {msg.stations && msg.stations.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <h4 className="font-bold text-[12px] text-teal-600 mb-1">근처 충전소 추천 목록</h4>
                  {msg.stations.map((s: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[13px] text-gray-800">{idx + 1}. {s.name}</span>
                        <span className="text-[11px] font-bold text-teal-500 bg-teal-50 px-2 py-0.5 rounded-full">{s.distance}km</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2 truncate">{s.address}</p>
                      <Link href={`/?station=${encodeURIComponent(s.id)}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-teal-500 hover:bg-teal-600 px-3 py-1.5 rounded-lg transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        지도로 이동
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="궁금한 점을 입력해주세요..."
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all placeholder:text-gray-400 disabled:opacity-70"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
