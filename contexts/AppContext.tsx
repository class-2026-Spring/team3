'use client';
// contexts/AppContext.tsx

import { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useNotifications } from '../hooks/useNotifications';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { AppNotification } from '../types/notification';

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isSettingsLoaded: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
  favoriteIds: string[];
  favoriteNames: Record<string, string>;
  userId: string | null;
}

export function AppProvider({ children, favoriteIds, favoriteNames, userId }: AppProviderProps) {
  const { settings, updateSettings, resetSettings, isLoaded } = useSettings();

  // settings가 로드되기 전엔 DEFAULT_SETTINGS 사용해서 undefined 방지
  const safeSettings: AppSettings = isLoaded ? settings : DEFAULT_SETTINGS;

  const { notifications, unreadCount, markRead, markAllRead, clearAll, addNotification } =
    useNotifications(favoriteIds, favoriteNames, safeSettings, userId);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isSettingsLoaded: isLoaded,
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        clearAll,
        addNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}