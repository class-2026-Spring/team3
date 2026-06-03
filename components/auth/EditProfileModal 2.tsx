'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'];

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { session, profile, updateProfile } = useAuth();
  
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when profile is available or modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setNickname(profile.nickname || '');
      setSelectedAvatar(profile.avatar_url || AVATARS[0]);
      setErrorMsg('');
    }
  }, [isOpen, profile]);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname?.trim()) {
      setErrorMsg('닉네임을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    const success = await updateProfile(nickname, selectedAvatar);
    if (!success) {
      setErrorMsg('프로필 수정에 실패했습니다. 닉네임이 중복될 수 있습니다.');
    } else {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">프로필 수정</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-3 text-center">아바타 변경</label>
              <div className="flex justify-center gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatar ? 'border-teal-500 scale-110 shadow-md shadow-teal-500/20' : 'border-transparent hover:border-gray-300 hover:scale-105'
                    }`}
                  >
                    <img src={`/avatars/${avatar}`} alt="Avatar" className="w-full h-full object-cover bg-gray-50" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="사용할 닉네임을 입력하세요"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-medium"
                maxLength={15}
              />
              <p className="text-[11px] text-gray-400 mt-2 text-center">현재 계정: {session?.user?.email}</p>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-500 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !nickname?.trim()}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
            >
              {isSubmitting ? '저장 중...' : '프로필 저장'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
