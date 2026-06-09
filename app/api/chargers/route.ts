import { NextResponse } from 'next/server';
import { fetchRawChargers, groupItemsToStations, Station } from '@/lib/evApi';

export const runtime = 'nodejs';

// ─── 모듈 레벨 캐시 (타입 명시, no-any) ─────────────────────
let cachedStations: Station[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000; // 1분

export async function GET() {
  const now = Date.now();
  if (cachedStations && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({ chargers: cachedStations });
  }

  try {
    const items = await fetchRawChargers();
    cachedStations = groupItemsToStations(items);
    lastFetchTime = Date.now();

    return NextResponse.json({ chargers: cachedStations });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
