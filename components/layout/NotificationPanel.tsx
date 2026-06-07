'use client';
// components/layout/NotificationPanel.tsx

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { useAppContext } from '../../contexts/AppContext';
import { AppNotification } from '../../types/notification';
import { useTranslation } from '../../hooks/useTranslation';

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
  onClick,
  onRemove,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onClick: (stationId: string) => void;
  onRemove: (id: string) => void;
}) {
  const isAvailable = notif.type === 'available';
  const isUnavailable = notif.type === 'unavailable';
  const isComment = notif.type === 'comment';
  const isLike = notif.type === 'like';

  const handleClick = () => {
    onRead(notif.id);
    if (notif.stationId) {
      onClick(notif.stationId);
    }
  };

  const controls = useAnimation();

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const threshold = -80; // 왼쪽으로 80px 이상 밀면 삭제
    if (info.offset.x < threshold) {
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.2 } });
      onRemove(notif.id);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', bounce: 0.4, duration: 0.4 } });
    }
  };

  return (
    <div className="relative overflow-hidden group border-b border-gray-50 dark:border-gray-800/50">
      {/* 배경 삭제 영역 (드래그 시 나타남) */}
      <div className="absolute inset-y-0 right-0 w-full bg-red-500 flex items-center justify-end px-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      {/* 실제 알림 아이템 (드래그 가능 영역) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.8, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={handleClick}
        className={`relative px-4 py-3.5 cursor-pointer transition-colors z-10 ${
          !notif.read ? 'bg-teal-50/90 dark:bg-teal-900/30 hover:bg-teal-50 dark:hover:bg-teal-900/50' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-start gap-3 pointer-events-none">
          {/* 아이콘 */}
          <div
            className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              isAvailable ? 'bg-teal-100' : isUnavailable ? 'bg-red-100' : isComment ? 'bg-blue-100' : isLike ? 'bg-pink-100' : 'bg-amber-100'
            }`}
          >
            {isAvailable ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
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
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-100 truncate">{notif.stationName}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
            <p className="text-[10px] text-gray-300 dark:text-gray-500 mt-1 font-medium">{timeAgo(notif.createdAt)}</p>
          </div>

          {/* 읽지 않음 점 */}
          {!notif.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function NotificationPanel({ open, onClose }: Props) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll, removeNotification } = useAppContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  // 필터 상태
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | '1day' | '1week' | '1month' | '1year'>('all');

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

  const handleNotificationClick = (stationId: string) => {
    router.push(`/?station=${stationId}`);
    onClose();
  };

  // 필터 적용
  const filteredNotifications = notifications.filter(notif => {
    if (filterStatus === 'unread' && notif.read) return false;
    if (filterStatus === 'read' && !notif.read) return false;

    if (filterPeriod !== 'all') {
      const now = new Date();
      const notifDate = new Date(notif.createdAt);

      // 날짜 차이 계산 (자정 기준)
      const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const notifStart = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
      const diffDays = Math.floor((nowStart.getTime() - notifStart.getTime()) / (1000 * 60 * 60 * 24));

      if (filterPeriod === 'today' && diffDays > 0) return false;
      if (filterPeriod === '1day' && diffDays > 1) return false;
      if (filterPeriod === '1week' && diffDays > 7) return false;
      if (filterPeriod === '1month' && diffDays > 30) return false;
      if (filterPeriod === '1year' && diffDays > 365) return false;
    }
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]" />

      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[340px] md:w-[380px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-colors"
        style={{ borderLeft: '1px solid var(--tw-border-opacity, #f0f0f0)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-teal-500">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <h2 className="text-[14px] font-bold text-gray-800 dark:text-gray-100">{t('notifications.title')}</h2>
            {unreadCount > 0 && (
              <span className="bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 필터 영역 */}
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col gap-3">
          {/* 기간 필터 (Select Box) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 shrink-0">
              {t('notifications.period')}
            </span>
            <div className="relative">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="appearance-none text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 pr-7 outline-none focus:border-teal-400 dark:focus:border-teal-500 cursor-pointer shadow-sm transition-colors"
              >
                <option value="all">{t('notifications.period_all')}</option>
                <option value="today">{t('notifications.period_today')}</option>
                <option value="1day">{t('notifications.period_1day')}</option>
                <option value="1week">{t('notifications.period_1week')}</option>
                <option value="1month">{t('notifications.period_1month')}</option>
                <option value="1year">{t('notifications.period_1year')}</option>
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          {/* 상태 필터 (Pill Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 shrink-0">{t('notifications.status')}</span>
            <button onClick={() => setFilterStatus('all')} className={`text-[11px] px-3 py-1.5 rounded-full font-bold transition-all border ${filterStatus === 'all' ? 'bg-teal-500 border-teal-500 text-white shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>{t('notifications.status_all')}</button>
            <button onClick={() => setFilterStatus('unread')} className={`text-[11px] px-3 py-1.5 rounded-full font-bold transition-all border ${filterStatus === 'unread' ? 'bg-teal-500 border-teal-500 text-white shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>{t('notifications.status_unread')}</button>
            <button onClick={() => setFilterStatus('read')} className={`text-[11px] px-3 py-1.5 rounded-full font-bold transition-all border ${filterStatus === 'read' ? 'bg-teal-500 border-teal-500 text-white shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>{t('notifications.status_read')}</button>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            onClick={markAllRead}
            className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
          >
            {t('notifications.markAllRead')}
          </button>
          <button
            onClick={clearAll}
            className="text-[11px] font-bold text-gray-400 hover:text-red-400 transition-colors"
          >
            {t('notifications.clearAll')}
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-16 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300 dark:text-gray-600">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              </div>
              <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500">{t('notifications.empty')}</p>
              <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">
                {t('notifications.emptyDesc')}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onClick={handleNotificationClick}
                onRemove={removeNotification}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
