import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Charger } from '../types/charger';

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([]); // station_id 목록
  const [loading, setLoading] = useState(false);

  // 즐겨찾기 목록 불러오기
  useEffect(() => {
    if (!userId) { setFavorites([]); return; }
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('station_id')
        .eq('user_id', userId);
      setFavorites(data?.map(r => r.station_id) ?? []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const isFavorite = (stationId: string) => favorites.includes(stationId);

  const toggleFavorite = async (charger: Charger) => {
    if (!userId) return false; // 로그인 필요

    if (isFavorite(charger.id)) {
      // 삭제
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('station_id', charger.id);
      setFavorites(prev => prev.filter(id => id !== charger.id));
    } else {
      // 추가
      await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          station_id: charger.id,
          station_name: charger.name,
          station_address: charger.address,
        });
      setFavorites(prev => [...prev, charger.id]);
    }
    return true;
  };

  return { favorites, isFavorite, toggleFavorite, loading };
}