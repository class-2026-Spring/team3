import React from 'react';
import { Charger, FilterType, getStatColor, getStatLabel, getStationRepresentativeStat, getStationStats, isFastCharger } from '../../types/charger';
import { ZoomState, getCity } from '../../hooks/useChargerData';

interface ChargerListProps {
  chargers: Charger[];
  zoomState: ZoomState;
  selectCity: (city: '전체' | '제주시' | '서귀포시') => void;
  selectDistrict: (district: string) => void;
  resetToCity: () => void;
  resetToDistrict: () => void;
  chargeFilter: FilterType;
  setChargeFilter: (f: FilterType) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (charger: Charger) => void;
  statusFilter: '전체' | '사용가능' | '충전중' | '중지';
  setStatusFilter: (f: '전체' | '사용가능' | '충전중' | '중지') => void;
}

export default function ChargerList({
  chargers, zoomState,
  selectCity, selectDistrict, resetToCity, resetToDistrict,
  chargeFilter, setChargeFilter, onSelectCharger,
  isFavorite, onToggleFavorite,
  statusFilter, setStatusFilter
}: ChargerListProps) {
  const { level, selectedCity, selectedDistrict } = zoomState;

  // chargers prop은 이미 chargeFilter가 적용된 filteredChargers임
  // level별로 그룹화에만 사용

  // ── LEVEL 1: 시 단위 ──────────────────────────────────────
  if (level === 'city') {
    const jejuList = chargers.filter(c => getCity(c.district) === '제주시');
    const seoList = chargers.filter(c => getCity(c.district) === '서귀포시');

    return (
      <div className="flex flex-col bg-white h-full">
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} zoomState={zoomState} selectCity={selectCity} resetToCity={resetToCity} />
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
              <div key={name} onClick={() => selectCity(name as '제주시' | '서귀포시')}
                className="p-4 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-[15px] font-extrabold text-gray-900">{name}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 group-hover:text-blue-500 transition-colors">선택 →</span>
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

  // ── LEVEL 2: 읍면동 단위 ──────────────────────────────────
  if (level === 'district') {
    const cityChargers = chargers.filter(c =>
      selectedCity === '전체' || getCity(c.district) === selectedCity
    );
    const districtGroups: Record<string, Charger[]> = {};
    cityChargers.forEach(c => {
      if (!districtGroups[c.district]) districtGroups[c.district] = [];
      districtGroups[c.district].push(c);
    });

    // 즐겨찾기 포함 읍면동 상위 정렬
    const sortedDistricts = Object.entries(districtGroups).sort((a, b) => {
      const aHasFav = a[1].some(c => isFavorite(c.id));
      const bHasFav = b[1].some(c => isFavorite(c.id));
      if (aHasFav && !bHasFav) return -1;
      if (!aHasFav && bHasFav) return 1;
      return b[1].length - a[1].length;
    });

    return (
      <div className="flex flex-col bg-white h-full">
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={resetToCity} className="text-[12px] font-semibold text-gray-400 hover:text-teal-600 transition-colors">← 전체</button>
            <span className="text-gray-200">/</span>
            <span className="text-[12px] font-bold text-gray-700">{selectedCity}</span>
          </div>
          <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} zoomState={zoomState} selectCity={selectCity} resetToCity={resetToCity} />
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">읍면동 선택 ({sortedDistricts.length}개)</p>
          <div className="flex flex-col gap-2">
            {sortedDistricts.map(([districtName, list]) => {
              const fast = list.filter(c => c.chargers.some(p => isFastCharger(p.type))).length;
              const slow = list.filter(c => c.chargers.some(p => !isFastCharger(p.type))).length;
              const favCount = list.filter(c => isFavorite(c.id)).length;
              return (
                <div key={districtName} onClick={() => selectDistrict(districtName)}
                  className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between cursor-pointer hover:border-teal-300 hover:shadow-sm transition-all group">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{districtName}</p>
                      {favCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-500">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          {favCount}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {fast > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-500 border border-orange-100">급속 {fast}</span>}
                      {slow > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">완속 {slow}</span>}
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

  // ── LEVEL 3: 개별 충전소 (즐겨찾기 상위 정렬) ─────────────
  // 즐겨찾기 먼저, 나머지는 이름순
  const sortedChargers = [...chargers].sort((a, b) => {
    const aFav = isFavorite(a.id);
    const bFav = isFavorite(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col bg-white h-full">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <button onClick={resetToCity} className="text-[12px] font-semibold text-gray-400 hover:text-teal-600 transition-colors">← 전체</button>
          <span className="text-gray-200">/</span>
          <button onClick={resetToDistrict} className="text-[12px] font-semibold text-gray-400 hover:text-teal-600 transition-colors">{selectedCity}</button>
          <span className="text-gray-200">/</span>
          <span className="text-[12px] font-bold text-gray-700">{selectedDistrict}</span>
        </div>
        <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} zoomState={zoomState} selectCity={selectCity} resetToCity={resetToCity} />
      </div>
      <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
        <p className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {selectedDistrict} <span className="text-teal-500 font-extrabold ml-1">{chargers.length}</span>곳
        </p>

        {chargers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <p className="text-sm font-medium">해당 지역에 충전소가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sortedChargers.slice(0, 100).map(charger => {
              const repStat = getStationRepresentativeStat(charger.chargers);
              const stats = getStationStats(charger.chargers);
              const fav = isFavorite(charger.id);
              return (
                <div key={charger.id} onClick={() => onSelectCharger(charger)}
                  className={`p-3.5 rounded-xl border bg-white flex justify-between items-center cursor-pointer hover:shadow-md transition-all group ${fav ? 'border-yellow-200 bg-yellow-50/20' : 'border-gray-200/60 hover:border-teal-300'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-gray-900 group-hover:text-teal-600 transition-colors truncate">{charger.name}</p>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getStatColor(repStat) }} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{charger.address}</p>
                    <div className="flex gap-2 mt-1.5">
                      {stats.fastTotal > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100">급속 {stats.fastAvail}/{stats.fastTotal}</span>}
                      {stats.slowTotal > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">완속 {stats.slowAvail}/{stats.slowTotal}</span>}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0 flex flex-col items-end gap-1.5">
                    <button
                      onClick={e => { e.stopPropagation(); onToggleFavorite(charger); }}
                      className="p-1 rounded-full hover:bg-yellow-50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24"
                        fill={fav ? '#f59e0b' : 'none'}
                        stroke={fav ? '#f59e0b' : '#d1d5db'}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                    <span className="text-[12px] font-bold" style={{ color: getStatColor(repStat) }}>{getStatLabel(repStat)}</span>
                  </div>
                </div>
              );
            })}
            {chargers.length > 100 && (
              <p className="py-4 text-center text-xs text-gray-400 font-medium">100개까지만 표시됩니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type StatusType = '전체' | '사용가능' | '충전중' | '중지' | '점검';

function FilterTabs({
  chargeFilter, setChargeFilter,
  statusFilter, setStatusFilter,
  zoomState, selectCity, resetToCity
}: {
  chargeFilter: FilterType; setChargeFilter: (f: FilterType) => void;
  statusFilter: StatusType; setStatusFilter: (f: StatusType) => void;
  zoomState: ZoomState; selectCity: (c: '전체' | '제주시' | '서귀포시') => void; resetToCity: () => void;
}) {
  const currentCity = zoomState.selectedCity === '전체' && zoomState.level === 'city' ? '전체' : zoomState.selectedCity;

  const handleCityChange = (val: string) => {
    if (val === '전체') resetToCity();
    else selectCity(val as '제주시' | '서귀포시');
  };

  return (
    <div className="flex gap-2 w-full">
      {/* 지역 필터 */}
      <div className="relative flex-1">
        <select value={currentCity} onChange={(e) => handleCityChange(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200/80 text-gray-700 text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all hover:bg-gray-100"
        >
          <option value="전체">지역</option>
          <option value="제주시">제주시</option>
          <option value="서귀포시">서귀포시</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* 유형 필터 */}
      <div className="relative flex-1">
        <select value={chargeFilter} onChange={(e) => setChargeFilter(e.target.value as FilterType)}
          className="w-full appearance-none bg-gray-50 border border-gray-200/80 text-gray-700 text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all hover:bg-gray-100"
        >
          <option value="전체">유형</option>
          <option value="급속">급속</option>
          <option value="완속">완속</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="relative flex-[1.2]">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusType)}
          className="w-full appearance-none bg-gray-50 border border-gray-200/80 text-gray-700 text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all hover:bg-gray-100"
        >
          <option value="전체">상태</option>
          <option value="사용가능">🟢 사용가능</option>
          <option value="충전중">🔵 충전중</option>
          <option value="중지">🔴 중지</option>
          <option value="점검">🟠 점검</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
}