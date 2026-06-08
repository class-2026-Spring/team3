import React from 'react';
import { Charger, FilterType, getStatColor, getStatLabel, getStationRepresentativeStat, getStationStats, isFastCharger } from '../../types/charger';
import { ZoomState, getCity } from '../../hooks/useChargerData';
import { useTranslation } from '../../hooks/useTranslation';

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
  // 비교 기능
  isInCompare: (id: string) => boolean;
  onToggleCompare: (charger: Charger) => void;
  canAddCompare: boolean;
}

export default function ChargerList({
  chargers, zoomState,
  selectCity, selectDistrict, resetToCity, resetToDistrict,
  chargeFilter, setChargeFilter, onSelectCharger,
  isFavorite, onToggleFavorite,
  statusFilter, setStatusFilter,
  isInCompare, onToggleCompare, canAddCompare,
}: ChargerListProps) {
  const { level, selectedCity, selectedDistrict } = zoomState;
  const { t } = useTranslation();

  // ── LEVEL 1: 시 단위 ──────────────────────────────────────
  if (level === 'city') {
    const jejuList = chargers.filter(c => getCity(c.district) === '제주시');
    const seoList = chargers.filter(c => getCity(c.district) === '서귀포시');

    return (
      <div className="flex flex-col bg-white dark:bg-gray-900 h-full transition-colors">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} zoomState={zoomState} selectCity={selectCity} resetToCity={resetToCity} t={t} />
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-800/30 flex flex-col gap-3">
          <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">시 선택</p>
          {[
            { name: '제주시', list: jejuList, color: '#3b82f6' },
            { name: '서귀포시', list: seoList, color: '#14b8a6' },
          ].map(({ name, list, color }) => {
            const fast = list.filter(c => c.chargers.some(p => isFastCharger(p.type))).length;
            const slow = list.filter(c => c.chargers.some(p => !isFastCharger(p.type))).length;
            return (
              <div key={name} onClick={() => selectCity(name as '제주시' | '서귀포시')}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100">{name}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors">선택 →</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 text-center border border-gray-100 dark:border-gray-700">
                    <p className="text-[20px] font-black text-gray-800 dark:text-gray-200">{list.length}</p>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">전체 충전소</p>
                  </div>
                  <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5 text-center border border-orange-100 dark:border-orange-900/50">
                    <p className="text-[20px] font-black text-orange-500 dark:text-orange-400">{fast}</p>
                    <p className="text-[10px] font-semibold text-orange-400 dark:text-orange-500 mt-0.5">급속</p>
                  </div>
                  <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 text-center border border-blue-100 dark:border-blue-900/50">
                    <p className="text-[20px] font-black text-blue-500 dark:text-blue-400">{slow}</p>
                    <p className="text-[10px] font-semibold text-blue-400 dark:text-blue-500 mt-0.5">완속</p>
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

    const sortedDistricts = Object.entries(districtGroups).sort((a, b) => {
      const aHasFav = a[1].some(c => isFavorite(c.id));
      const bHasFav = b[1].some(c => isFavorite(c.id));
      if (aHasFav && !bHasFav) return -1;
      if (!aHasFav && bHasFav) return 1;
      return b[1].length - a[1].length;
    });

    return (
      <div className="flex flex-col bg-white dark:bg-gray-900 h-full transition-colors">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={resetToCity} className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">← 전체</button>
            <span className="text-gray-200 dark:text-gray-700">/</span>
            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{selectedCity}</span>
          </div>
          <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} zoomState={zoomState} selectCity={selectCity} resetToCity={resetToCity} t={t} />
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">읍면동 선택 ({sortedDistricts.length}개)</p>
          <div className="flex flex-col gap-2">
            {sortedDistricts.map(([districtName, list]) => {
              const fast = list.filter(c => c.chargers.some(p => isFastCharger(p.type))).length;
              const slow = list.filter(c => c.chargers.some(p => !isFastCharger(p.type))).length;
              const favCount = list.filter(c => isFavorite(c.id)).length;
              return (
                <div key={districtName} onClick={() => selectDistrict(districtName)}
                  className="px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all group">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{districtName}</p>
                      {favCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-500">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          {favCount}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {fast > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-800">급속 {fast}</span>}
                      {slow > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-800">완속 {slow}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-black text-teal-500 dark:text-teal-400">{list.length}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">충전소</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── LEVEL 3: 개별 충전소 ──────────────────────────────────
  const sortedChargers = [...chargers].sort((a, b) => {
    const aFav = isFavorite(a.id);
    const bFav = isFavorite(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 h-full transition-colors">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <button onClick={resetToCity} className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">← 전체</button>
          <span className="text-gray-200 dark:text-gray-700">/</span>
          <button onClick={resetToDistrict} className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">{selectedCity}</button>
          <span className="text-gray-200 dark:text-gray-700">/</span>
          <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{selectedDistrict}</span>
        </div>
        <FilterTabs chargeFilter={chargeFilter} setChargeFilter={setChargeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} zoomState={zoomState} selectCity={selectCity} resetToCity={resetToCity} t={t} />
      </div>
      <div className="p-4 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-800/30">
        <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {selectedDistrict} <span className="text-teal-500 font-extrabold ml-1">{chargers.length}</span>곳
        </p>

        {chargers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">해당 지역에 충전소가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sortedChargers.slice(0, 100).map(charger => {
              const repStat = getStationRepresentativeStat(charger.chargers);
              const stats = getStationStats(charger.chargers);
              const fav = isFavorite(charger.id);
              const inCompare = isInCompare(charger.id);
              return (
                <div key={charger.id} onClick={() => onSelectCharger(charger)}
                  className={`p-3.5 rounded-xl border bg-white dark:bg-gray-800 flex justify-between items-center cursor-pointer hover:shadow-md transition-all group ${
                    inCompare
                      ? 'border-teal-300 dark:border-teal-600 ring-1 ring-teal-200 dark:ring-teal-800'
                      : fav
                      ? 'border-yellow-200 dark:border-yellow-700/50 bg-yellow-50/20 dark:bg-yellow-900/10'
                      : 'border-gray-200/60 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">{charger.name}</p>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getStatColor(repStat) }} />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{charger.address}</p>
                    <div className="flex gap-2 mt-1.5">
                      {stats.fastTotal > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800">급속 {stats.fastAvail}/{stats.fastTotal}</span>}
                      {stats.slowTotal > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">완속 {stats.slowAvail}/{stats.slowTotal}</span>}
                    </div>
                  </div>
                  <div className="ml-2 shrink-0 flex flex-col items-end gap-1.5">
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={e => { e.stopPropagation(); onToggleFavorite(charger); }}
                      className="p-1 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24"
                        fill={fav ? '#f59e0b' : 'none'}
                        stroke={fav ? '#f59e0b' : '#d1d5db'}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                    {/* 비교 버튼 */}
                    <button
                      onClick={e => { e.stopPropagation(); onToggleCompare(charger); }}
                      title={inCompare ? '비교에서 제거' : canAddCompare ? '비교에 추가' : '최대 3개까지 비교 가능'}
                      className={`p-1 rounded-full transition-colors ${
                        inCompare
                          ? 'text-teal-500 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100'
                          : canAddCompare
                          ? 'text-gray-300 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                          : 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {inCompare ? (
                        // 제거 아이콘 (체크)
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        // 추가 아이콘 (⊕)
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                      )}
                    </button>
                    <span className="text-[12px] font-bold" style={{ color: getStatColor(repStat) }}>{getStatLabel(repStat)}</span>
                  </div>
                </div>
              );
            })}
            {chargers.length > 100 && (
              <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">100개까지만 표시됩니다.</p>
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
  zoomState, selectCity, resetToCity, t
}: {
  chargeFilter: FilterType; setChargeFilter: (f: FilterType) => void;
  statusFilter: StatusType; setStatusFilter: (f: StatusType) => void;
  zoomState: ZoomState; selectCity: (c: '전체' | '제주시' | '서귀포시') => void; resetToCity: () => void;
  t: (key: string) => string;
}) {
  const currentCity = zoomState.selectedCity === '전체' && zoomState.level === 'city' ? '전체' : zoomState.selectedCity;

  const handleCityChange = (val: string) => {
    if (val === '전체') resetToCity();
    else selectCity(val as '제주시' | '서귀포시');
  };

  return (
    <div className="flex gap-2 w-full">
      <div className="relative flex-1">
        <select value={currentCity} onChange={(e) => handleCityChange(e.target.value)}
          className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <option value="전체">지역</option>
          <option value="제주시">제주시</option>
          <option value="서귀포시">서귀포시</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400 dark:text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div className="relative flex-1">
        <select value={chargeFilter} onChange={(e) => setChargeFilter(e.target.value as FilterType)}
          className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <option value="전체">유형</option>
          <option value="급속">급속</option>
          <option value="완속">완속</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400 dark:text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div className="relative flex-[1.2]">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusType)}
          className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <option value="전체">상태</option>
          <option value="사용가능">🟢 (사용가능)</option>
          <option value="충전중">🔵 (충전중)</option>
          <option value="중지">🔴 (중지)</option>
          <option value="점검">🟠 (점검)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400 dark:text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
}
