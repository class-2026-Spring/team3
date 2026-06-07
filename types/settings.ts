// types/settings.ts

export type Language = 'ko' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type MapFilter = '전체' | '급속' | '완속'; // charger.ts의 FilterType과 동일

export interface NotificationSettings {
  enabled: boolean;
  favoriteStatusChange: boolean;
  favoriteComments: boolean;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  mapDefaultFilter: MapFilter;
  mapShowAvailableOnly: boolean;
  notifications: NotificationSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ko',
  theme: 'system',
  mapDefaultFilter: '전체',
  mapShowAvailableOnly: false,
  notifications: {
    enabled: true,
    favoriteStatusChange: true,
    favoriteComments: true,
  },
};
