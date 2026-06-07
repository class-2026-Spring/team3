// types/notification.ts

export type NotificationType = 'available' | 'unavailable' | 'status_change' | 'comment' | 'like';

export interface AppNotification {
  id: string;
  type: NotificationType;
  stationId: string;
  stationName: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
