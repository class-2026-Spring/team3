import { NextResponse } from 'next/server';

export async function GET() {
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

    // statusMap = { 'statId_chgerId': '2' } 형태의 매핑 데이터 반환
    const statusMap: Record<string, string> = {};
    items.forEach((c: any) => {
      statusMap[`${c.statId}_${c.chgerId}`] = c.stat;
    });

    return NextResponse.json({ statusMap });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
