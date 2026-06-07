import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations, TranslationKey } from '../lib/i18n/translations';

export function useTranslation() {
  const { settings } = useAppContext();
  const lang = settings?.language || 'ko';

  const t = useCallback((key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = translations[lang];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    
    return value as string;
  }, [lang]);

  return { t, lang };
}
