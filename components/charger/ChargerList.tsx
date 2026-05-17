import React from 'react';
import { Charger, FilterType, getStatColor, getStatLabel, getStationRepresentativeStat, getStationStats, isFastCharger } from '../../types/charger';
import { ZoomState, getCity } from '../../hooks/useChargerData';

interface ChargerListProps {
  chargers: Charger[];        // filteredChargers (현재 줌 레벨에 맞는)
  allChargers: Charger[];     // 전체 원본
  zoomState: ZoomState;
  selectCity: (city: '전체' | '제주시' | '서귀포시') => void;
  selectDistrict: (district: string) => void;
  resetToCity: () => void;
  resetToDistrict: () => void;
  chargeFilter: FilterType;
  setChargeFilter: (f: FilterType) => void;
  onSelectCharger: (charger: Charger) => void;
}

export default function ChargerList({
  chargers,
  allChargers,
  zoomState,
  selectCity,
  selectDistrict,
  resetToCity,
  resetToDistrict,
  chargeFilter,
  setChargeFilter,
  onSelectCharger,
}: ChargerListProps) {
  const { level, selectedCity, selectedDistrict } = zoomState;

  // ── LEVEL 1: 시 단위 요약 ──────────────────────────────────
  if (level === 'city') {
    const jejuList = allChargers.filter(c => getCity(c.district) === '제주시');
    const seoList  = allChargers.filter(c => getCity(c.district) === '서귀포시');

    return (
      <div className="flex flex-col bg-white h-full">
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} />
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50 flex flex-col gap-3">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">시 선택</p>
          {[
            { name: '제주시', list: jejuList, color: '#3b82f6' },
            { name: '서귀포시', list: seoList, color: '#14b8a6' },
          ].map(({ name, list, color }) => {
            const fast = list.filter(c => c.chargers.some(p => isFastCharger(p.type))).length;
            const slow = list.filter(c => c.chargers.some(p => !isFastCharger(p.type))).length;
            return (
              <div
                key={name}
                onClick={() => selectCity(name as '제주시' | '서귀포시')}
                className="p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-[15px] font-extrabold text-gray-900">{name}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 group-hover:text-blue-500 transition-colors">
                    선택 →
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[20px] font-black text-gray-800">{list.length}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">전체 충전소</p>
                  </div>
                  <div className="flex-1 bg-orange-50 rounded-lg p-2.5 text-center">
                    <p className="text-[20px] font-black text-orange-500">{fast}</p>
                    <p className="text-[10px] font-semibold text-orange-400 mt-0.5">급속</p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-2.5 text-center">
                    <p className="text-[20px] font-black text-blue-500">{slow}</p>
                    <p className="text-[10px] font-semibold text-blue-400 mt-0.5">완속</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── LEVEL 2: 읍면동 단위 목록 ──────────────────────────────
  if (level === 'district') {
    // 선택된 시 내의 읍면동 그룹핑
    const cityChargers = allChargers.filter(c =>
      selectedCity === '전체' || getCity(c.district) === selectedCity
    );
    const districtGroups: Record<string, Charger[]> = {};
    cityChargers.forEach(c => {
      if (!districtGroups[c.district]) districtGroups[c.district] = [];
      districtGroups[c.district].push(c);
    });
    const sortedDistricts = Object.entries(districtGroups).sort((a, b) => b[1].length - a[1].length);

    return (
      <div className="flex flex-col bg-white h-full">
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              onClick={resetToCity}
              className="flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-teal-600 transition-colors"
            >
              ← 전체
            </button>
            <span className="text-gray-200">/</span>
            <span className="text-[12px] font-bold text-gray-700">{selectedCity}</span>
          </div>
          <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} />
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            읍면동 선택 ({sortedDistricts.length}개)
          </p>
          <div className="flex flex-col gap-2">
            {sortedDistricts.map(([districtName, list]) => {
              const fast = list.filter(c => c.chargers.some(p => isFastCharger(p.type))).length;
              const slow = list.filter(c => c.chargers.some(p => !isFastCharger(p.type))).length;
              return (
                <div
                  key={districtName}
                  onClick={() => selectDistrict(districtName)}
                  className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between cursor-pointer hover:border-teal-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{districtName}</p>
                    <div className="flex gap-1.5 mt-1">
                      {fast > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-500 border border-orange-100">
                          급속 {fast}
                        </span>
                      )}
                      {slow > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">
                          완속 {slow}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-black text-teal-500">{list.length}</p>
                    <p className="text-[10px] text-gray-400">충전소</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── LEVEL 3: 개별 충전소 목록 ──────────────────────────────
  return (
    <div className="flex flex-col bg-white h-full">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <button onClick={resetToCity} className="text-[12px] font-semibold text-gray-400 hover:text-teal-600 transition-colors">
            ← 전체
          </button>
          <span className="text-gray-200">/</span>
          <button onClick={resetToDistrict} className="text-[12px] font-semibold text-gray-400 hover:text-teal-600 transition-colors">
            {selectedCity}
          </button>
          <span className="text-gray-200">/</span>
          <span className="text-[12px] font-bold text-gray-700">{selectedDistrict}</span>
        </div>
        <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} />
      </div>

      <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
        <p className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {selectedDistrict}
          <span className="text-teal-500 font-extrabold ml-1">{chargers.length}</span>곳
        </p>

        {chargers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <p className="text-sm font-medium">해당 지역에 충전소가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {chargers.slice(0, 100).map(charger => {
              const repStat = getStationRepresentativeStat(charger.chargers);
              const stats = getStationStats(charger.chargers);
              return (
                <div
                  key={charger.id}
                  onClick={() => onSelectCharger(charger)}
                  className="p-3.5 rounded-xl border border-gray-200/60 bg-white flex justify-between items-center cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-gray-900 group-hover:text-teal-600 transition-colors truncate">{charger.name}</p>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getStatColor(repStat) }}/>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{charger.address}</p>
                    <div className="flex gap-2 mt-1.5">
                      {stats.fastTotal > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                          급속 {stats.fastAvail}/{stats.fastTotal}
                        </span>
                      )}
                      {stats.slowTotal > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                          완속 {stats.slowAvail}/{stats.slowTotal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <span className="text-[12px] font-bold" style={{ color: getStatColor(repStat) }}>
                      {getStatLabel(repStat)}
                    </span>
                  </div>
                </div>
              );
            })}
            {chargers.length > 100 && (
              <p className="py-4 text-center text-xs text-gray-400 font-medium">
                100개까지만 표시됩니다. 지도를 활용해 주세요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 필터 탭 공통 컴포넌트
function FilterTabs({ chargeFilter, setChargeFilter }: { chargeFilter: FilterType; setChargeFilter: (f: FilterType) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
        {(['전체', '급속', '완속'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setChargeFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
              chargeFilter === f
                ? 'bg-white text-teal-600 shadow-sm border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        {[['2','사용가능'],['3','충전중'],['4','중지']].map(([stat, label]) => (
          <div key={stat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: getStatColor(stat) }}/>
            <span className="text-[10px] font-medium text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}