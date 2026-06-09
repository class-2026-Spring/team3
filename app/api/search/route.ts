import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// 모듈 레벨 캐시 — 첫 요청 시 1회 로드 후 메모리 유지
let stationCache: Station[] | null = null;

async function getStations(): Promise<Station[]> {
  if (stationCache) return stationCache;
  const filePath = path.join(process.cwd(), 'public', 'jeju_stations.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  stationCache = JSON.parse(raw) as Station[];
  return stationCache;
}

interface ChargerPort {
  chgerId: string;
  type: string;
  stat?: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  district: string;
  chargers: ChargerPort[];
}

// 검색 키워드를 토큰으로 분리해 각각 매칭 (예: "성산일출봉" → ["성산일출봉", "성산"])
function buildTokens(query: string): string[] {
  const tokens: string[] = [query];
  // 2글자 이상 부분 문자열도 추가 (앞에서부터 2글자씩 슬라이딩)
  if (query.length >= 4) {
    tokens.push(query.slice(0, Math.ceil(query.length / 2)));
  }
  return tokens.filter((t) => t.length >= 2);
}

function matchStation(station: Station, tokens: string[]): boolean {
  const haystack = `${station.name} ${station.address} ${station.district}`.toLowerCase();
  return tokens.some((token) => haystack.includes(token.toLowerCase()));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    if (!query || query.length < 2) {
      return NextResponse.json({ stations: [], matched: false });
    }

    // 모듈 캐시에서 읽기 — 최초 1회만 디스크 I/O
    const stations = await getStations();

    const tokens = buildTokens(query);
    const matched = stations
      .filter((s) => matchStation(s, tokens))
      .slice(0, limit)
      // distance 필드는 없으므로 빈 문자열로 통일
      .map((s) => ({ ...s, distance: '' }));

    return NextResponse.json({ stations: matched, matched: matched.length > 0 });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ stations: [], matched: false }, { status: 500 });
  }
}
