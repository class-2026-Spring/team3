"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarUrl } from "../../lib/utils";
import EditProfileModal from "../auth/EditProfileModal";

interface SidebarProps {
  user: any;
  unreadCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  showMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ user, unreadCount, onSignIn, onSignOut, onSettings, onNotifications, showMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const getTabClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "px-4 py-3 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] rounded-xl flex items-center gap-3 text-gray-800 font-bold mb-2 cursor-pointer transition-transform hover:scale-[1.02]";
    }
    return "px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer group mb-2";
  };

  const getIconClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "w-8 h-8 rounded-[10px] bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-400/30 shrink-0";
    }
    return "w-8 h-8 rounded-[10px] bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors shrink-0";
  };

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside className="w-[260px] bg-white hidden lg:flex flex-col m-4 rounded-[20px] shadow-sm border border-gray-100/50 overflow-y-auto scrollbar-hide z-50">
        <SidebarContent
          pathname={pathname}
          session={session}
          profile={profile}
          user={user}
          unreadCount={unreadCount}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onSettings={onSettings}
          onNotifications={onNotifications}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          getTabClass={getTabClass}
          getIconClass={getIconClass}
          onCloseMobile={() => {}}
          showClose={false}
        />
      </aside>

      {/* 모바일 사이드바 */}
      {showMobile && (
        <aside className="w-[260px] bg-white flex flex-col lg:hidden fixed top-4 bottom-4 left-4 rounded-[20px] shadow-xl border border-gray-100/50 overflow-y-auto scrollbar-hide z-50">
          <SidebarContent
            pathname={pathname}
            session={session}
            profile={profile}
            user={user}
            unreadCount={unreadCount}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onSettings={onSettings}
            onNotifications={onNotifications}
            showEditModal={showEditModal}
            setShowEditModal={setShowEditModal}
            getTabClass={getTabClass}
            getIconClass={getIconClass}
            onCloseMobile={onCloseMobile}
            showClose={true}
          />
        </aside>
      )}

      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </>
  );
}

function SidebarContent({ pathname, session, profile, user, unreadCount, onSignIn, onSignOut, onSettings, onNotifications, showEditModal, setShowEditModal, getTabClass, getIconClass, onCloseMobile, showClose }: any) {
  return (
    <>
      {/* 닫기 버튼 (모바일) */}
      {showClose && (
        <button
          onClick={onCloseMobile}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}

      {/* 로고 */}
      <div className="p-6 pb-4 text-center flex items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        </div>
        <span className="font-extrabold text-gray-800 text-[13px] tracking-widest uppercase">JEJU EV MAP</span>
      </div>

      <div className="px-6 mb-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      {/* 메뉴 */}
      <div className="p-4 space-y-1 flex-1">
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider px-4 pb-2">Main</p>

        <Link href="/" onClick={onCloseMobile} className={getTabClass("/")}>
          <div className={getIconClass("/")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
          </div>
          <span className="text-[13px]">Home</span>
        </Link>

        <Link href="/ai" onClick={onCloseMobile} className={getTabClass("/ai")}>
          <div className={getIconClass("/ai")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 19H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V9h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2zm4 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2z" /></svg>
          </div>
          <span className="text-[13px]">AI</span>
        </Link>

        <div className="pt-4 pb-2 px-4">
          <h6 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">PROFILE</h6>
        </div>

        <Link href="/favorite" onClick={onCloseMobile} className={getTabClass("/favorite")}>
          <div className={getIconClass("/favorite")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <span className="text-[13px]">즐겨찾기</span>
        </Link>

        <Link href="/mycomments" onClick={onCloseMobile} className={getTabClass("/mycomments")}>
          <div className={getIconClass("/mycomments")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
          </div>
          <span className="text-[13px]">내 댓글</span>
        </Link>
      </div>

      {/* 설정/알림/로그인 */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onSettings} className="w-8 h-8 rounded-[10px] bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border border-gray-100" title="설정">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
          </button>
          <button onClick={onNotifications} className="relative w-8 h-8 rounded-[10px] bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border border-gray-100" title="알림">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        {user ? (
          <button onClick={onSignOut} className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 font-bold text-xs transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            로그아웃
          </button>
        ) : (
          <button onClick={onSignIn} className="flex items-center gap-1.5 text-teal-500 hover:text-teal-600 font-bold text-xs transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            Sign In
          </button>
        )}
      </div>

      {/* Profile Section */}
      {session && profile && (
        <div className="p-4 mt-auto border-t border-gray-100">
          <div
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="relative">
              <img src={getAvatarUrl(profile.avatar_url)} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-[2.5px] border-teal-100/60 bg-gray-100" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-teal-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-extrabold text-gray-800 truncate">{profile.nickname}</p>
              <p className="text-[11px] font-semibold text-gray-400 truncate">{session.user?.email || 'EV Driver'}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      )}
    </>
  );
}
