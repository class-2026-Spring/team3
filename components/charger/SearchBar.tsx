'use client';

import React, { useState, useEffect } from 'react';
import { Charger, getStatColor, getStatLabel, getStationRepresentativeStat } from '../../types/charger';
import { useTranslation } from '../../hooks/useTranslation';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 5;

interface SearchHistory {
  type: 'charger' | 'district';
  label: string;
  subLabel?: string;
  charger?: Charger;
  district?: string;
}

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Charger[];
  districtSearchResults: string[];
  onSelectCharger: (charger: Charger) => void;
  onSelectDistrict: (district: string) => void;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  searchResults,
  districtSearchResults,
  onSelectCharger,
  onSelectDistrict,
}: SearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (item: SearchHistory) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.label !== item.label);
      const updated = [item, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeHistory = (label: string) => {
    setHistory(prev => {
      const updated = prev.filter(h => h.label !== label);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleSelectCharger = (charger: Charger) => {
    saveHistory({ type: 'charger', label: charger.name, subLabel: charger.address, charger });
    setSearchQuery('');
    setSearchFocused(false);
    onSelectCharger(charger);
  };

  const handleSelectDistrict = (district: string) => {
    saveHistory({ type: 'district', label: district, district });
    setSearchQuery('');
    setSearchFocused(false);
    onSelectDistrict(district);
  };

  const handleSelectFromHistory = (item: SearchHistory) => {
    if (item.type === 'charger' && item.charger) onSelectCharger(item.charger);
    if (item.type === 'district' && item.district) onSelectDistrict(item.district);
    setSearchFocused(false);
  };

  const hasResults = districtSearchResults.length > 0 || searchResults.length > 0;
  const showHistory = searchFocused && !searchQuery && history.length > 0;
  const showResults = searchFocused && !!searchQuery && hasResults;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 relative z-20 transition-colors">
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700 focus-within:border-teal-400 dark:focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-400 transition-all shadow-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" className="text-gray-400 dark:text-gray-500" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" className="text-gray-400 dark:text-gray-500" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          placeholder={t('charger.searchPlaceholder')}
          className="flex-1 text-[15px] bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            ✕
          </button>
        )}
      </div>

      {/* 최근 검색 기록 */}
      {showHistory && (
        <div className="absolute left-4 right-4 top-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">최근 검색</span>
            <button
              onMouseDown={clearHistory}
              className="text-[11px] text-gray-400 hover:text-red-400 transition-colors"
            >
              전체 삭제
            </button>
          </div>
          {history.map(item => (
            <div
              key={item.label}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors flex items-center gap-3"
            >
              <div
                onMouseDown={() => handleSelectFromHistory(item)}
                className="flex items-center gap-3 flex-1"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  {item.type === 'district' ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100">{item.label}</p>
                  {item.subLabel && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.subLabel}</p>
                  )}
                </div>
              </div>
              <button
                onMouseDown={(e) => { e.stopPropagation(); removeHistory(item.label); }}
                className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 p-1 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 검색 결과 */}
      {showResults && (
        <div className="absolute left-4 right-4 top-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto z-50">

          {/* 지역(읍면동) 검색 결과 */}
          {districtSearchResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">지역</span>
              </div>
              {districtSearchResults.map(district => (
                <div
                  key={district}
                  onMouseDown={() => handleSelectDistrict(district)}
                  className="px-4 py-3 hover:bg-teal-50/60 dark:hover:bg-teal-900/30 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-800 dark:text-gray-100">{district}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">지역으로 이동</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 충전소 검색 결과 */}
          {searchResults.length > 0 && (
            <>
              {districtSearchResults.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 border-t">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">충전소</span>
                </div>
              )}
              {searchResults.map(charger => {
                const repStat = getStationRepresentativeStat(charger.chargers);
                return (
                  <div
                    key={charger.id}
                    onMouseDown={() => handleSelectCharger(charger)}
                    className="px-4 py-3.5 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{charger.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{charger.address}</p>
                        <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 mt-0.5 inline-block">{charger.district}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 border ml-3"
                        style={{
                          background: getStatColor(repStat) + '15',
                          color: getStatColor(repStat),
                          borderColor: getStatColor(repStat) + '30'
                        }}>
                        {getStatLabel(repStat)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
