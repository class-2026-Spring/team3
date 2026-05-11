"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

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
      <div className="p-6 pb-4 text-center flex items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        </div>
        <span className="font-extrabold text-gray-800 text-[13px] tracking-widest uppercase">JEJU EV MAP</span>
      </div>

      <div className="px-6 mb-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      <div className="p-4 space-y-1 flex-1">
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
          <span className={pathname === "/ai" ? "text-[13px]" : "text-[13px] font-bold"}>Ai</span>
        </Link>

        <div className="px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer group mb-2">
          <div className="w-8 h-8 rounded-[10px] bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-9-8h-1v-1h2v-1h-2V7h-1v1H8v3h4v1h-2v1h2v2h1v-1h2v-3h-4z" /></svg>
          </div>
          <span className="text-[13px] font-bold">etc</span>
        </div>

        <div className="px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer group mb-2">
          <div className="w-8 h-8 rounded-[10px] bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
          </div>
          <span className="text-[13px] font-bold">etc</span>
        </div>

        <div className="pt-5 pb-2 px-4">
          <h6 className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wider">Account Pages</h6>
        </div>

        <div className="px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer group mb-2">
          <div className="w-8 h-8 rounded-[10px] bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <span className="text-[13px] font-bold text-gray-800">Profile</span>
        </div>

        <div className="px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer group mb-2">
          <div className="w-8 h-8 rounded-[10px] bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <span className="text-[13px] font-bold text-gray-800">Favorite</span>
        </div>

      </div>

      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-teal-400/20 mb-6">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/5 rounded-full blur-xl"></div>
          <div className="w-8 h-8 bg-white/20 rounded-[10px] flex items-center justify-center mb-3 backdrop-blur-sm border border-white/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
          </div>
          <p className="font-bold text-sm mb-1">Need help?</p>
          <p className="text-xs text-white/80 mb-3">Please check our docs</p>
          <button className="w-full bg-white text-gray-800 text-[11px] font-extrabold py-2.5 rounded-[10px] shadow-sm hover:shadow-md transition-all">
            DOCUMENTATION
          </button>
        </div>

        {/* Sidebar Profile Section */}
        <div className="flex items-center justify-between px-2 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2 -mx-2">
          <div className="flex items-center gap-3">
            <img src="/avatars/a.png" alt="Papakoo" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
            <div>
              <h4 className="text-[13px] font-bold text-gray-800">Papakoo</h4>
              <p className="text-[11px] font-medium text-gray-500">Project Manager</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
    </aside>
  );
}
