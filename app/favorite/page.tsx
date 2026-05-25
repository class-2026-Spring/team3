'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface FavoriteStation {
  station_id: string;
  station_name: string;
  station_address: string;
  created_at: string;
}

export default function FavoritePage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadFavorites(uid);
      else setLoading(false);
    });
  }, []);

  const loadFavorites = async (uid: string) => {
    setLoading(true);
    const { data } = await supabase.from('favorites').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    setFavorites(data ?? []);
    setLoading(false);
  };

  const removeFavorite = async (e: React.MouseEvent, stationId: string) => {
    e.stopPropagation();
    if (!userId) return;
    await supabase.from('favorites').delete().eq('user_id', userId).eq('station_id', stationId);
    setFavorites(prev => prev.filter(f => f.station_id !== stationId));
  };

  const handleStationClick = (stationId: string) => { router.push(`/?station=${stationId}`); };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-400 rounded-full animate-spin"/>
    </div>
  );

  if (!userId) return (
    <div className="bg-white dark:bg-[#1a1d27] rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center mt-2">
      <div className="w-14 h-14 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <p className="text-[15px] font-bold text-gray-800 dark:text-white mb-2">로그인이 필요합니다</p>
      <p className="text-[13px] text-gray-400 dark:text-gray-500">로그인하면 즐겨찾기한 충전소를 확인할 수 있어요</p>
    </div>
  );

  return (
    <div className="mt-2 mb-2">
      <div className="bg-white dark:bg-[#1a1d27] rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800 dark:text-white text-[15px]">즐겨찾기</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">총 <span className="text-yellow-500 font-bold">{favorites.length}</span>개의 충전소</p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="mb-3">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">즐겨찾기한 충전소가 없어요</p>
            <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">충전소 카드의 ⭐ 버튼을 눌러 추가해보세요</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {favorites.map(fav => (
              <div key={fav.station_id} onClick={() => handleStationClick(fav.station_id)}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-yellow-300 hover:bg-yellow-50/40 dark:hover:bg-yellow-900/10 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" className="shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <p className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors truncate">{fav.station_name}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 ml-4">{fav.station_address}</p>
                    <div className="flex items-center gap-1.5 mt-2 ml-4">
                      <p className="text-[10px] text-gray-300 dark:text-gray-600">
                        {new Date(fav.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 추가
                      </p>
                      <span className="text-[10px] text-teal-400 font-semibold group-hover:underline">· 지도에서 보기 →</span>
                    </div>
                  </div>
                  <button onClick={(e) => removeFavorite(e, fav.station_id)}
                    className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
