import { useState, useEffect } from 'react';
import { Charger, FilterType, isFastCharger } from '../types/charger';

export function useChargerData() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // 기본 데이터 로딩
  const [statusLoading, setStatusLoading] = useState<boolean>(false); // 실시간 상태 백그라운드 로딩
  const [error, setError] = useState<string | null>(null);

  const [activeDistrict, setActiveDistrict] = useState<string>('전체');
  const [chargeFilter, setChargeFilter] = useState<FilterType>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);

  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    // 1. 초기 렌더링 시 로컬 정적 JSON 파일에서 위치 정보를 즉시 로드 (0.1초 컷)
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/jeju_stations.json');
        if (!res.ok) throw new Error('기본 데이터를 불러올 수 없습니다.');
        const baseData: Charger[] = await res.json();
        
        // 초기 상태는 모두 '9' (상태 미확인)로 설정
        const initializedData = baseData.map(station => ({
          ...station,
          chargers: station.chargers.map((port: any) => ({ ...port, stat: '9' }))
        }));
        
        setChargers(initializedData);

        const unique = Array.from(new Set(initializedData.map(c => c.district)))
          .filter(d => d && d !== '기타')
          .sort();
        setDistricts(unique);
        
        // 2. 기본 로딩 성공 직후 실시간 상태를 백그라운드에서 로드
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
      if (!res.ok) return; // 에러가 나도 기존 지도는 유지되게 조용히 리턴
      const { statusMap } = await res.json();
      
      // 기존 충전소 데이터에 실시간 상태만 덮어쓰기
      setChargers(currentData.map(station => ({
        ...station,
        chargers: station.chargers.map(port => ({
          ...port,
          stat: statusMap[`${station.id}_${port.chgerId}`] || port.stat
        }))
      })));
      
    } catch (e) {
      console.error("실시간 상태 업데이트 실패:", e);
    } finally {
      setStatusLoading(false);
    }
  };

  // 1분(60000ms)마다 백그라운드 실시간 갱신
  useEffect(() => {
    if (chargers.length === 0) return;
    const interval = setInterval(() => fetchRealtimeStatus(chargers), 60000);
    return () => clearInterval(interval);
  }, [chargers]);


  // 현재 필터와 지역에 맞는 충전소 리스트
  const filteredChargers = chargers
    .filter(c => activeDistrict === '전체' || c.district === activeDistrict)
    .filter(c => {
      if (chargeFilter === '전체') return true;
      if (chargeFilter === '급속') return c.chargers?.some(port => isFastCharger(port.type));
      if (chargeFilter === '완속') return c.chargers?.some(port => !isFastCharger(port.type));
      return true;
    });

  const searchResults = searchQuery.length > 0
    ? chargers.filter(c =>
        c.name.includes(searchQuery) || c.address.includes(searchQuery)
      ).slice(0, 15)
    : [];

  return {
    chargers,
    loading,
    statusLoading, // UI에서 "실시간 갱신중..." 표시에 사용 가능
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
  };
}
