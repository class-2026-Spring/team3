'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Charger } from '@/types/charger';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── 타입 정의 ─────────────────────────────────────────────

interface ChargerWithDist extends Charger {
  distance: string;
}

interface ApiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

type UiMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isError?: boolean;
  stations?: ChargerWithDist[];
  stationsOnly?: boolean;
  stationLabel?: string; // 충전소 목록 헤더 커스텀 텍스트
};

// 빠른 질문 칩 목록
const QUICK_QUESTIONS = [
  '급속 충전과 완속 충전의 차이가 뭔가요?',
  '제주도 전기차 충전 요금은?',
  'DC콤보 충전기가 뭔가요?',
  '충전 중 다른 곳에 가도 되나요?',
];

// 충전소 위치 검색 의도 키워드 (위치 정보 있을 때만 감지)
const STATION_SEARCH_KEYWORDS = [
  '충전소', '충전기', '근처', '가까운', '주변', '찾아줘', '어디', '추천',
  '알려줘', '어디야', '있어', '찾아', '위치',
];

function isStationSearchIntent(text: string): boolean {
  const lower = text.toLowerCase();
  const matched = STATION_SEARCH_KEYWORDS.filter((kw) => lower.includes(kw));
  return matched.length >= 2;
}

// 텍스트에서 장소명 추출 (정규식, 0토큰)
// 예: "제주시청 근처 충전소" → "제주시청"
function extractPlaceName(text: string): string | null {
  // 동작 동사/접미어 제거
  const cleaned = text
    .replace(/추천해줘|알려줘|찾아줘|추천해주세요|알려주세요|찾아주세요|해줘|해주세요/g, '')
    .trim();

  const patterns = [
    // "장소명 근처|주변|앞|에서" — 명확한 공간 분리자만 사용 (짧은 조사 제외)
    /^(.+?)\s+(?:근처|주변|앞|에서|부근)/,
    // "장소명 충전소|충전기" — 충전 관련 단어 바로 앞
    /^(.+?)\s+(?:충전소|충전기)/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    const candidate = match?.[1]?.trim();
    if (
      candidate &&
      candidate.length >= 2 &&
      !/^(충전소|충전기|근처|주변|가까운|추천|알려)$/.test(candidate)
    ) {
      return candidate;
    }
  }
  return null;
}

// ─── 컴포넌트 ──────────────────────────────────────────────

export default function AiPage() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: '1',
      role: 'ai',
      text: '위치 기반 버튼을 누르면 근처 충전소를 바로 찾아드립니다 !',
    },
  ]);

  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [nearestContext, setNearestContext] = useState<ChargerWithDist[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  // 빠른 질문 칩을 한 번 사용하면 숨김
  const [showQuickChips, setShowQuickChips] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── 위치 기반 충전소 조회 ─────────────────────────────────

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 반경 3km, 최대 10개 — 서버에서 필터링
          const res = await fetch(
            `/api/nearby?lat=${latitude}&lng=${longitude}&radius=3.0&limit=10`
          );
          if (!res.ok) throw new Error('nearby API failed');
          const data = await res.json();
          const top10: ChargerWithDist[] = data.stations ?? [];

          setNearestContext(top10);
          setShowQuickChips(false);

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'ai',
              text: '',
              stations: top10,
              stationsOnly: true,
            },
          ]);
        } catch {
          addErrorMessage('충전소 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert('위치 정보를 가져오는 데 실패했습니다. 설정에서 위치 접근을 허용해주세요.');
        setIsLocating(false);
      }
    );
  };

  // ─── 메시지 헬퍼 ───────────────────────────────────────────

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text },
    ]);
  };

  const addErrorMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: 'ai', text, isError: true },
    ]);
  };

  // ─── AI 응답 요청 ──────────────────────────────────────────

  const fetchAIResponse = async (userMessage: string, context: ChargerWithDist[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          history: apiHistory,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'AI 응답 오류');

      const aiReply: string = data.reply;

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', text: aiReply },
      ]);

      setApiHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: aiReply }] },
      ]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '응답을 처리하는 중 문제가 발생했습니다.';
      addErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 메시지 전송 ───────────────────────────────────────────

  const handleSend = async (overrideText?: string) => {
    const userMessage = (overrideText ?? input).trim();
    if (!userMessage || isLoading) return;
    setInput('');
    setShowQuickChips(false);
    addUserMessage(userMessage);

    if (isStationSearchIntent(userMessage)) {
      const placeName = extractPlaceName(userMessage);

      // ① 장소명이 추출됐으면 → jeju_stations.json 텍스트 검색 (외부 API 불필요)
      if (placeName) {
        setIsLoading(true);
        try {
          const searchRes = await fetch(
            `/api/search?q=${encodeURIComponent(placeName)}&limit=10`
          );
          const searchData = await searchRes.json();

          if (searchData.matched) {
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: '',
                stations: searchData.stations,
                stationsOnly: true,
                stationLabel: `📍 "${placeName}" 관련 충전소`,
              },
            ]);
            setIsLoading(false);
            return;
          }
        } catch {
          // 검색 실패 시 아래 fallback으로
        } finally {
          setIsLoading(false);
        }
      }

      // ② 장소명 추출 실패 OR 검색 결과 없음 + GPS context 있으면 → 기존 위치 카드 재표시
      if (nearestContext.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            text: '',
            stations: nearestContext,
            stationsOnly: true,
            stationLabel: '📍 현재 위치 기반 충전소',
          },
        ]);
        return;
      }
    }

    // ③ 최종 fallback: AI 응답
    await fetchAIResponse(userMessage, nearestContext);
  };

  // ─── 렌더링 ────────────────────────────────────────────────


  return (
    <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100/80 flex-1 min-h-[500px] flex flex-col overflow-hidden relative">

      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 19H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V9h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2zm4 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-[15px]">EV 충전 AI</h2>
            <p className="text-[11px] text-teal-500 font-medium">
              Gemini · {apiHistory.length / 2}번 대화
            </p>
          </div>
        </div>

        <button
          onClick={handleGetLocation}
          disabled={isLocating || isLoading}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50"
        >
          {isLocating ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          )}
          {isLocating ? '위치 찾는 중...' : '현재 내 위치'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fcfdfd]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {/* stationsOnly: 카드 목록만 */}
            {msg.stationsOnly ? (
              <div className="w-full flex flex-col gap-2">
                <h4 className="font-bold text-[12px] text-teal-600 mb-1 px-1">
                  {msg.stationLabel ?? '📍 근처 충전소 (반경 3km, 최대 10개)'}
                </h4>
                {msg.stations && msg.stations.length > 0 ? (
                  msg.stations.map((s, idx) => (
                    <div
                      key={s.id}
                      className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-[13px] text-gray-800">{idx + 1}. {s.name}</span>
                          <span className="text-[11px] font-bold text-teal-500 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">{s.distance}km</span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{s.address}</p>
                      </div>
                      <Link
                        href={`/?station=${encodeURIComponent(s.id)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-teal-500 hover:bg-teal-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        지도로 이동
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-gray-400 px-1">반경 3km 이내에 충전소가 없습니다.</p>
                )}
              </div>
            ) : (
              /* 일반 채팅 버블 */
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-500 text-white rounded-tr-sm'
                    : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 헤더 → 굵은 텍스트로 다운그레이드 (헤더 사이즈 과도함 방지)
                      h1: ({ children }) => <p className="font-bold text-[14px] text-gray-900 mt-2 mb-1">{children}</p>,
                      h2: ({ children }) => <p className="font-bold text-[14px] text-gray-900 mt-2 mb-1">{children}</p>,
                      h3: ({ children }) => <p className="font-semibold text-[13px] text-gray-800 mt-1.5 mb-0.5">{children}</p>,
                      // 문단: 마지막은 margin 없음
                      p: ({ children }) => <p className="text-[14px] leading-[1.65] mb-2 last:mb-0">{children}</p>,
                      // 굵게: teal 색으로 강조
                      strong: ({ children }) => <strong className="font-semibold text-teal-700">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-500">{children}</em>,
                      // 리스트: 컴팩트하게
                      ul: ({ children }) => <ul className="list-none pl-0 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => (
                        <li className="flex items-start gap-1.5 text-[13px] leading-[1.6]">
                          <span className="text-teal-400 mt-0.5 shrink-0">•</span>
                          <span>{children}</span>
                        </li>
                      ),
                      code: ({ children }) => (
                        <code className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[12px] font-mono border border-teal-100">
                          {children}
                        </code>
                      ),
                      hr: () => <hr className="border-gray-100 my-2" />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>

                )}
              </div>
            )}
          </div>
        ))}

        {/* 빠른 질문 칩 — 첫 메시지 이후, 아직 대화 없을 때 표시 */}
        {showQuickChips && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[12px] text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-full px-3 py-1.5 transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            placeholder="전기차 충전에 대해 무엇이든 물어보세요..."
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all placeholder:text-gray-400 disabled:opacity-70"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
