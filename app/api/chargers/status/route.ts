// app/api/chargers/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_EV_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });

  const encodedKey = encodeURIComponent(apiKey);

  try {
    const res = await fetch(
      `https://apis.data.go.kr/B552584/EvCharger/getChargerInfo?serviceKey=${encodedKey}&numOfRows=9999&pageNo=1&zcode=50&dataType=JSON`,
      { cache: 'no-store' },
    );

    const text = await res.text();
    if (text.startsWith('<'))
      return NextResponse.json({ error: 'OpenAPI Error: XML returned' }, { status: 500 });

    const data = JSON.parse(text);
    const items: any[] = data?.items?.item || [];

    // statusMap 생성 (기존 호환)
    const statusMap: Record<string, string> = {};
    items.forEach((c: any) => {
      statusMap[`${c.statId}_${c.chgerId}`] = c.stat;
    });

    // 현재 DB 상태 가져오기
    const { data: existing } = await supabase
      .from('charger_status')
      .select('id, stat');

    const existingMap: Record<string, string> = {};
    existing?.forEach((row: any) => {
      existingMap[row.id] = row.stat;
    });

    // 실제로 stat이 변경된 것만 upsert
    const changedRows = items
      .filter((c: any) => {
        const key = `${c.statId}_${c.chgerId}`;
        return existingMap[key] !== c.stat; // 변경된 것만
      })
      .map((c: any) => ({
        id: `${c.statId}_${c.chgerId}`,
        stat_id: c.statId,
        chger_id: c.chgerId,
        stat: c.stat,
        updated_at: new Date().toISOString(),
      }));

    if (changedRows.length > 0) {
      console.log(`[충전소 상태] ${changedRows.length}개 변경 감지, upsert 시작`);
      const CHUNK = 500;
      for (let i = 0; i < changedRows.length; i += CHUNK) {
        await supabase
          .from('charger_status')
          .upsert(changedRows.slice(i, i + CHUNK), { onConflict: 'id' });
      }
    }

    return NextResponse.json({ statusMap });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}