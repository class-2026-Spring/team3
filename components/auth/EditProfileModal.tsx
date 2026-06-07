'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

import { getAvatarUrl } from '../../lib/utils';
import AvatarCustomizer from './AvatarCustomizer';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { session, profile, updateProfile, checkNicknameUnique } = useAuth();

  const [nickname, setNickname] = useState('');
  const [avatars, setAvatars] = useState<string[]>(['a.png', 'b.png', 'c.png', 'd.png', 'e.png']);
  const [selectedAvatar, setSelectedAvatar] = useState('a.png');
  const [avatarMode, setAvatarMode] = useState<'basic' | 'custom'>('basic');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 닉네임 자동 로드 (아바타 목록 동적 가져오기)
  useEffect(() => {
    fetch('/api/avatars')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvatars(data);
        }
      })
      .catch(console.error);
  }, []);

  // Sync state when profile is available or modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setNickname(profile.nickname || '');
      const url = profile.avatar_url || 'a.png';
      setSelectedAvatar(url);
      if (url.includes('api.dicebear.com')) {
        setAvatarMode('custom');
        setCustomAvatarUrl(url);
      } else {
        setAvatarMode('basic');
      }
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
    
    // 닉네임 중복 체크
    const isUnique = await checkNicknameUnique(nickname);
    if (!isUnique) {
      setErrorMsg('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      setIsSubmitting(false);
      return;
    }

    const avatarToSave = avatarMode === 'custom' ? customAvatarUrl : selectedAvatar;

    const success = await updateProfile(nickname, avatarToSave);
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="w-full">
              <div className="flex bg-gray-100 p-1 rounded-xl w-full mb-4">
                <button type="button" onClick={() => setAvatarMode('basic')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${avatarMode === 'basic' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>기본 캐릭터</button>
                <button type="button" onClick={() => setAvatarMode('custom')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${avatarMode === 'custom' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>직접 만들기</button>
              </div>

              {avatarMode === 'basic' ? (
                <div className="flex flex-wrap justify-center gap-3">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === avatar ? 'border-teal-500 scale-110 shadow-md shadow-teal-500/20' : 'border-transparent hover:border-gray-300 hover:scale-105'
                        }`}
                    >
                      <img src={getAvatarUrl(avatar)} alt="Avatar" className="w-full h-full object-cover bg-gray-50" />
                    </button>
                  ))}
                </div>
              ) : (
                <AvatarCustomizer 
                  initialUrl={selectedAvatar.includes('api.dicebear.com') ? selectedAvatar : undefined}
                  onChange={setCustomAvatarUrl} 
                  defaultNickname={nickname} 
                />
              )}
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
