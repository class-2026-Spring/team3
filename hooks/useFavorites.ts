import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Charger } from '../types/charger';

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteNames, setFavoriteNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setFavorites([]); setFavoriteNames({}); return; }
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('station_id, station_name')
        .eq('user_id', userId);
      setFavorites(data?.map(r => r.station_id) ?? []);
      const names: Record<string, string> = {};
      data?.forEach(r => { names[r.station_id] = r.station_name; });
      setFavoriteNames(names);
      setLoading(false);
    };
    load();
  }, [userId]);

  const isFavorite = (stationId: string) => favorites.includes(stationId);

  const toggleFavorite = async (charger: Charger) => {
    if (!userId) return false;

    if (isFavorite(charger.id)) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('station_id', charger.id);
      setFavorites(prev => prev.filter(id => id !== charger.id));
      setFavoriteNames(prev => {
        const next = { ...prev };
        delete next[charger.id];
        return next;
      });
    } else {
      await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          station_id: charger.id,
          station_name: charger.name,
          station_address: charger.address,
        });
      setFavorites(prev => [...prev, charger.id]);
      setFavoriteNames(prev => ({ ...prev, [charger.id]: charger.name }));
    }
    return true;
  };

  return { favorites, favoriteNames, isFavorite, toggleFavorite, loading };
}
