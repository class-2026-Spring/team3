'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { session, profile, loading, signInWithGoogle, signInWithKakao, createProfile } = useAuth();
  
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in and has profile, close modal automatically
  useEffect(() => {
    if (session && profile) {
      onClose();
    }
  }, [session, profile, onClose]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('닉네임을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    const success = await createProfile(nickname, selectedAvatar);
    if (!success) {
      setErrorMsg('프로필 생성에 실패했습니다. 닉네임이 중복될 수 있습니다.');
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm p-4 transition-colors ${session && !profile ? 'bg-zinc-900/95' : 'bg-black/40'}`} onClick={onClose}>
      <div className={`${session && !profile ? 'w-full max-w-4xl bg-transparent shadow-none' : 'bg-white w-full max-w-sm rounded-[24px] shadow-2xl'} overflow-hidden relative transition-all duration-500`} onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className={session && !profile ? 'p-6 md:p-12' : 'p-8'}>
          {!(session && !profile) && (
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-teal-400 rounded-xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-teal-400/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900">로그인</h2>
              <p className="text-sm text-gray-500 mt-2">제주 전기차 충전소 커뮤니티에 참여해보세요.</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
          ) : !session ? (
            <div className="flex flex-col gap-3">
              <button 
                onClick={signInWithKakao}
                className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] 85% flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.767c0 2.766 1.83 5.187 4.54 6.55l-1.15 4.195c-.13.486.41.854.81.564l4.9-3.237c.29.023.59.034.89.034 5.523 0 10-3.477 10-7.767C22 6.477 17.523 3 12 3z"/>
                </svg>
                카카오로 시작하기
              </button>
              
              <button 
                onClick={signInWithGoogle}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold shadow-sm transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.5 5.9l6.2 5.2C36.9 36.9 44 31 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                </svg>
                Google로 시작하기
              </button>
            </div>
          ) : !profile ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">프로필을 선택해주세요</h1>
              
              <p className="text-zinc-400 font-medium mb-10 md:mb-16 bg-zinc-800/50 px-5 py-2 rounded-full border border-zinc-700/50 text-sm md:text-base">
                현재 로그인된 계정: <span className="text-white font-bold ml-1">{session?.user?.email || '알 수 없음'}</span>
              </p>
              
              <form onSubmit={handleCreateProfile} className="flex flex-col items-center w-full max-w-2xl gap-10 md:gap-14">
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  {AVATARS.map((avatar) => (
                    <div key={avatar} className="flex flex-col items-center gap-3 group">
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-[3px] transition-all duration-300 ${
                          selectedAvatar === avatar 
                            ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                            : 'border-transparent group-hover:border-white/50 group-hover:scale-105 opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        <img src={`/avatars/${avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                      {selectedAvatar === avatar && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white mt-1 animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="w-full max-w-md mt-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임 입력"
                      className="w-full bg-zinc-800/80 text-white text-xl md:text-2xl font-bold px-6 py-4 md:py-5 rounded-xl border-2 border-zinc-700 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-500 text-center"
                      maxLength={15}
                    />
                  </div>
                  {errorMsg && (
                    <p className="text-sm font-bold text-red-400 text-center mt-3 animate-pulse">{errorMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !nickname.trim()}
                  className="mt-2 bg-white text-black hover:bg-zinc-200 text-lg md:text-xl font-extrabold px-12 py-4 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {isSubmitting ? '시작하는 중...' : '시작하기'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}