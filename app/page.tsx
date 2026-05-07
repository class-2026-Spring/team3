'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window { kakao: any; }
}

interface Charger {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  hours: string;
  quick: number;
  slow: number;
}

const DISTRICT_MAP: Record<string, string> = {
  '일도일동': '일도1동', '일도이동': '일도2동',
  '이도일동': '이도1동', '이도이동': '이도2동',
  '삼도일동': '삼도1동', '삼도이동': '삼도2동',
  '용담일동': '용담1동', '용담이동': '용담2동',
  '화북일동': '화북1동', '화북이동': '화북2동',
  '삼양일동': '삼양동', '삼양이동': '삼양동',
  '오라일동': '오라동', '오라이동': '오라동', '오라삼동': '오라동',
  '아라일동': '아라동', '아라이동': '아라동', '아라1동': '아라동',
  '외도일동': '외도동',
  '도두일동': '도두동',
  '도련일동': '봉개동', '도련이동': '봉개동',
};

function extractDistrict(address: string): string {
  const cleaned = address
    .replace('제주특별자치도 ', '')
    .replace('제주시 ', '')
    .replace('서귀포시 ', '');
  const match = cleaned.match(/^(\S+[읍면동리])/);
  if (!match) return '기타';
  const raw = match[1];
  return DISTRICT_MAP[raw] || raw;
}

function getCircleSize(count: number): number {
  if (count >= 10) return 44;
  if (count >= 5) return 36;
  if (count >= 2) return 30;
  return 24;
}

function makeCircleContent(name: string, count: number, size: number): string {
  return `
    <div onclick="window.__selectDistrict && window.__selectDistrict('${name}')"
      style="
        width:${size}px; height:${size}px;
        border-radius:50%;
        background:rgba(230, 241, 251, 0.7);
        border: 2px solid #378ADD;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      ">
      <span style="font-size:${size > 36 ? 13 : 11}px; font-weight:600; color:#185FA5;">${count}</span>
    </div>
  `;
}

function getStatColor(stat: string): string {
  switch (stat) {
    case '2': return '#22c55e';
    case '3': return '#3b82f6';
    case '4': return '#ef4444';
    case '5': return '#f59e0b';
    default: return '#9ca3af';
  }
}

function getStatLabel(stat: string): string {
  switch (stat) {
    case '2': return '사용가능';
    case '3': return '충전중';
    case '4': return '운영중지';
    case '5': return '점검중';
    default: return '알수없음';
  }
}

type FilterType = '전체' | '급속' | '완속';

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ marker: any; charger: Charger }[]>([]);
  const polygonsRef = useRef<{ polygon: any; name: string }[]>([]);
  const circlesRef = useRef<{ overlay: any; name: string }[]>([]);
  const chargersRef = useRef<Charger[]>([]);

  const [chargers, setChargers] = useState<Charger[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Charger | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>('전체');
  const [districts, setDistricts] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [chargeFilter, setChargeFilter] = useState<FilterType>('전체');

  useEffect(() => {
    fetch('/jeju_chargers.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n').slice(1);
        const data = lines.map(line => {
          const cols = line.split(',');
          return {
            id: cols[0],
            name: cols[1],
            address: cols[2] || '',
            district: extractDistrict(cols[2] || ''),
            lat: parseFloat(cols[3]),
            lng: parseFloat(cols[4]),
            hours: cols[5],
            quick: parseInt(cols[6] || '0'),
            slow: parseInt(cols[7] || '0'),
          };
        }).filter(d => !isNaN(d.lat) && !isNaN(d.lng));
        setChargers(data);
        chargersRef.current = data;
        const unique = Array.from(new Set(data.map(d => d.district)))
          .filter(d => d !== '기타')
          .sort();
        setDistricts(unique);
      });
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/charger-status');
        const data = await res.json();
        const nameToStat: Record<string, string> = data?.nameToStat || {};
        const map: Record<string, string> = {};
        chargersRef.current.forEach(charger => {
          if (nameToStat[charger.name]) {
            map[charger.id] = nameToStat[charger.name];
          }
        });
        setStatusMap(map);
      } catch (e) {
        console.error('상태 조회 실패:', e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chargers.length === 0) return;

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = async () => {
      window.kakao.maps.load(async () => {
        if (!mapRef.current) return;
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(33.37, 126.55),
          level: 11,
        });
        mapInstance.current = map;

        const geoRes = await fetch('/jeju_districts.geojson');
        const geoData = await geoRes.json();

        const countMap: Record<string, number> = {};
        chargers.forEach(c => {
          countMap[c.district] = (countMap[c.district] || 0) + 1;
        });

        const centerMap: Record<string, { lat: number; lng: number }> = {};
        geoData.features.forEach((feature: any) => {
          const name = feature.properties.name;
          const geomType = feature.geometry.type;
          const polygonList = geomType === 'MultiPolygon'
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates];
          const allCoords = polygonList.flatMap((p: number[][][]) => p[0]);
          const avgLat = allCoords.reduce((s: number, c: number[]) => s + c[1], 0) / allCoords.length;
          const avgLng = allCoords.reduce((s: number, c: number[]) => s + c[0], 0) / allCoords.length;
          centerMap[name] = { lat: avgLat, lng: avgLng };
        });

        geoData.features.forEach((feature: any) => {
          const name = feature.properties.name;
          const geomType = feature.geometry.type;
          const polygonList = geomType === 'MultiPolygon'
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates];

          polygonList.forEach((polygonCoords: number[][][]) => {
            const path = polygonCoords[0].map((c: number[]) =>
              new window.kakao.maps.LatLng(c[1], c[0])
            );
            const polygon = new window.kakao.maps.Polygon({
              path,
              strokeWeight: 2,
              strokeColor: '#378ADD',
              strokeOpacity: 0.9,
              fillColor: '#E6F1FB',
              fillOpacity: 0.5,
            });
            polygonsRef.current.push({ polygon, name });
          });
        });

        geoData.features.forEach((feature: any) => {
          const name = feature.properties.name;
          const center = centerMap[name];
          if (!center) return;
          const count = countMap[name] || 0;
          if (count === 0) return;

          const size = getCircleSize(count);
          const overlay = new window.kakao.maps.CustomOverlay({
            map,
            position: new window.kakao.maps.LatLng(center.lat, center.lng),
            content: makeCircleContent(name, count, size),
            yAnchor: 0.5,
            xAnchor: 0.5,
          });
          circlesRef.current.push({ overlay, name });
        });

        (window as any).__selectDistrict = (name: string) => {
          setActiveDistrict(name);
          setSelected(null);
          setSearchQuery('');
        };

        chargers.forEach(charger => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(charger.lat, charger.lng),
            title: charger.name,
          });
          window.kakao.maps.event.addListener(marker, 'click', () => setSelected(charger));
          markersRef.current.push({ marker, charger });
        });

        markersRef.current.forEach(({ marker }) => marker.setMap(null));
        setMapReady(true);
      });
    };
  }, [chargers]);

  const updateMarkers = (district: string, filter: FilterType) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    markersRef.current.forEach(({ marker, charger }) => {
      const districtMatch = district === '전체' || charger.district === district;
      const filterMatch =
        filter === '전체' ||
        (filter === '급속' && charger.quick > 0) ||
        (filter === '완속' && charger.slow > 0);
      marker.setMap(districtMatch && filterMatch && district !== '전체' ? map : null);
    });
  };

  const updateCircles = (filter: FilterType) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    circlesRef.current.forEach(({ overlay, name }) => {
      const count = chargersRef.current.filter(c => {
        if (c.district !== name) return false;
        if (filter === '급속') return c.quick > 0;
        if (filter === '완속') return c.slow > 0;
        return true;
      }).length;
      if (count === 0) { overlay.setMap(null); return; }
      const size = getCircleSize(count);
      overlay.setContent(makeCircleContent(name, count, size));
      overlay.setMap(map);
    });
  };

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    if (activeDistrict === '전체') {
      updateCircles(chargeFilter);
      polygonsRef.current.forEach(({ polygon }) => polygon.setMap(null));
      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      map.setCenter(new window.kakao.maps.LatLng(33.37, 126.55));
      map.setLevel(11);
    } else {
      circlesRef.current.forEach(({ overlay }) => overlay.setMap(null));
      polygonsRef.current.forEach(({ polygon, name }) => {
        polygon.setMap(name === activeDistrict ? map : null);
      });
      updateMarkers(activeDistrict, chargeFilter);
      const targets = chargers.filter(c => c.district === activeDistrict);
      if (targets.length > 0) {
        const avgLat = targets.reduce((s, c) => s + c.lat, 0) / targets.length;
        const avgLng = targets.reduce((s, c) => s + c.lng, 0) / targets.length;
        map.setCenter(new window.kakao.maps.LatLng(avgLat, avgLng));
        map.setLevel(8);
      }
    }
  }, [activeDistrict, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    if (activeDistrict === '전체') updateCircles(chargeFilter);
    else updateMarkers(activeDistrict, chargeFilter);
  }, [chargeFilter, mapReady]);

  const filtered = chargers
    .filter(c => activeDistrict === '전체' || c.district === activeDistrict)
    .filter(c =>
      chargeFilter === '전체' ||
      (chargeFilter === '급속' && c.quick > 0) ||
      (chargeFilter === '완속' && c.slow > 0)
    );

  const searchResults = searchQuery.length > 0
    ? chargers.filter(c =>
        c.name.includes(searchQuery) || c.address.includes(searchQuery)
      ).slice(0, 10)
    : [];

  const handleSelectCharger = (charger: Charger) => {
    setSelected(charger);
    setActiveDistrict(charger.district);
    if (mapInstance.current) {
      circlesRef.current.forEach(({ overlay }) => overlay.setMap(null));
      polygonsRef.current.forEach(({ polygon, name }) => {
        polygon.setMap(name === charger.district ? mapInstance.current : null);
      });
      markersRef.current.forEach(({ marker, charger: c }) => {
        const filterMatch =
          chargeFilter === '전체' ||
          (chargeFilter === '급속' && c.quick > 0) ||
          (chargeFilter === '완속' && c.slow > 0);
        marker.setMap(c.district === charger.district && filterMatch ? mapInstance.current : null);
      });
      mapInstance.current.setCenter(new window.kakao.maps.LatLng(charger.lat, charger.lng));
      mapInstance.current.setLevel(6);
    }
  };

  const handleSearchSelect = (charger: Charger) => {
    setSearchQuery('');
    setSearchFocused(false);
    handleSelectCharger(charger);
  };

  const selectedStat = selected ? (statusMap[selected.id] || '0') : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-400 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C5.2 1 3 3.2 3 6c0 3.8 5 9 5 9s5-5.2 5-9c0-2.8-2.2-5-5-5zm0 6.5c-.8 0-1.5-.7-1.5-1.5S7.2 4.5 8 4.5s1.5.7 1.5 1.5S8.8 7.5 8 7.5z" fill="white"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-none">제주 EV 충전소</p>
            <p className="text-xs text-gray-400 mt-0.5">실시간 현황 확인</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">충전소 {filtered.length}개</p>
      </header>

      <div className="bg-white border-b border-gray-100 px-4 py-2 relative">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#9ca3af" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="충전소명 또는 주소 검색"
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-300 text-base">✕</button>
          )}
        </div>
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-14 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
            {searchResults.map(charger => (
              <div
                key={charger.id}
                onMouseDown={() => handleSearchSelect(charger)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{charger.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{charger.address}</p>
                  </div>
                  {statusMap[charger.id] && (
                    <span className="text-xs px-2 py-0.5 rounded-full ml-2 shrink-0"
                      style={{
                        background: getStatColor(statusMap[charger.id]) + '20',
                        color: getStatColor(statusMap[charger.id]),
                      }}>
                      {getStatLabel(statusMap[charger.id])}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">충전 타입</span>
        <div className="flex gap-2">
          {(['전체', '급속', '완속'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setChargeFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                chargeFilter === f
                  ? 'bg-blue-400 text-white border-blue-400'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {[['2','사용가능'],['3','충전중'],['4','중지']].map(([stat, label]) => (
            <div key={stat} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: getStatColor(stat) }}/>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto">
        {['전체', ...districts].map(district => (
          <button
            key={district}
            onClick={() => { setActiveDistrict(district); setSelected(null); setSearchQuery(''); }}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 border transition-colors ${
              activeDistrict === district
                ? 'bg-blue-400 text-white border-blue-400'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {district}
          </button>
        ))}
      </div>

      <div ref={mapRef} className="w-full h-80" />

      {activeDistrict !== '전체' && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => { setActiveDistrict('전체'); setSelected(null); }}
            className="text-xs px-3 py-1.5 rounded-full border border-blue-300 text-blue-500 bg-blue-50"
          >
            ← 전체 보기
          </button>
        </div>
      )}

      {selected && (
        <div className="mx-4 mt-3 p-4 bg-white rounded-xl border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{selected.name}</p>
                {selectedStat && selectedStat !== '0' && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: getStatColor(selectedStat) + '20',
                      color: getStatColor(selectedStat),
                    }}>
                    {getStatLabel(selectedStat)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">{selected.address}</p>
              <p className="text-xs text-blue-500 mt-1">{selected.hours}</p>
              <div className="flex gap-2 mt-2">
                {selected.quick > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                    급속 {selected.quick}기
                  </span>
                )}
                {selected.slow > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                    완속 {selected.slow}기
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-300 text-lg">✕</button>
          </div>
        </div>
      )}

      <div className="p-4">
        <p className="text-xs font-medium text-gray-400 mb-3">
          {activeDistrict === '전체' ? '전체 충전소' : `${activeDistrict} 충전소`} {filtered.length}개
        </p>
        <div className="flex flex-col gap-2">
          {filtered.map(charger => {
            const stat = statusMap[charger.id] || '0';
            return (
              <div
                key={charger.id}
                onClick={() => handleSelectCharger(charger)}
                className="p-3 rounded-lg border border-gray-100 bg-white flex justify-between items-center cursor-pointer hover:border-blue-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{charger.name}</p>
                    {stat !== '0' && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getStatColor(stat) }}/>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{charger.address}</p>
                  <div className="flex gap-1.5 mt-1">
                    {charger.quick > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-500">급속 {charger.quick}</span>
                    )}
                    {charger.slow > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">완속 {charger.slow}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{charger.district}</span>
                  {stat !== '0' && (
                    <span className="text-xs" style={{ color: getStatColor(stat) }}>
                      {getStatLabel(stat)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}