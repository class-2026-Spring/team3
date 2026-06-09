import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // API 라우트이므로 서비스 롤 사용
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const statusMap: Record<string, string> = {};
    let hasMore = true;
    let start = 0;
    const limit = 1000;

    while (hasMore) {
      const { data, error } = await supabase
        .from('charger_status')
        .select('id, stat')
        .range(start, start + limit - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          statusMap[row.id] = row.stat;
        });
        start += limit;
      } else {
        hasMore = false;
      }

      if (data && data.length < limit) {
        hasMore = false;
      }
    }

    return NextResponse.json({ statusMap });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}