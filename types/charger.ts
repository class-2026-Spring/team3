export interface ChargerPort {
  chgerId: string;
  type: string; // 01~07
  stat: string; // 1,2,3,4,5,9
}

export interface Charger {
  id: string; // statId
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  chargers: ChargerPort[];
}

export type FilterType = '전체' | '급속' | '완속';

export const getStatColor = (stat: string): string => {
  switch (stat) {
    case '2': return '#22c55e'; // 사용가능(초록)
    case '3': return '#3b82f6'; // 충전중(파랑)
    case '4': return '#ef4444'; // 운영중지(빨강)
    case '5': return '#f59e0b'; // 점검중(주황)
    default: return '#9ca3af'; // 알수없음(회색)
  }
};

export const getStatLabel = (stat: string): string => {
  switch (stat) {
    case '2': return '사용가능';
    case '3': return '충전중';
    case '4': return '운영중지';
    case '5': return '점검중';
    case '1': return '통신이상';
    case '9': return '미확인';
    default: return '알수없음';
  }
};

export const isFastCharger = (type: string): boolean => {
  return ['04', '05', '06', '07', '08'].includes(type);
};

// 충전소 전체 상태 대표값 (사용 가능한 충전기가 1개라도 있으면 '2', 아니면 가장 많은 상태)
export const getStationRepresentativeStat = (chargers: ChargerPort[]): string => {
  if (!chargers || chargers.length === 0) return '9';
  if (chargers.some(c => c.stat === '2')) return '2';
  if (chargers.some(c => c.stat === '3')) return '3';
  return chargers[0].stat;
};

// 통계 유틸리티 함수들
export const getStationStats = (chargers: ChargerPort[]) => {
  if (!chargers) return { fastTotal: 0, fastAvail: 0, slowTotal: 0, slowAvail: 0 };
  
  let fastTotal = 0, fastAvail = 0;
  let slowTotal = 0, slowAvail = 0;

  chargers.forEach(c => {
    const isFast = isFastCharger(c.type);
    if (isFast) {
      fastTotal++;
      if (c.stat === '2') fastAvail++;
    } else {
      slowTotal++;
      if (c.stat === '2') slowAvail++;
    }
  });

  return { fastTotal, fastAvail, slowTotal, slowAvail };
};
