'use client';

import React, { useState } from 'react';
import Header from '../components/layout/Header';
import KakaoMap from '../components/map/Kakao';
import SearchBar from '../components/charger/SearchBar';
import ChargerList from '../components/charger/ChargerList';
import { useChargerData } from '../hooks/useChargerData';
import { Charger, getStatColor, getStatLabel, isFastCharger, getStationStats, getStationRepresentativeStat } from '../types/charger';

export default function Home() {
  const {
    chargers,
    loading,
    statusLoading,
    error,
    districts,
    activeDistrict,
    setActiveDistrict,
    chargeFilter,
    setChargeFilter,
    searchQuery,
    setSearchQuery,
    selectedCharger,
    setSelectedCharger,
    filteredChargers,
    searchResults
  } = useChargerData();

  const [isListExpanded, setIsListExpanded] = useState(false);

  return (
    <main className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <Header totalCount={filteredChargers.length} />

      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectCharger={(c) => {
          setSelectedCharger(c);
          setActiveDistrict(c.district);
        }}
      />

      {loading && chargers.length === 0 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-bold text-gray-700">제주 지역 3,189개 충전소 위치를 불러오는 중...</p>
          <p className="mt-1 text-xs text-gray-500">잠시만 기다려주세요</p>
        </div>
      )}

      {!loading && statusLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-blue-100 flex items-center gap-2 pointer-events-none">
          <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-blue-600 tracking-tight">실시간 상태 동기화 중...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white p-4 text-center">
          <div>
            <p className="text-red-500 font-bold mb-2">오류가 발생했습니다</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      )}

      {/* 메인 레이아웃 (지도 + 리스트) */}
      <div className="flex-1 relative flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* 지도 영역 */}
        <div className="flex-1 h-full relative">
          <KakaoMap 
            chargers={filteredChargers}
            activeDistrict={activeDistrict}
            setActiveDistrict={setActiveDistrict}
            selectedCharger={selectedCharger}
            setSelectedCharger={setSelectedCharger}
          />
          
          {/* 선택된 충전소 요약 카드 (모바일 지도 위 플로팅) */}
          {selectedCharger && (() => {
            const stats = getStationStats(selectedCharger.chargers);
            const repStat = getStationRepresentativeStat(selectedCharger.chargers);
            
            return (
            <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[340px] md:right-auto z-20">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-lg font-bold text-gray-900">{selectedCharger.name}</p>
                    <button onClick={() => setSelectedCharger(null)} className="p-1 -mr-2 -mt-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{selectedCharger.address}</p>
                  
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                      현재 충전 가능
                      <span className="w-2 h-2 rounded-full" style={{ background: getStatColor(repStat) }}></span>
                    </p>
                    <div className="flex items-center gap-3 text-[15px] font-medium">
                      <div className="flex gap-1.5">
                        <span className="text-gray-500">급속</span>
                        <span className={stats.fastAvail > 0 ? "text-blue-600 font-bold" : "text-gray-300 font-bold"}>{stats.fastAvail}</span>
                        <span className="text-gray-400 text-xs mt-1">/ {stats.fastTotal}</span>
                      </div>
                      <div className="w-px h-3.5 bg-gray-300"></div>
                      <div className="flex gap-1.5">
                        <span className="text-gray-500">완속</span>
                        <span className={stats.slowAvail > 0 ? "text-blue-600 font-bold" : "text-gray-300 font-bold"}>{stats.slowAvail}</span>
                        <span className="text-gray-400 text-xs mt-1">/ {stats.slowTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>

        {/* 리스트 영역 (모바일: 하단 시트, 데스크탑: 우측 사이드바) */}
        <div className={`
          absolute bottom-0 left-0 right-0 z-10 transition-transform duration-300 ease-in-out
          md:relative md:w-96 md:transform-none bg-white md:border-l md:border-gray-200
          ${isListExpanded ? 'h-[60vh] translate-y-0' : 'h-[35vh] translate-y-0'}
        `}>
          {/* 모바일 핸들 (드래그용 느낌) */}
          <div 
            className="md:hidden w-full h-6 flex items-center justify-center bg-white rounded-t-2xl absolute -top-6 left-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] cursor-pointer"
            onClick={() => setIsListExpanded(!isListExpanded)}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          <ChargerList 
            chargers={filteredChargers}
            districts={districts}
            activeDistrict={activeDistrict}
            setActiveDistrict={(d) => {
              setActiveDistrict(d);
              setSelectedCharger(null);
            }}
            chargeFilter={chargeFilter}
            setChargeFilter={setChargeFilter}
            onSelectCharger={setSelectedCharger}
          />
        </div>

      </div>
    </main>
  );
}