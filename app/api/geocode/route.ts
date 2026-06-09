import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ found: false, reason: 'query too short' });
  }

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!kakaoKey) {
    return NextResponse.json({ found: false, reason: 'no kakao key' }, { status: 500 });
  }

  try {
    // 제주도 중심 좌표(33.4, 126.5) 기준 반경 60km 내에서 우선 검색
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&y=33.4&x=126.5&radius=60000&size=1`;

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${kakaoKey}` },
    });

    if (!res.ok) {
      // JavaScript 키로 REST API 호출 실패 시 주소 검색으로 fallback
      const addrUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=1`;
      const addrRes = await fetch(addrUrl, {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
      });
      if (!addrRes.ok) return NextResponse.json({ found: false, reason: 'kakao api error' });
      const addrData = await addrRes.json();
      const doc = addrData.documents?.[0];
      if (!doc) return NextResponse.json({ found: false });
      return NextResponse.json({
        found: true,
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
        placeName: doc.address_name,
      });
    }

    const data = await res.json();
    const doc = data.documents?.[0];

    if (!doc) return NextResponse.json({ found: false, reason: 'no results' });

    return NextResponse.json({
      found: true,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      placeName: doc.place_name,
    });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ found: false, reason: 'exception' });
  }
}
