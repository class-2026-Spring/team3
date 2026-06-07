"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarUrl } from "../../lib/utils";
import EditProfileModal from "../auth/EditProfileModal";

export default function Sidebar() {
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
    <aside className="w-[260px] bg-white hidden lg:flex flex-col m-4 rounded-[20px] shadow-sm border border-gray-100/50 overflow-y-auto scrollbar-hide z-50">
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

        <Link href="/" className={getTabClass("/")}>
          <div className={getIconClass("/")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
          </div>
          <span className="text-[13px]">Home</span>
        </Link>

        <Link href="/ai" className={getTabClass("/ai")}>
          <div className={getIconClass("/ai")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 19H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V9h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2zm4 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V9h4v2z" /></svg>
          </div>
          <span className="text-[13px]">AI</span>
        </Link>

        <div className="pt-4 pb-2 px-4">
          <h6 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">PROFILE</h6>
        </div>

        <Link href="/favorite" className={getTabClass("/favorite")}>
          <div className={getIconClass("/favorite")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <span className="text-[13px]">즐겨찾기</span>
        </Link>
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

      {/* 프로필 수정 모달 */}
      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </aside>
  );
}
