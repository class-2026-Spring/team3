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

export const getStatLabel = (stat: string, lang: string = 'ko'): string => {
  if (lang === 'en') {
    switch (stat) {
      case '2': return 'Available';
      case '3': return 'Charging';
      case '4': return 'Stopped';
      case '5': return 'Maintenance';
      case '1': return 'Comm Error';
      case '9': return 'Unknown';
      default: return 'Unknown';
    }
  }
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
  // 01: DC차데모, 02: AC완속, 03: DC차데모+AC3상, 04: DC콤보, 05: DC콤보+차데모, 06: DC콤보+차데모+AC3상, 07: 슈퍼차저
  // 급속: DC계열 (01, 03, 04, 05, 06, 07), 완속: AC (02)
  // Kakao.tsx 인라인 isFast와 기준 통일
  return ['01', '03', '04', '05', '06', '07'].includes(type);
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
