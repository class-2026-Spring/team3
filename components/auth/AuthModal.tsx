'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleEmailAuth = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: '이메일을 확인해주세요! 인증 링크를 보내드렸습니다.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? '오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-teal-400 to-teal-500 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-white font-extrabold text-lg">JEJU EV MAP</h2>
            <p className="text-white/80 text-xs mt-0.5">로그인하여 즐겨찾기를 사용하세요</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* 소셜 로그인 */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              onClick={handleGoogle}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-semibold text-sm text-gray-700 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.5 5.9l6.2 5.2C36.9 36.9 44 31 44 24c0-1.2-.1-2.4-.4-3.5z"/>
              </svg>
              Google로 계속하기
            </button>

            <button
              onClick={handleKakao}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-yellow-300 bg-[#FEE500] hover:bg-yellow-300 transition-colors font-semibold text-sm text-gray-800 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.1 4 6.6l-.9 3.4 3.9-2.6c.9.2 1.9.3 2.9.3 5.523 0 10-3.477 10-7.7C22 6.477 17.523 3 12 3z"/>
              </svg>
              카카오로 계속하기
            </button>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100"/>
            <span className="text-[11px] font-semibold text-gray-400">또는 이메일로</span>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          {/* 이메일/비밀번호 */}
          <div className="flex flex-col gap-2.5 mb-4">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
            />
          </div>

          {message && (
            <p className={`text-xs mb-3 font-medium ${message.type === 'error' ? 'text-red-500' : 'text-teal-600'}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleEmailAuth}
            disabled={loading || !email || !password}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-sm"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }}
              className="ml-1.5 text-teal-500 font-bold hover:underline"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}