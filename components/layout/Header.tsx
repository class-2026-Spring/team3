import React from 'react';

interface HeaderProps {
  totalCount: number;
}

export default function Header({ totalCount }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5.2 1 3 3.2 3 6c0 3.8 5 9 5 9s5-5.2 5-9c0-2.8-2.2-5-5-5zm0 6.5c-.8 0-1.5-.7-1.5-1.5S7.2 4.5 8 4.5s1.5.7 1.5 1.5S8.8 7.5 8 7.5z" fill="white"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none tracking-tight">제주 EV 라이브맵</p>
          <p className="text-[11px] text-gray-400 mt-0.5">실시간 공공데이터 연동</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <p className="text-xs text-gray-500 font-medium">검색된 충전기 <span className="text-blue-600 font-bold">{totalCount}</span>대</p>
      </div>
    </header>
  );
}
