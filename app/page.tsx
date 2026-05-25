'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import KakaoMap from '../components/map/Kakao';
import SearchBar from '../components/charger/SearchBar';
import ChargerList from '../components/charger/ChargerList';
import { useChargerData } from '../hooks/useChargerData';
import { useFavorites } from '../hooks/useFavorites';
import { getStatColor, getStationStats, getStationRepresentativeStat } from '../types/charger';
import { supabase } from '../lib/supabase';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    chargers, loading, statusLoading, error,
    zoomState, selectCity, selectDistrict, resetToCity, resetToDistrict,
    chargeFilter, setChargeFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    selectedCharger, setSelectedCharger,
    filteredChargers, searchResults, districtSearchResults,
  } = useChargerData();

  const [userId, setUserId] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites(userId);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 즐겨찾기 페이지에서 ?station=ID 로 넘어온 경우 처리
  useEffect(() => {
    const stationId = searchParams.get('station');
    if (!stationId || chargers.length === 0) return;

    const found = chargers.find(c => c.id === stationId);
    if (found) {
      selectDistrict(found.district);
      setTimeout(() => {
        setSelectedCharger(found);
        // URL 파라미터 제거 (뒤로가기 시 반복 실행 방지)
        router.replace('/');
      }, 100);
    }
  }, [searchParams, chargers]);

  const handleToggleFavorite = async (charger: typeof chargers[0]) => {
    const ok = await toggleFavorite(charger);
    if (!ok) {
      setShowLoginToast(true);
      setTimeout(() => setShowLoginToast(false), 2500);
    }
  };

  const handleSelectCharger = (c: typeof chargers[0]) => {
    selectDistrict(c.district);
    setTimeout(() => setSelectedCharger(c), 50);
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold text-sm">오류가 발생했습니다</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      )}

      {showLoginToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl">
          즐겨찾기는 로그인 후 사용할 수 있습니다
        </div>
      )}

      <div className="bg-white rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100/80 flex-1 min-h-[500px] flex flex-col md:flex-row overflow-hidden relative mt-2 mb-2">

        {loading && chargers.length === 0 && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] font-bold text-gray-700">제주 지역 충전소 위치를 불러오는 중...</p>
            <p className="mt-1 text-[11px] text-gray-500">잠시만 기다려주세요</p>
          </div>
        )}

        {!loading && statusLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-teal-100 flex items-center gap-2 pointer-events-none">
            <div className="w-3 h-3 border-[2.5px] border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
            <span className="text-[11px] font-bold text-teal-600 tracking-tight">실시간 상태 동기화 중...</span>
          </div>
        )}

        <div className="flex-1 relative flex flex-col min-h-[400px]">
          <div className="relative z-10 w-full border-b border-gray-100">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              districtSearchResults={districtSearchResults}
              onSelectCharger={handleSelectCharger}
              onSelectDistrict={selectDistrict}
            />
          </div>

          {zoomState.level === 'district' && (
            <button onClick={resetToCity} className="absolute top-[60px] left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all font-bold text-[13px] hover:pr-5 group">
              <svg className="text-gray-400 group-hover:-translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              제주도 전체보기
            </button>
          )}
          
          {zoomState.level === 'station' && (
            <button onClick={resetToDistrict} className="absolute top-[60px] left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-200 text-gray-800 hover:bg-gray-50 transition-all font-extrabold text-[13px] hover:pr-5 group">
              <svg className="text-gray-500 group-hover:-translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {zoomState.selectedCity} 보기 (뒤로 가기)
            </button>
          )}

          <div className="flex-1 relative">
            <KakaoMap
              chargers={filteredChargers}
              allChargers={chargers}
              chargeFilter={chargeFilter}
              zoomState={zoomState}
              selectCity={selectCity}
              selectDistrict={selectDistrict}
              resetToCity={resetToCity}
              resetToDistrict={resetToDistrict}
              selectedCharger={selectedCharger}
              setSelectedCharger={setSelectedCharger}
            />
          </div>

          {selectedCharger && (() => {
            const stats = getStationStats(selectedCharger.chargers);
            const repStat = getStationRepresentativeStat(selectedCharger.chargers);
            const fav = isFavorite(selectedCharger.id);
            return (
              <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[340px] md:right-auto z-20">
                <div className="bg-white rounded-[15px] shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[15px] font-bold text-gray-900 leading-tight flex-1 mr-2">{selectedCharger.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleFavorite(selectedCharger)} className="p-1.5 rounded-full hover:bg-yellow-50 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24"
                            fill={fav ? '#f59e0b' : 'none'}
                            stroke={fav ? '#f59e0b' : '#9ca3af'}
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                        <button onClick={() => setSelectedCharger(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{selectedCharger.address}</p>
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                      <p className="text-[13px] font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        현재 충전 가능
                        <span className="w-2 h-2 rounded-full" style={{ background: getStatColor(repStat) }}></span>
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 items-center">
                          <span className="text-gray-500 text-xs font-semibold">급속</span>
                          <span className={stats.fastAvail > 0 ? "text-teal-500 font-extrabold" : "text-gray-300 font-extrabold"}>{stats.fastAvail}</span>
                          <span className="text-gray-400 text-[10px]">/ {stats.fastTotal}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200"></div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-gray-500 text-xs font-semibold">완속</span>
                          <span className={stats.slowAvail > 0 ? "text-teal-500 font-extrabold" : "text-gray-300 font-extrabold"}>{stats.slowAvail}</span>
                          <span className="text-gray-400 text-[10px]">/ {stats.slowTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 데스크탑 충전소 목록 */}
        <div className="w-[320px] border-l border-gray-100 bg-white hidden md:flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-extrabold text-gray-800 text-[13px]">충전소 목록</h3>
            <p className="text-[11px] text-gray-500 mt-1">총 <span className="text-teal-500 font-bold">{filteredChargers.length}</span>개의 충전소</p>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <ChargerList
                chargers={filteredChargers}
                zoomState={zoomState}
                selectCity={selectCity}
                selectDistrict={selectDistrict}
                resetToCity={resetToCity}
                resetToDistrict={resetToDistrict}
                chargeFilter={chargeFilter}
                setChargeFilter={setChargeFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onSelectCharger={setSelectedCharger}
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </div>
        </div>

        {/* 모바일 충전소 목록 시트 */}
        <div className={`md:hidden absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] rounded-t-[20px] ${isListExpanded ? 'h-[65vh]' : 'h-[60px]'}`}>
          <div className="w-full h-10 flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsListExpanded(!isListExpanded)}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-1"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isListExpanded ? 'Close List' : 'View List'}</span>
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-hidden relative border-t border-gray-50">
            <div className="absolute inset-0">
              <ChargerList
                chargers={filteredChargers}
                zoomState={zoomState}
                selectCity={selectCity}
                selectDistrict={selectDistrict}
                resetToCity={resetToCity}
                resetToDistrict={resetToDistrict}
                chargeFilter={chargeFilter}
                setChargeFilter={setChargeFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onSelectCharger={setSelectedCharger}
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}