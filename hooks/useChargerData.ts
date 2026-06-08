import { useState, useEffect, useRef } from 'react';
import { Charger, FilterType, isFastCharger, getStationRepresentativeStat } from '../types/charger';

// 제주시/서귀포시 구분 (district 기준)
const JEJU_CITY_DISTRICTS = [
  '한림읍','애월읍','구좌읍','조천읍','한경면','추자면','우도면',
  '일도1동','일도2동','이도1동','이도2동','삼도1동','삼도2동',
  '용담1동','용담2동','건입동','화북동','삼양동','봉개동','아라동',
  '오라동','연동','노형동','외도동','이호동','도두동'
];
const SEOGWIPO_CITY_DISTRICTS = [
  '대정읍','남원읍','성산읍','안덕면','표선면',
  '송산동','정방동','중앙동','천지동','효돈동','영천동','동홍동','서홍동',
  '대륜동','대천동','중문동','예래동',
  '색달동','강정동','호근동','서호동','법환동','상효동','하효동','신효동',
  '영남동','보목동','토평동','월평동','회수동','신산동','수산동','위미동'
];

export function getCity(district: string): '제주시' | '서귀포시' | '기타' {
  if (JEJU_CITY_DISTRICTS.includes(district)) return '제주시';
  if (SEOGWIPO_CITY_DISTRICTS.includes(district)) return '서귀포시';
  return '기타';
}

// 줌 레벨 타입
export type ZoomLevel = 'city' | 'district' | 'station';

export interface ZoomState {
  level: ZoomLevel;
  selectedCity: '전체' | '제주시' | '서귀포시';
  selectedDistrict: string | null;
}

export function useChargerData(
  onStatusChange?: (stationId: string, stationName: string, oldRepStat: string, newRepStat: string) => void,
  initialChargeFilter: FilterType = '전체',
  isSettingsLoaded: boolean = false,
  showAvailableOnly: boolean = false
) {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 줌 상태 (3단계)
  const [zoomState, setZoomState] = useState<ZoomState>({
    level: 'city',
    selectedCity: '전체',
    selectedDistrict: null,
  });

  const [chargeFilter, setChargeFilter] = useState<FilterType>('전체');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'전체' | '사용가능' | '충전중' | '중지' | '점검'>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);

  // 설정 로드 완료 시, 그리고 설정값 변경 시 필터 동기화
  useEffect(() => {
    if (!isSettingsLoaded) return;
    setChargeFilter(initialChargeFilter);
  }, [isSettingsLoaded, initialChargeFilter]);

  useEffect(() => {
    if (!isSettingsLoaded) return;
    setAvailableOnly(showAvailableOnly);
    if (showAvailableOnly) {
      setStatusFilter('사용가능');
    } else {
      setStatusFilter('전체');
    }
  }, [isSettingsLoaded, showAvailableOnly]);

  // 폴링용 ref: interval이 항상 최신 chargers를 참조하도록 (매 업데이트마다 interval 재등록 방지)
  const chargersRef = useRef<Charger[]>([]);
  useEffect(() => { chargersRef.current = chargers; }, [chargers]);

  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/jeju_stations.json');
        if (!res.ok) throw new Error('기본 데이터를 불러올 수 없습니다.');
        const baseData: Charger[] = await res.json();

        const initializedData = baseData.map(station => ({
          ...station,
          chargers: station.chargers.map((port: any) => ({ ...port, stat: '9' }))
        }));

        setChargers(initializedData);
        fetchRealtimeStatus(initializedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRealtimeStatus = async (currentData: Charger[]) => {
    try {
      setStatusLoading(true);
      const res = await fetch('/api/chargers/status');
      if (!res.ok) return;
      const { statusMap } = await res.json();
      const nextData = currentData.map(station => {
        const oldRepStat = String(getStationRepresentativeStat(station.chargers));
        const nextChargers = station.chargers.map(port => ({
          ...port,
          stat: statusMap[`${station.id}_${port.chgerId}`] || port.stat
        }));
        const newRepStat = String(getStationRepresentativeStat(nextChargers));

        if (oldRepStat !== newRepStat && oldRepStat !== '9') {
          if (onStatusChangeRef.current) {
            onStatusChangeRef.current(station.id, station.name, oldRepStat, newRepStat);
          }
        }

        return { ...station, chargers: nextChargers };
      });
      setChargers(nextData);
    } catch (e) {
      console.error("실시간 상태 업데이트 실패:", e);
    } finally {
      setStatusLoading(false);
    }
  };

  // 60초마다 실시간 폴링 - chargers.length만 의존하여 interval은 최초 1회만 등록
  useEffect(() => {
    if (chargers.length === 0) return;
    const interval = setInterval(() => fetchRealtimeStatus(chargersRef.current), 60000);
    return () => clearInterval(interval);
  }, [chargers.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 줌 레벨에 따른 필터링된 충전소
  const filteredChargers = chargers
    .filter(c => {
      const { level, selectedCity, selectedDistrict } = zoomState;
      if (level === 'city') return true;
      if (level === 'district') {
        if (selectedCity === '전체') return true;
        return getCity(c.district) === selectedCity;
      }
      if (level === 'station') {
        return c.district === selectedDistrict;
      }
      return true;
    })
    .filter(c => {
      if (chargeFilter === '전체') return true;
      if (chargeFilter === '급속') return c.chargers?.some(port => isFastCharger(port.type));
      if (chargeFilter === '완속') return c.chargers?.some(port => !isFastCharger(port.type));
      return true;
    })
    .filter(c => {
      if (statusFilter === '전체') return true;
      const repStat = String(getStationRepresentativeStat(c.chargers));
      if (repStat === '9') return true; // 상태 로딩 전이면 통과
      if (statusFilter === '사용가능') return repStat === '2';
      if (statusFilter === '충전중') return repStat === '3';
      if (statusFilter === '중지') return repStat === '1' || repStat === '4';
      if (statusFilter === '점검') return repStat === '5';
      return true;
    });

  // 검색: 충전소명/주소/지역명 모두 지원
  const searchResults = searchQuery.length > 0
    ? chargers.filter(c =>
        c.name.includes(searchQuery) ||
        c.address.includes(searchQuery) ||
        c.district.includes(searchQuery)
      ).slice(0, 15)
    : [];

  // 지역 검색 결과 (읍면동 단위) - chargers에서 직접 파생
  const districtSearchResults = searchQuery.length > 0
    ? Array.from(new Set(chargers.map(c => c.district)))
        .filter(d => d && d !== '기타' && d.includes(searchQuery))
        .sort()
        .slice(0, 5)
    : [];

  // 줌 상태 변경 헬퍼
  const selectCity = (city: '전체' | '제주시' | '서귀포시') => {
    setZoomState({ level: 'district', selectedCity: city, selectedDistrict: null });
    setSelectedCharger(null);
  };

  const selectDistrict = (district: string) => {
    const city = getCity(district) as '제주시' | '서귀포시';
    setZoomState({ level: 'station', selectedCity: city, selectedDistrict: district });
    setSelectedCharger(null);
  };

  const resetToCity = () => {
    setZoomState({ level: 'city', selectedCity: '전체', selectedDistrict: null });
    setSelectedCharger(null);
  };

  const resetToDistrict = () => {
    setZoomState(prev => ({
      level: 'district',
      selectedCity: prev.selectedCity,
      selectedDistrict: null,
    }));
    setSelectedCharger(null);
  };

  return {
    chargers,
    loading,
    statusLoading,
    error,
    // 줌 상태
    zoomState,
    selectCity,
    selectDistrict,
    resetToCity,
    resetToDistrict,
    // 필터 / 검색
    chargeFilter,
    setChargeFilter,
    availableOnly,
    setAvailableOnly,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedCharger,
    setSelectedCharger,
    filteredChargers,
    searchResults,
    districtSearchResults,
  };
}
