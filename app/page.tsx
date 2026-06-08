'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import KakaoMap from '../components/map/Kakao';
import SearchBar from '../components/charger/SearchBar';
import ChargerList from '../components/charger/ChargerList';
import { useChargerData } from '../hooks/useChargerData';
import { useFavorites } from '../hooks/useFavorites';
import { getStatColor, getStationStats, getStationRepresentativeStat } from '../types/charger';
import { supabase } from '../lib/supabase';
import StationCommunity from '../components/charger/StationCommunity';
import { useAppContext } from '../contexts/AppContext';
import { CompareContext } from '../components/layout/DashboardLayout';
import { getStatLabel } from '../types/charger';
import { useTranslation } from '../hooks/useTranslation';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { settings, addNotification } = useAppContext();
  const [userId, setUserId] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites(userId);
  const { t } = useTranslation();

  const compare = useContext(CompareContext);

  const handleStatusChange = React.useCallback((stationId: string, stationName: string, oldStat: string, newStat: string) => {
    if (!settings.notifications.enabled || !settings.notifications.favoriteStatusChange) return;
    if (!isFavorite(stationId)) return;

    const isNowAvailable = newStat === '2';
    const isInUse = newStat === '3';
    const statusLabel = getStatLabel(newStat);

    let message = `${stationName} 상태가 '${statusLabel}'(으)로 변경되었습니다.`;
    if (isNowAvailable) message = `${stationName} 충전기에 빈자리가 생겼습니다.`;
    else if (isInUse) message = `${stationName} 충전기 자리가 모두 찼습니다 (충전중).`;

    addNotification({
      type: isNowAvailable ? 'available' : isInUse ? 'unavailable' : 'status_change',
      stationId,
      stationName,
      message,
    });
  }, [settings.notifications.enabled, settings.notifications.favoriteStatusChange, isFavorite, addNotification]);

  const {
    chargers, loading, statusLoading, error,
    zoomState, selectCity, selectDistrict, resetToCity, resetToDistrict,
    chargeFilter, setChargeFilter,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    selectedCharger, setSelectedCharger,
    filteredChargers, searchResults, districtSearchResults,
  } = useChargerData(handleStatusChange);

  // chargers가 업데이트될 때마다 DashboardLayout에 올려보내서 실시간 반영
  useEffect(() => {
    if (chargers.length > 0) {
      compare?.registerChargers(chargers);
    }
  }, [chargers]);

  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const stationId = searchParams.get('station');
    if (!stationId || chargers.length === 0) return;
    const found = chargers.find(c => c.id === stationId);
    if (found) {
      selectDistrict(found.district);
      setTimeout(() => {
        setSelectedCharger(found);
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

  const compareProps = {
    isInCompare: compare?.isInCompare ?? (() => false),
    onToggleCompare: (charger: typeof chargers[0]) => compare?.onToggleCompare(charger.id),
    canAddCompare: compare?.canAddCompare ?? true,
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold text-sm">{t('general.error')}</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      )}

      {showLoginToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold px-4 py-2.5 rounded-full shadow-xl">
          {t('charger.favoriteLoginToast')}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-[15px] shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100/80 dark:border-gray-800 flex-1 min-h-[500px] flex flex-col md:flex-row overflow-hidden relative mt-2 mb-2 transition-colors">

        {loading && chargers.length === 0 && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-teal-100 dark:border-teal-900 border-t-teal-400 dark:border-t-teal-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] font-bold text-gray-700 dark:text-gray-200">{t('charger.loadingMap')}</p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{t('charger.waitAMoment')}</p>
          </div>
        )}

        {!loading && statusLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-teal-100 dark:border-gray-700 flex items-center gap-2 pointer-events-none">
            <div className="w-3 h-3 border-[2.5px] border-teal-100 dark:border-teal-900 border-t-teal-400 dark:border-t-teal-500 rounded-full animate-spin"></div>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 tracking-tight">{t('charger.syncingStatus')}</span>
          </div>
        )}

        <div className="flex-1 relative flex flex-col min-h-[400px]">
          <div className="relative z-10 w-full border-b border-gray-100 dark:border-gray-800">
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
            <button onClick={resetToCity} className="absolute top-[60px] left-4 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold text-[13px] hover:pr-5 group">
              <svg className="text-gray-400 dark:text-gray-500 group-hover:-translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {t('charger.viewAllJeju')}
            </button>
          )}

          {zoomState.level === 'station' && (
            <button onClick={resetToDistrict} className="absolute top-[60px] left-4 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-extrabold text-[13px] hover:pr-5 group">
              <svg className="text-gray-500 dark:text-gray-400 group-hover:-translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {zoomState.selectedCity} {t('charger.viewCityAndBack')}
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
            const inCompare = compare?.isInCompare(selectedCharger.id) ?? false;
            const canAdd = compare?.canAddCompare ?? true;
            return (
              <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[340px] md:right-auto z-20">
                <div className="bg-white dark:bg-gray-900 rounded-[15px] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-tight flex-1 mr-2">{selectedCharger.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* 즐겨찾기 */}
                        <button onClick={() => handleToggleFavorite(selectedCharger)} className="p-1.5 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24"
                            fill={fav ? '#f59e0b' : 'none'}
                            stroke={fav ? '#f59e0b' : '#9ca3af'}
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                        {/* 비교 버튼 — 원형 플러스/체크로 통일 */}
                        <button
                          onClick={() => compare?.onToggleCompare(selectedCharger.id)}
                          title={inCompare ? '비교에서 제거' : canAdd ? '비교에 추가' : '최대 3개까지 비교 가능'}
                          className={`p-1.5 rounded-full transition-colors ${
                            inCompare
                              ? 'text-teal-500 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100'
                              : canAdd
                              ? 'text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                              : 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                          }`}
                        >
                          {inCompare ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="9 12 11 14 15 10"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="16"/>
                              <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                          )}
                        </button>
                        {/* 닫기 */}
                        <button onClick={() => setSelectedCharger(null)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">{selectedCharger.address}</p>
                      <button
                        onClick={() => {
                          const dest = encodeURIComponent(selectedCharger.name);
                          window.open(`https://map.kakao.com/link/search/${dest}`, '_blank');
                        }}
                        className="ml-2 flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-black text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {t('charger.direction')}
                      </button>
                    </div>
                    <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-3 border border-gray-100/50 dark:border-gray-700">
                      <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                        {t('charger.availableNow')}
                        <span className="w-2 h-2 rounded-full" style={{ background: getStatColor(repStat) }}></span>
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 items-center">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">{t('charger.fast')}</span>
                          <span className={stats.fastAvail > 0 ? "text-teal-500 font-extrabold" : "text-gray-300 dark:text-gray-600 font-extrabold"}>{stats.fastAvail}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-[10px]">/ {stats.fastTotal}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">{t('charger.slow')}</span>
                          <span className={stats.slowAvail > 0 ? "text-teal-500 font-extrabold" : "text-gray-300 dark:text-gray-600 font-extrabold"}>{stats.slowAvail}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-[10px]">/ {stats.slowTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <StationCommunity stationId={selectedCharger.id} stationName={selectedCharger.name} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 데스크탑 충전소 목록 */}
        <div className="w-[320px] border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hidden md:flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/50">
            <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-[13px]">{t('charger.listTitle')}</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t('charger.total')} <span className="text-teal-500 font-bold">{filteredChargers.length}</span>{t('charger.stations')}</p>
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
                {...compareProps}
              />
            </div>
          </div>
        </div>

        {/* 모바일 충전소 목록 시트 */}
        <div className={`md:hidden absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] rounded-t-[20px] ${isListExpanded ? 'h-[65vh]' : 'h-[60px]'}`}>
          <div className="w-full h-10 flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsListExpanded(!isListExpanded)}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{isListExpanded ? 'Close List' : 'View List'}</span>
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-hidden relative border-t border-gray-50 dark:border-gray-800/50">
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
                {...compareProps}
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
