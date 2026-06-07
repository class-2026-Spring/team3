"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AuthModal from "../auth/AuthModal";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarUrl } from "../../lib/utils";
import SettingsPanel from "./SettingsPanel";
import NotificationPanel from "./NotificationPanel";
import { AppProvider, useAppContext } from "../../contexts/AppContext";
import { useFavorites } from "../../hooks/useFavorites";
import { supabase } from "../../lib/supabase";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { session, profile, loading, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [user, setUser] = useState<any>(null);

  const { unreadCount } = useAppContext();

  // 로그인 모달 자동 제어 (로그인 후 프로필이 없으면 띄우고, 다 있으면 닫기)
  useEffect(() => {
    if (loading) return;
    
    if (session && !profile) {
      setShowAuthModal(true);
    } else if (session && profile) {
      setShowAuthModal(false);
    }
  }, [session, profile, loading]);


  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">
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

      {/* 모바일 오버레이 */}
      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <Sidebar
        user={user}
        unreadCount={unreadCount}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
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

      {/* 로그인 모달 */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
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
