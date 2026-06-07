'use client';
// components/layout/NotificationPanel.tsx

import { useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { AppNotification } from '../../types/notification';

interface Props {
  open: boolean;
  onClose: () => void;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
}) {
  const isAvailable = notif.type === 'available';
  const isUnavailable = notif.type === 'unavailable';
  const isComment = notif.type === 'comment';
  const isLike = notif.type === 'like';

  return (
    <div
      onClick={() => onRead(notif.id)}
      className={`px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-50 ${
        !notif.read ? 'bg-teal-50/40' : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div
          className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            isAvailable ? 'bg-teal-100' : isUnavailable ? 'bg-red-100' : isComment ? 'bg-blue-100' : isLike ? 'bg-pink-100' : 'bg-amber-100'
          }`}
        >
          {isAvailable ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : isUnavailable ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          ) : isComment ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          ) : isLike ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-gray-800 truncate">{notif.stationName}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
          <p className="text-[10px] text-gray-300 mt-1 font-medium">{timeAgo(notif.createdAt)}</p>
        </div>

        {/* 읽지 않음 점 */}
        {!notif.read && (
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
        )}
      </div>
    </div>
  );
}

export default function NotificationPanel({ open, onClose }: Props) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useAppContext();
  const panelRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]" />

      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[300px] bg-white shadow-2xl z-50 flex flex-col"
        style={{ borderLeft: '1px solid #f0f0f0' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-teal-500">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <h2 className="text-[14px] font-bold text-gray-800">알림</h2>
            {unreadCount > 0 && (
              <span className="bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 액션 버튼 */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50 bg-gray-50/50">
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              모두 읽음
            </button>
            <button
              onClick={clearAll}
              className="text-[11px] font-semibold text-gray-400 hover:text-red-400 transition-colors"
            >
              전체 삭제
            </button>
          </div>
        )}

        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-16 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <p className="text-[12px] font-bold text-gray-400">알림이 없습니다</p>
              <p className="text-[11px] text-gray-300 mt-1">
                즐겨찾기한 충전소 상태 변경이나<br />새로운 후기 등록 시 여기에 표시됩니다
              </p>
            </div>
          ) : (
            notifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onRead={markRead}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
