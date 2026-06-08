"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AuthModal from "../auth/AuthModal";
import { useAuth } from "../../hooks/useAuth";
import SettingsPanel from "./SettingsPanel";
import NotificationPanel from "./NotificationPanel";
import ComparePanel from "../charger/ComparePanel";
import { AppProvider, useAppContext } from "../../contexts/AppContext";
import { useFavorites } from "../../hooks/useFavorites";
import { useCompare } from "../../hooks/useCompare";
import { supabase } from "../../lib/supabase";
import { Charger } from "../../types/charger";
import React from "react";

export const CompareContext = React.createContext<{
  compareIds: string[];
  isInCompare: (id: string) => boolean;
  onToggleCompare: (id: string) => void;
  canAddCompare: boolean;
  showCompare: boolean;
  setShowCompare: (v: boolean) => void;
  // page.tsx에서 실시간 charger 목록을 올려줌
  registerChargers: (chargers: Charger[]) => void;
  userLocation: { lat: number; lng: number } | null;
} | null>(null);

function LayoutInner({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { session, profile, loading, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [allChargers, setAllChargers] = useState<Charger[]>([]);

  const { unreadCount, settings } = useAppContext();

  const {
    compareIds, showCompare, setShowCompare,
    addToCompare, removeFromCompare, clearCompare,
    isInCompare, canAdd: canAddCompare,
  } = useCompare();

  const onToggleCompare = (id: string) => {
    if (isInCompare(id)) removeFromCompare(id);
    else addToCompare(id);
  };

  // page.tsx에서 최신 charger 목록을 올려받음
  const registerChargers = (chargers: Charger[]) => {
    setAllChargers(chargers);
  };

  // compareIds 기준으로 실시간 charger 조회
  const compareList = compareIds
    .map(id => allChargers.find(c => c.id === id))
    .filter(Boolean) as Charger[];

  // 현재 위치
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // 로그인 모달 자동 제어
  useEffect(() => {
    if (loading) return;
    if (session && !profile) setShowAuthModal(true);
    else if (session && profile) setShowAuthModal(false);
  }, [session, profile, loading]);

  // 다크모드 제어
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isSystemDark: boolean) => {
      if (settings.theme === 'dark') root.classList.add('dark');
      else if (settings.theme === 'light') root.classList.remove('dark');
      else { if (isSystemDark) root.classList.add('dark'); else root.classList.remove('dark'); }
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  return (
    <CompareContext.Provider value={{
      compareIds, isInCompare, onToggleCompare, canAddCompare,
      showCompare, setShowCompare, registerChargers, userLocation,
    }}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
        {/* 모바일 햄버거 버튼 */}
        <button
          onClick={() => setShowSidebar(true)}
          className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {showSidebar && (
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
        )}

        <Sidebar
          user={user}
          unreadCount={unreadCount}
          onSignIn={() => setShowAuthModal(true)}
          onSignOut={signOut}
          onSettings={() => { setShowSettings(true); setShowNotifications(false); }}
          onNotifications={() => { setShowNotifications(true); setShowSettings(false); }}
          showMobile={showSidebar}
          onCloseMobile={() => setShowSidebar(false)}
        />

        <main className="flex-1 flex flex-col h-full relative overflow-hidden py-4 px-4 pl-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-0 flex flex-col relative z-10 gap-5 scrollbar-hide pb-6">
            {children}
            <footer className="py-2 px-2 flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-400 font-medium mt-auto">
              <p className="mb-2 md:mb-0">© EV는 AI이며 정보 제공 시 실수를 할 수 있습니다.</p>
            </footer>
          </div>
        </main>

        {/* 비교 모달 */}
        {showCompare && (
          <ComparePanel
            compareList={compareList}
            onRemove={removeFromCompare}
            onClear={clearCompare}
            onClose={() => setShowCompare(false)}
            userLocation={userLocation}
          />
        )}

        {/* 비교 플로팅 버튼 */}
        {!showCompare && compareIds.length > 0 && (
          <button
            onClick={() => setShowCompare(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-full shadow-lg shadow-teal-500/30 transition-all font-bold text-[13px]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/>
            </svg>
            비교 {compareIds.length}개
          </button>
        )}

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
        <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
      </div>
    </CompareContext.Provider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { favorites, favoriteNames } = useFavorites(userId);

  return (
    <AppProvider favoriteIds={favorites} favoriteNames={favoriteNames} userId={userId}>
      <LayoutInner>{children}</LayoutInner>
    </AppProvider>
  );
}
