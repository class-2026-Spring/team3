import React, { useState } from 'react';
import { Charger, getStatColor, getStatLabel, getStationRepresentativeStat } from '../../types/charger';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Charger[];
  onSelectCharger: (charger: Charger) => void;
}

export default function SearchBar({ searchQuery, setSearchQuery, searchResults, onSelectCharger }: SearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSelect = (charger: Charger) => {
    setSearchQuery('');
    setSearchFocused(false);
    onSelectCharger(charger);
  };

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 relative z-20">
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all shadow-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#9ca3af" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          placeholder="충전소명 또는 주소를 검색해 보세요"
          className="flex-1 text-[15px] bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 p-1">
            ✕
          </button>
        )}
      </div>

      {searchFocused && searchResults.length > 0 && (
        <div className="absolute left-4 right-4 top-16 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
          {searchResults.map(charger => {
            const repStat = getStationRepresentativeStat(charger.chargers);
            return (
              <div
                key={charger.id}
                onMouseDown={() => handleSelect(charger)}
                className="px-4 py-3.5 hover:bg-blue-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">{charger.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{charger.address}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 border"
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
        </div>
      )}
    </div>
  );
}
