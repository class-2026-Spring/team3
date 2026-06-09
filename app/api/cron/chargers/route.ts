import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchRawChargers } from '@/lib/evApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  // ── 보안: CRON_SECRET 미설정 시 항상 차단 ──────────────────
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[Cron] CRON_SECRET 환경변수가 설정되지 않았습니다. 요청 차단.');
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // ── 공공데이터 API 호출 (공통 함수 사용) ──────────────────
    const items = await fetchRawChargers();

    // ── 현재 DB 상태 로드 (페이지네이션) ─────────────────────
    const existingMap: Record<string, string> = {};
    let start = 0;
    const PAGE = 1000;

    while (true) {
      const { data: existing, error } = await supabase
        .from('charger_status')
        .select('id, stat')
        .range(start, start + PAGE - 1);

      if (error) throw error;
      if (!existing || existing.length === 0) break;

      for (const row of existing) {
        existingMap[row.id] = row.stat;
      }

      if (existing.length < PAGE) break;
      start += PAGE;
    }

    // ── 변경된 항목만 upsert ──────────────────────────────────
    const changedRows = items
      .filter((c) => existingMap[`${c.statId}_${c.chgerId}`] !== c.stat)
      .map((c) => ({
        id: `${c.statId}_${c.chgerId}`,
        stat_id: c.statId,
        chger_id: c.chgerId,
        stat: c.stat,
        updated_at: new Date().toISOString(),
      }));

    if (changedRows.length > 0) {
      console.log(`[Cron] ${changedRows.length}개 상태 변경 감지, upsert 시작`);
      const CHUNK = 500;
      for (let i = 0; i < changedRows.length; i += CHUNK) {
        await supabase
          .from('charger_status')
          .upsert(changedRows.slice(i, i + CHUNK), { onConflict: 'id' });
      }
    } else {
      console.log('[Cron] 변경된 충전소 상태가 없습니다.');
    }

    return NextResponse.json({ success: true, updatedCount: changedRows.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[Cron] 에러:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
