/**
 * lib/evApi.ts
 * 공공데이터 포털 전기차 충전기 정보 API 공통 모듈
 * - URL / 파라미터 정의를 한 곳에서 관리
 * - 타입 정의 공유
 * - 원시 응답 파싱 및 에러 처리 공통화
 */

// ─── 타입 ────────────────────────────────────────────────────

export interface RawChargerItem {
  statId: string;
  chgerId: string;
  statNm: string;
  addr: string;
  lat: string;
  lng: string;
  chgerType: string;
  stat: string;
}

export interface ChargerPort {
  chgerId: string;
  type: string;
  stat: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  district: string;
  chargers: ChargerPort[];
}

// ─── API 호출 ─────────────────────────────────────────────────

/**
 * 공공데이터 포털에서 제주(zcode=50) 충전기 전체 목록을 가져옵니다.
 * @returns 원시 응답 아이템 배열
 * @throws API 키 미설정 또는 응답 오류 시 Error 던짐
 */
export async function fetchRawChargers(): Promise<RawChargerItem[]> {
  const apiKey = process.env.EV_API_KEY;
  if (!apiKey) {
    throw new Error('EV_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const url = new URL('https://apis.data.go.kr/B552584/EvCharger/getChargerInfo');
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('numOfRows', '9999');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('zcode', '50');
  url.searchParams.set('dataType', 'JSON');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  const text = await res.text();

  // 공공데이터 포털은 오류 시 XML을 반환
  if (text.trimStart().startsWith('<')) {
    throw new Error('공공데이터 포털 오류: XML 응답 반환됨 (키 오류 또는 일시적 장애)');
  }

  const json = JSON.parse(text);
  const items: RawChargerItem[] = json?.items?.item ?? [];
  return items;
}

// ─── 파싱 헬퍼 ───────────────────────────────────────────────

/**
 * 원시 아이템 배열을 Station 단위로 그룹화합니다.
 * 위경도가 없는 항목은 자동으로 제외됩니다.
 */
export function groupItemsToStations(items: RawChargerItem[]): Station[] {
  const stationsMap = new Map<string, Station>();

  for (const c of items) {
    const lat = parseFloat(c.lat);
    const lng = parseFloat(c.lng);
    if (isNaN(lat) || isNaN(lng)) continue;

    if (!stationsMap.has(c.statId)) {
      const match = (c.addr || '').match(
        /제주특별자치도\s+(제주시|서귀포시)\s+([^\s]+)/
      );
      let district = match ? match[2] : '기타';
      if (/[일이삼]동/.test(district)) {
        district = district.replace(/[일이삼]동/, '동');
      }

      stationsMap.set(c.statId, {
        id: c.statId,
        name: c.statNm,
        address: c.addr,
        lat,
        lng,
        district,
        chargers: [],
      });
    }

    stationsMap.get(c.statId)!.chargers.push({
      chgerId: c.chgerId,
      type: c.chgerType,
      stat: c.stat,
    });
  }

  return Array.from(stationsMap.values());
}
