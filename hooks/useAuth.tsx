"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  createProfile: (nickname: string, avatarUrl: string) => Promise<boolean>;
  updateProfile: (nickname: string, avatarUrl: string) => Promise<boolean>;
  checkNicknameUnique: (nickname: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // DB에 row가 있으면 프로필로 간주 (닉네임 없어도)
    if (!error && data) {
      setProfile(data as UserProfile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
  };

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: `${window.location.origin}/` } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const createProfile = async (nickname: string, avatarUrl: string) => {
    if (!session?.user) return false;
    const { data, error } = await supabase.from('profiles').upsert([{ id: session.user.id, nickname, avatar_url: avatarUrl }]).select().single();
    if (!error && data) {
      setProfile(data as UserProfile);
      return true;
    }
    return false;
  };

  const updateProfile = async (nickname: string, avatarUrl: string) => {
    if (!session?.user) return false;
    const { data, error } = await supabase.from('profiles').update({ nickname, avatar_url: avatarUrl }).eq('id', session.user.id).select().single();
    if (!error && data) {
      setProfile(data as UserProfile);
      return true;
    }
    return false;
  };

  const checkNicknameUnique = async (nickname: string) => {
    if (!nickname.trim()) return false;
    
    // 현재 사용자의 기존 닉네임과 같다면 중복이 아님
    if (session?.user && profile?.nickname === nickname.trim()) {
      return true;
    }

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('nickname', nickname.trim());
      
    if (error) {
      console.error('Error checking nickname uniqueness:', error);
      return false; 
    }
    
    return count === 0;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signInWithGoogle, signInWithKakao, signOut, createProfile, updateProfile, checkNicknameUnique }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
