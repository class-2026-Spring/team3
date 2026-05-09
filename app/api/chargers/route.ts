import { NextResponse } from 'next/server';

let cachedData: any = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < 60000) {
    return NextResponse.json(cachedData);
  }

  const apiKey = process.env.NEXT_PUBLIC_EV_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
  
  const encodedKey = encodeURIComponent(apiKey);

  try {
    const res = await fetch(
      `https://apis.data.go.kr/B552584/EvCharger/getChargerInfo?serviceKey=${encodedKey}&numOfRows=9999&pageNo=1&zcode=50&dataType=JSON`,
      { cache: 'no-store' }
    );
    
    const text = await res.text();
    if (text.startsWith('<')) return NextResponse.json({ error: 'OpenAPI Error: XML returned' }, { status: 500 });
    
    const data = JSON.parse(text);
    const items = data?.items?.item || [];

    // 충전소 단위(statId)로 그룹화
    const stationsMap = new Map<string, any>();

    items.forEach((c: any) => {
      if (isNaN(parseFloat(c.lat)) || isNaN(parseFloat(c.lng))) return;

      if (!stationsMap.has(c.statId)) {
        const match = (c.addr || '').match(/제주특별자치도\s+(제주시|서귀포시)\s+([^\s]+)/);
        let district = match ? match[2] : '기타';
        if (district.includes('일동') || district.includes('이동') || district.includes('삼동')) {
          district = district.replace(/[일이삼]동/, '동');
        }

        stationsMap.set(c.statId, {
          id: c.statId,
          name: c.statNm,
          address: c.addr,
          lat: parseFloat(c.lat),
          lng: parseFloat(c.lng),
          district: district,
          chargers: [] // 소속된 충전기들
        });
      }

      stationsMap.get(c.statId).chargers.push({
        chgerId: c.chgerId,
        type: c.chgerType,
        stat: c.stat,
      });
    });

    const stations = Array.from(stationsMap.values());
    cachedData = { chargers: stations }; // 호환성을 위해 키는 chargers 유지
    lastFetchTime = now;

    return NextResponse.json(cachedData);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
