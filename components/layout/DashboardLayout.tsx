"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AuthModal from "../auth/AuthModal";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarUrl } from "../../lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { session, profile, loading, signOut } = useAuth();

  // 로그인 모달 자동 제어 (로그인 후 프로필이 없으면 띄우고, 다 있으면 닫기)
  useEffect(() => {
    if (loading) return;
    
    if (session && !profile) {
      setShowAuthModal(true);
    } else if (session && profile) {
      setShowAuthModal(false);
    }
  }, [session, profile, loading]);

  const getPageTitle = () => {
    switch (pathname) {
      case "/": return "Home";
      case "/ai": return "Ai Assistant";
      case "/favorite": return "Favorites";
      default: return "Dashboard";
    }
  };
  const title = getPageTitle();

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden py-4 px-4 pl-0">

        {/* Top Wave Background */}
        <div className="absolute top-4 left-0 right-4 h-[300px] bg-gradient-to-r from-teal-400 to-teal-500 rounded-[20px] overflow-hidden shadow-sm">
          <svg className="absolute w-full h-[150%] top-[0%] left-0 object-cover opacity-20 mix-blend-overlay pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,165.3C672,160,768,96,864,96C960,96,1056,160,1152,176C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {/* Navbar */}
        <header className="flex justify-between items-center py-2 px-2 relative z-10 text-white mb-6 pl-4 md:pl-2">
          <div>
            <div className="text-[11px] font-medium text-white/80 mb-0.5 flex items-center gap-1.5">
              <span className="opacity-80">Pages</span>
              <span className="opacity-60">/</span>
              <span className="font-bold opacity-100 text-white">{title}</span>
            </div>
            <h1 className="text-[15px] font-bold tracking-wide">{title}</h1>
          </div>

          <div className="flex items-center gap-4">

            {/* 로그인/로그아웃 버튼 */}
            {session ? (
              <div className="flex items-center gap-3">
                {profile && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={getAvatarUrl(profile.avatar_url)} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-full border border-white/50 object-cover"
                    />
                    <span className="text-white font-bold text-xs hidden md:block">
                      {profile.nickname}
                    </span>
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-white/90 hover:text-white font-bold text-xs transition-opacity bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg ml-2"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 text-white font-bold text-xs cursor-pointer hover:opacity-80 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Sign In</span>
              </button>
            )}

          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-0 flex flex-col relative z-10 gap-5 scrollbar-hide pb-6">
          {children}
          <footer className="py-2 px-2 flex flex-col md:flex-row justify-between items-center text-[11px] text-gray-400 font-medium mt-auto">
            <p className="mb-2 md:mb-0">© EV는 AI이며 정보 제공 시 실수를 할 수 있습니다.</p>
          </footer>
        </div>

      </main>

      {/* 로그인 모달 */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}