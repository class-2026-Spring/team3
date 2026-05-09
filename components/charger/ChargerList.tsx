import React from 'react';
import { Charger, FilterType, getStatColor, getStatLabel, getStationRepresentativeStat, getStationStats } from '../../types/charger';

interface ChargerListProps {
  chargers: Charger[];
  districts: string[];
  activeDistrict: string;
  setActiveDistrict: (d: string) => void;
  chargeFilter: FilterType;
  setChargeFilter: (f: FilterType) => void;
  onSelectCharger: (charger: Charger) => void;
}

export default function ChargerList({
  chargers,
  districts,
  activeDistrict,
  setActiveDistrict,
  chargeFilter,
  setChargeFilter,
  onSelectCharger
}: ChargerListProps) {

  // 중복되는 충전소 이름끼리 묶어주기 (동일 주소의 완속/급속 여러 개 있는 경우 병합 시각화 가능, 여기선 단순 리스트 표시)
  return (
    <div className="flex flex-col bg-white h-full border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] relative z-10">
      
      {/* 필터 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
            {(['전체', '급속', '완속'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setChargeFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chargeFilter === f
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {[['2','사용가능'],['3','충전중'],['4','중지']].map(([stat, label]) => (
              <div key={stat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: getStatColor(stat) }}/>
                <span className="text-[11px] font-medium text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 행정구역 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['전체', ...districts].map(district => (
            <button
              key={district}
              onClick={() => setActiveDistrict(district)}
              className={`text-[13px] px-3.5 py-1.5 rounded-full whitespace-nowrap shrink-0 border font-medium transition-all ${
                activeDistrict === district
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {district}
            </button>
          ))}
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
        <p className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          {activeDistrict === '전체' ? '제주 전체' : activeDistrict} 
          <span className="text-blue-500 font-extrabold">{chargers.length}</span>곳
        </p>
        
        {chargers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p className="text-sm font-medium">해당 지역에 충전소가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* 성능을 위해 최대 100개까지만 렌더링 */}
            {chargers.slice(0, 100).map(charger => {
              const repStat = getStationRepresentativeStat(charger.chargers);
              const stats = getStationStats(charger.chargers);
              
              return (
              <div
                key={charger.id}
                onClick={() => onSelectCharger(charger)}
                className="p-3.5 rounded-xl border border-gray-200/60 bg-white flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{charger.name}</p>
                    <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: getStatColor(repStat) }}/>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-1 line-clamp-1">{charger.address}</p>
                  <div className="flex gap-2 mt-2">
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
                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600">{charger.district}</span>
                  <span className="text-[12px] font-bold mt-1" style={{ color: getStatColor(repStat) }}>
                    {getStatLabel(repStat)}
                  </span>
                </div>
              </div>
            );
          })}
            {chargers.length > 100 && (
              <div className="py-4 text-center text-xs text-gray-400 font-medium">
                목록이 너무 많아 100개까지만 표시됩니다. 지도를 활용해 주세요.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
