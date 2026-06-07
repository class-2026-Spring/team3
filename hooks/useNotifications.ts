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
  const [isLoaded, setIsLoaded] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // localStorage에서 초기 알림 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`jeju-ev-notifs-${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      }
    } catch {}
    setIsLoaded(true);
  }, [userId]);

  // 알림 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isLoaded || !userId) return;
    try {
      localStorage.setItem(`jeju-ev-notifs-${userId}`, JSON.stringify(notifications));
    } catch {}
  }, [notifications, userId, isLoaded]);

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
    const shouldSubscribe = userId && settings.notifications.enabled;

    console.log('[알림 디버그]', {
      userId,
      enabled: settings.notifications.enabled,
      favoriteStatusChange: settings.notifications.favoriteStatusChange,
      favoriteComments: settings.notifications.favoriteComments,
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
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'charger_status',
        },
        (payload) => {
          if (!settings.notifications.favoriteStatusChange) return;
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'station_comments',
        },
        async (payload) => {
          const newRow = payload.new as {
            id: string;
            station_id: string;
            user_id: string;
            content: string;
            station_name?: string;
            parent_id?: string;
          };

          if (newRow.user_id === userId) return; // 내가 쓴 글 무시

          const stationName = newRow.station_name || favoriteNames[newRow.station_id] || newRow.station_id;

          // 1. 내 댓글에 달린 대댓글(답글)인지 확인
          if (newRow.parent_id) {
            const { data: parentComment } = await supabase
              .from('station_comments')
              .select('user_id')
              .eq('id', newRow.parent_id)
              .single();

            if (parentComment?.user_id === userId) {
              const snippet = newRow.content.length > 20 ? newRow.content.slice(0, 20) + '...' : newRow.content;
              addNotification({
                type: 'comment',
                stationId: newRow.station_id,
                stationName,
                message: `내 댓글에 답글이 달렸습니다: "${snippet}"`,
              });
              return; // 본인 답글 알림을 보냈으면 기존 즐겨찾기 알림은 생략
            }
          }

          // 2. 즐겨찾기 충전소 새 댓글 (기존 로직)
          if (settings.notifications.favoriteComments && favoriteIds.includes(newRow.station_id)) {
            console.log('[알림 디버그] 즐겨찾기 충전소 댓글 감지:', newRow);
            addNotification({
              type: 'comment',
              stationId: newRow.station_id,
              stationName,
              message: `${stationName}에 새로운 후기가 등록되었습니다.`,
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_likes',
        },
        async (payload) => {
          console.log('[알림 디버그] 좋아요 Realtime 이벤트 수신:', payload);
          const newRow = payload.new as {
            comment_id: string;
            user_id: string;
          };
          if (newRow.user_id === userId) {
             console.log('[알림 디버그] 내가 누른 좋아요이므로 무시합니다.');
             return; // 내가 누른 좋아요 무시
          }

          // 어떤 댓글에 좋아요가 눌렸는지 조회
          const { data: comment, error } = await supabase
            .from('station_comments')
            .select('user_id, station_id, station_name, content')
            .eq('id', newRow.comment_id)
            .single();
            
          console.log('[알림 디버그] 원본 댓글 조회 결과:', { comment, error, myUserId: userId });

          if (comment?.user_id === userId) {
            console.log('[알림 디버그] 내 댓글에 달린 좋아요 확인 완료! 알림 발송');
            const stationName = comment.station_name || favoriteNames[comment.station_id] || comment.station_id;
            const snippet = comment.content.length > 20 ? comment.content.slice(0, 20) + '...' : comment.content;
            addNotification({
              type: 'like',
              stationId: comment.station_id,
              stationName,
              message: `내 댓글에 좋아요가 달렸습니다: "${snippet}"`,
            });
          }
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
    settings.notifications.favoriteComments,
    addNotification,
  ]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      console.log("[알림 디버그] 모두 읽음 클릭됨", prev.length);
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, clearAll, removeNotification, addNotification };
}