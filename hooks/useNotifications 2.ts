'use client';
// hooks/useNotifications.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types/notification';
import { AppSettings } from '../types/settings';
import { getStatLabel } from '../types/charger';

const MAX_NOTIFICATIONS = 50;

export function useNotifications(
  favoriteIds: string[],
  favoriteNames: Record<string, string>,
  settings: AppSettings,
  userId: string | null,
) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const addNotification = useCallback(
    (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
      const newNotif: AppNotification = {
        ...notif,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
    },
    [],
  );

  useEffect(() => {
    const shouldSubscribe =
      userId &&
      settings.notifications.enabled &&
      settings.notifications.favoriteStatusChange &&
      favoriteIds.length > 0;

    console.log('[알림 디버그]', {
      userId,
      enabled: settings.notifications.enabled,
      favoriteStatusChange: settings.notifications.favoriteStatusChange,
      favoriteIds,
      favoriteNames,
      shouldSubscribe: !!shouldSubscribe,
    });

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (!shouldSubscribe) return;

    console.log('[알림] Realtime 구독 시작');

    const channel = supabase
      .channel(`favorite-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'charger_status',
        },
        (payload) => {
          console.log('[알림] 상태 변경 감지:', payload);

          const newRow = payload.new as {
            id: string;
            stat_id: string;
            chger_id: string;
            stat: string;
          };
          const oldRow = payload.old as {
            stat: string;
          };

          if (!favoriteIds.includes(newRow.stat_id)) return;
          if (newRow.stat === oldRow.stat) return;

          const isNowAvailable = newRow.stat === '2';
          const statusLabel = getStatLabel(newRow.stat);
          const stationName = favoriteNames[newRow.stat_id] ?? newRow.stat_id;

          addNotification({
            type: isNowAvailable ? 'available' : 'status_change',
            stationId: newRow.stat_id,
            stationName,
            message: isNowAvailable
              ? `${stationName} 충전기를 사용할 수 있습니다.`
              : `${stationName} 상태가 '${statusLabel}'(으)로 변경되었습니다.`,
          });
        },
      )
      .subscribe((status) => {
        console.log('[알림] 구독 상태:', status);
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [
    userId,
    favoriteIds,
    favoriteNames,
    settings.notifications.enabled,
    settings.notifications.favoriteStatusChange,
    addNotification,
  ]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, clearAll };
}