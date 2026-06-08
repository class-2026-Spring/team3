'use client';
// components/charger/ComparePanel.tsx

import React from 'react';
import { Charger, getStatColor, getStatLabel, getStationRepresentativeStat, getStationStats, isFastCharger } from '../../types/charger';

interface ComparePanelProps {
  compareList: Charger[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
}

// 두 좌표 간 거리 계산 (Haversine)
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function StatBadge({ label, value, sub, color, highlight }: {
  label: string; value: string | number; sub?: string; color?: string; highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-2.5 border text-center ${
      highlight
        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700'
        : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
    }`}>
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[16px] font-black leading-tight" style={{ color: color ?? '#1f2937' }}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ChargerCard({
  charger, onRemove, userLocation, rank, totalCount,
}: {
  charger: Charger;
  onRemove: () => void;
  userLocation: { lat: number; lng: number } | null;
  rank: { distance?: number; avail?: number };
  totalCount: number;
}) {
  const repStat = getStationRepresentativeStat(charger.chargers);
  const stats = getStationStats(charger.chargers);
  const statColor = getStatColor(repStat);
  const totalPorts = charger.chargers.length;
  const availPorts = charger.chargers.filter(c => c.stat === '2').length;

  const distance = userLocation
    ? calcDistance(userLocation.lat, userLocation.lng, charger.lat, charger.lng)
    : null;

  const typeLabels: Record<string, string> = {
    '01': 'DC차데모', '02': 'AC완속', '03': 'DC+AC3상',
    '04': 'DC콤보', '05': 'DC콤보+차데모', '06': 'DC콤보+차데모+AC3상', '07': '슈퍼차저',
  };
  const hasFast = stats.fastTotal > 0;
  const hasSlow = stats.slowTotal > 0;

  const isClosest = rank.distance === 0 && totalCount > 1;
  const isMostAvail = rank.avail === 0 && totalCount > 1 && availPorts > 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      {/* 헤더 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="flex items-center gap-1.5 mb-1 pr-6">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statColor }} />
          <p className="text-[12px] font-extrabold text-gray-900 dark:text-gray-100 truncate">{charger.name}</p>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 mb-2">{charger.address}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">{charger.district}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{ background: statColor + '15', color: statColor, borderColor: statColor + '30' }}>
            {getStatLabel(repStat)}
          </span>
        </div>
      </div>

      {/* 거리 */}
      <div className={`rounded-xl border p-2.5 text-center ${
        isClosest
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
      }`}>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
          거리 {isClosest && <span className="text-teal-500">★ 최근접</span>}
        </p>
        <p className={`text-[16px] font-black ${isClosest ? 'text-teal-500' : 'text-gray-700 dark:text-gray-200'}`}>
          {distance !== null ? formatDistance(distance) : '—'}
        </p>
        {!userLocation && <p className="text-[9px] text-gray-300 mt-0.5">위치 권한 필요</p>}
      </div>

      {/* 사용 가능 포트 */}
      <div className="grid grid-cols-2 gap-1.5">
        <StatBadge label="전체 포트" value={totalPorts} sub="개" />
        <StatBadge
          label="사용가능"
          value={availPorts}
          sub="개"
          color="#22c55e"
          highlight={isMostAvail}
        />
      </div>

      {/* 급속/완속 */}
      <div className="grid grid-cols-2 gap-1.5">
        {hasFast
          ? <StatBadge label="급속" value={`${stats.fastAvail}/${stats.fastTotal}`} sub="가능/전체" color="#f97316" />
          : <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 flex items-center justify-center"><p className="text-[10px] text-gray-300 dark:text-gray-600">급속 없음</p></div>
        }
        {hasSlow
          ? <StatBadge label="완속" value={`${stats.slowAvail}/${stats.slowTotal}`} sub="가능/전체" color="#3b82f6" />
          : <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 flex items-center justify-center"><p className="text-[10px] text-gray-300 dark:text-gray-600">완속 없음</p></div>
        }
      </div>

      {/* 포트별 타입 + 상태 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2.5">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">충전 타입별 상태</p>
        <div className="flex flex-col gap-1.5">
          {charger.chargers.map(port => (
            <div key={port.chgerId} className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getStatColor(port.stat) }} />
                <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate font-medium">
                  {typeLabels[port.type] ?? port.type}
                </span>
              </div>
              <span className="text-[9px] font-bold shrink-0" style={{ color: getStatColor(port.stat) }}>
                {getStatLabel(port.stat)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ComparePanel({ compareList, onRemove, onClear, onClose, userLocation }: ComparePanelProps) {
  const isEmpty = compareList.length === 0;

  // 거리/가용 순위 계산
  const distances = compareList.map(c =>
    userLocation ? calcDistance(userLocation.lat, userLocation.lng, c.lat, c.lng) : Infinity
  );
  const avails = compareList.map(c => c.chargers.filter(p => p.stat === '2').length);

  const distanceRanks = distances.map((d, i) => distances.filter(x => x < d).length);
  const availRanks = avails.map((a, i) => avails.filter(x => x > a).length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col w-full max-w-3xl max-h-[85vh] overflow-hidden transition-colors" onClick={e => e.stopPropagation()}>
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-400 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">충전소 비교</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{compareList.length}/3개 선택됨</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!isEmpty && (
            <button onClick={onClear} className="text-[11px] font-bold text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              전체삭제
            </button>
          )}
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-600 dark:text-gray-400">비교할 충전소를 선택하세요</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">충전소 목록 또는 상세 팝업에서<br/>⊕ 버튼으로 최대 3개까지 추가</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800/30">
          {compareList.length === 1 && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
              <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400">1개 더 추가하면 비교가 시작돼요!</p>
            </div>
          )}
          <div className={`flex gap-2 items-start`}>
            {compareList.map((charger, i) => (
              <ChargerCard
                key={charger.id}
                charger={charger}
                onRemove={() => onRemove(charger.id)}
                userLocation={userLocation}
                rank={{ distance: distanceRanks[i], avail: availRanks[i] }}
                totalCount={compareList.length}
              />
            ))}
            {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <button
                key={i}
                onClick={onClose}
                className="flex-1 min-h-[120px] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1.5 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all group"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600 group-hover:text-teal-400 transition-colors">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 group-hover:text-teal-400 text-center px-2 transition-colors">충전소<br/>추가</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            ★ 표시는 비교 항목 중 가장 우수한 값
          </p>
        </div>
      )}
    </div>
    </div>
  );
}
