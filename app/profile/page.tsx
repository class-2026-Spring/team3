'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) { router.push('/'); return; }
      setUser(u);

      // 프로필 로드
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single();
      setProfile(prof);
      setNickname(prof?.nickname ?? '');
      if (prof?.avatar_url) setAvatarPreview(prof.avatar_url);

      // 즐겨찾기 수
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id);
      setFavoriteCount(count ?? 0);

      setLoading(false);
    });
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 아바타 파일 선택
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // 프로필 저장 (닉네임 + 아바타)
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url ?? null;

      // 아바타 업로드
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }

      // 프로필 업데이트
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, nickname, avatar_url, updated_at: new Date().toISOString() });
      if (error) throw error;

      setProfile(prev => prev ? { ...prev, nickname, avatar_url } : null);
      showMessage('success', '프로필이 저장됐어요!');
    } catch (err: any) {
      showMessage('error', err.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', '새 비밀번호가 일치하지 않아요');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', '비밀번호는 6자 이상이어야 해요');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', '비밀번호가 변경됐어요!');
    } catch (err: any) {
      showMessage('error', err.message ?? '변경 실패');
    } finally {
      setSaving(false);
    }
  };

  // 로그아웃
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-400 rounded-full animate-spin"/>
      </div>
    );
  }

  const isEmailUser = user?.app_metadata?.provider === 'email';

  return (
    <div className="mt-2 mb-2 flex flex-col gap-4 max-w-2xl mx-auto">

      {/* 메시지 토스트 */}
      {message && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl ${message.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>
          {message.text}
        </div>
      )}

      {/* 프로필 카드 */}
      <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-400 to-teal-500 h-24 relative">
          {/* 아바타 */}
          <div className="absolute -bottom-10 left-6">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-100 overflow-hidden cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-teal-100">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#0d9488">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center border-2 border-white shadow"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <p className="text-[18px] font-extrabold text-gray-900">{nickname || '닉네임 없음'}</p>
          <p className="text-[13px] text-gray-400 mt-0.5">{user?.email}</p>

          {/* 통계 */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
              <p className="text-[22px] font-black text-yellow-500">{favoriteCount}</p>
              <p className="text-[11px] font-semibold text-yellow-400 mt-0.5">즐겨찾기</p>
            </div>
            <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
              <p className="text-[22px] font-black text-teal-500">
                {user?.app_metadata?.provider === 'google' ? 'G' : user?.app_metadata?.provider === 'kakao' ? 'K' : 'E'}
              </p>
              <p className="text-[11px] font-semibold text-teal-400 mt-0.5">로그인 방식</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-[13px] font-black text-gray-600">
                {new Date(user?.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[11px] font-semibold text-gray-400 mt-0.5">가입일</p>
            </div>
          </div>
        </div>
      </div>

      {/* 닉네임 수정 */}
      <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
        <h3 className="font-extrabold text-gray-800 text-[14px] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          프로필 수정
        </h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">이메일</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-sm transition-colors mt-1"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 (이메일 로그인만) */}
      {isEmailUser && (
        <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
          <h3 className="font-extrabold text-gray-800 text-[14px] mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            비밀번호 변경
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white font-bold text-sm transition-colors mt-1"
            >
              {saving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      )}

      {/* 로그아웃 */}
      <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
        <h3 className="font-extrabold text-gray-800 text-[14px] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          계정
        </h3>
        <button
          onClick={handleSignOut}
          className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"
        >
          로그아웃
        </button>
      </div>

    </div>
  );
}