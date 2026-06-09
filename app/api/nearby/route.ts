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

interface StationWithDist extends Station {
  distance: string;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const radiusKm = parseFloat(searchParams.get('radius') ?? '1.0');
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 모듈 캐시에서 읽기 — 최초 1회만 디스크 I/O
    const stations = await getStations();

    // 거리 계산 및 반경 필터링
    const nearby: StationWithDist[] = stations
      .map((station) => ({
        ...station,
        distance: getDistanceKm(lat, lng, station.lat, station.lng).toFixed(2),
      }))
      .filter((s) => parseFloat(s.distance) <= radiusKm)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, limit);

    return NextResponse.json({ stations: nearby });
  } catch (error: unknown) {
    console.error('Nearby API Error:', error);
    return NextResponse.json(
      { error: '충전소 데이터를 불러오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}
