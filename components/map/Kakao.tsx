'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Charger, getStatColor, getStationRepresentativeStat } from '../../types/charger';
import { ZoomState, getCity } from '../../hooks/useChargerData';

declare global {
  interface Window { kakao: any; }
}

interface KakaoMapProps {
  chargers: Charger[];
  allChargers: Charger[];
  zoomState: ZoomState;
  selectCity: (city: '전체' | '제주시' | '서귀포시') => void;
  selectDistrict: (district: string) => void;
  resetToCity: () => void;
  resetToDistrict: () => void;
  selectedCharger: Charger | null;
  setSelectedCharger: (c: Charger | null) => void;
}

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  '제주시':   { lat: 33.51, lng: 126.52 },
  '서귀포시': { lat: 33.25, lng: 126.56 },
  '전체':     { lat: 33.37, lng: 126.55 },
};

export default function KakaoMap({
  chargers,
  allChargers,
  zoomState,
  selectCity,
  selectDistrict,
  resetToCity,
  resetToDistrict,
  selectedCharger,
  setSelectedCharger,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polygonsRef = useRef<{ polygon: any; name: string }[]>([]);
  const customOverlaysRef = useRef<any[]>([]);
  const markerListRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // zoomState/allChargers를 ref로 유지 → zoom_changed 핸들러가 stale closure 없이 최신값 읽음
  const zoomStateRef = useRef(zoomState);
  const allChargersRef = useRef(allChargers);
  const isProgrammaticMove = useRef(false);

  // ref를 항상 최신으로 동기화
  useEffect(() => { zoomStateRef.current = zoomState; }, [zoomState]);
  useEffect(() => { allChargersRef.current = allChargers; }, [allChargers]);

  const clearOverlays = useCallback(() => {
    customOverlaysRef.current.forEach(o => o.setMap(null));
    customOverlaysRef.current = [];
  }, []);

  const clearMarkers = useCallback(() => {
    markerListRef.current.forEach(m => m.setMap(null));
    markerListRef.current = [];
  }, []);

  const hideAllPolygons = useCallback(() => {
    polygonsRef.current.forEach(({ polygon }) =>
      polygon.setOptions({ fillOpacity: 0, strokeOpacity: 0 })
    );
  }, []);

  // 1. 지도 초기화 + zoom_changed 등록 (최초 1회만)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(async () => {
        if (!mapRef.current) return;
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(33.37, 126.55),
          level: 10,
        });
        mapInstance.current = map;

        // zoom_changed: ref에서 최신 zoomState 읽어서 처리
        window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
          if (isProgrammaticMove.current) return;
          const mapLevel: number = map.getLevel();
          const cur = zoomStateRef.current;
          const allC = allChargersRef.current;

          if (mapLevel >= 10) {
            resetToCity();
          } else if (mapLevel >= 7) {
            if (cur.level === 'city') {
              const center = map.getCenter();
              const city = center.getLat() > 33.38 ? '제주시' : '서귀포시';
              selectCity(city);
            } else if (cur.level === 'station') {
              resetToDistrict();
            }
            // district → district: 유지
          } else {
            // level <= 6: station
            if (cur.level === 'district' || cur.level === 'city') {
              const center = map.getCenter();
              const lat = center.getLat();
              const lng = center.getLng();

              // 읍면동별 평균 좌표 계산 후 가장 가까운 읍면동 선택
              const dGroups: Record<string, Charger[]> = {};
              allC.forEach(c => {
                if (!dGroups[c.district]) dGroups[c.district] = [];
                dGroups[c.district].push(c);
              });
              let nearest = '';
              let minDist = Infinity;
              Object.entries(dGroups).forEach(([name, list]) => {
                const avgLat = list.reduce((s, c) => s + c.lat, 0) / list.length;
                const avgLng = list.reduce((s, c) => s + c.lng, 0) / list.length;
                const d = Math.hypot(avgLat - lat, avgLng - lng);
                if (d < minDist) { minDist = d; nearest = name; }
              });
              if (nearest) selectDistrict(nearest);
            }
            // station → station: 유지
          }
        });

        // 폴리곤 로드
        try {
          const geoRes = await fetch('/jeju_districts.geojson');
          const geoData = await geoRes.json();
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
                strokeWeight: 1.5,
                strokeColor: '#378ADD',
                strokeOpacity: 0,
                fillColor: '#E6F1FB',
                fillOpacity: 0,
              });
              window.kakao.maps.event.addListener(polygon, 'click', () => {
                selectDistrict(name);
                setSelectedCharger(null);
              });
              polygonsRef.current.push({ polygon, name });
              polygon.setMap(map);
            });
          });
        } catch (e) {
          console.error('폴리곤 로드 실패', e);
        }

        setMapReady(true);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. zoomState 변화 → 렌더링
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    clearOverlays();
    clearMarkers();
    hideAllPolygons();

    const { level, selectedCity, selectedDistrict } = zoomState;

    // ── LEVEL 1: city ─────────────────────────────────────────
    if (level === 'city') {
      const cityGroups: Record<string, number> = { '제주시': 0, '서귀포시': 0 };
      allChargers.forEach(c => {
        const city = getCity(c.district);
        if (city === '제주시' || city === '서귀포시') cityGroups[city]++;
      });

      (window as any).__mapSelectCity = (city: string) =>
        selectCity(city as '제주시' | '서귀포시');

      Object.entries(cityGroups).forEach(([cityName, count]) => {
        const center = CITY_CENTERS[cityName];
        const content = `
          <div onclick="window.__mapSelectCity('${cityName}')" style="
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            width:90px;height:90px;border-radius:50%;
            background:rgba(59,130,246,0.92);
            border:3px solid rgba(255,255,255,0.9);
            box-shadow:0 4px 16px rgba(59,130,246,0.5);
            cursor:pointer;user-select:none;transition:transform 0.15s;"
            onmouseover="this.style.transform='scale(1.08)'"
            onmouseout="this.style.transform='scale(1)'">
            <span style="color:#fff;font-size:22px;font-weight:900;line-height:1;">${count}</span>
            <span style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;margin-top:2px;">${cityName}</span>
          </div>`;
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(center.lat, center.lng),
          content, yAnchor: 0.5, xAnchor: 0.5,
        });
        overlay.setMap(map);
        customOverlaysRef.current.push(overlay);
      });

      isProgrammaticMove.current = true;
      map.setCenter(new window.kakao.maps.LatLng(33.37, 126.55));
      map.setLevel(10);
      setTimeout(() => { isProgrammaticMove.current = false; }, 600);
      return;
    }

    // ── LEVEL 2: district ─────────────────────────────────────
    if (level === 'district') {
      const cityChargers = allChargers.filter(c =>
        selectedCity === '전체' || getCity(c.district) === selectedCity
      );
      const districtGroups: Record<string, Charger[]> = {};
      cityChargers.forEach(c => {
        if (!districtGroups[c.district]) districtGroups[c.district] = [];
        districtGroups[c.district].push(c);
      });

      (window as any).__mapSelectDistrict = (district: string) => selectDistrict(district);

      Object.entries(districtGroups).forEach(([districtName, list]) => {
        const avgLat = list.reduce((s, c) => s + c.lat, 0) / list.length;
        const avgLng = list.reduce((s, c) => s + c.lng, 0) / list.length;
        const count = list.length;
        const size = Math.min(80, Math.max(52, 36 + Math.sqrt(count) * 3));

        const content = `
          <div onclick="window.__mapSelectDistrict('${districtName}')" style="
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            width:${size}px;height:${size}px;border-radius:50%;
            background:rgba(20,184,166,0.88);
            border:2.5px solid rgba(255,255,255,0.9);
            box-shadow:0 3px 12px rgba(20,184,166,0.45);
            cursor:pointer;user-select:none;transition:transform 0.15s;"
            onmouseover="this.style.transform='scale(1.1)'"
            onmouseout="this.style.transform='scale(1)'">
            <span style="color:#fff;font-size:${size>64?16:13}px;font-weight:900;line-height:1;">${count}</span>
            <span style="color:rgba(255,255,255,0.92);font-size:${size>64?10:9}px;font-weight:700;margin-top:1px;text-align:center;padding:0 4px;white-space:nowrap;">${districtName}</span>
          </div>`;

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(avgLat, avgLng),
          content, yAnchor: 0.5, xAnchor: 0.5,
        });
        overlay.setMap(map);
        customOverlaysRef.current.push(overlay);
      });

      const center = CITY_CENTERS[selectedCity] || CITY_CENTERS['전체'];
      const currentLevel = map.getLevel();
      if (currentLevel < 7 || currentLevel >= 10) {
        isProgrammaticMove.current = true;
        map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
        map.setLevel(9);
        setTimeout(() => { isProgrammaticMove.current = false; }, 600);
      }
      return;
    }

    // ── LEVEL 3: station ──────────────────────────────────────
    if (level === 'station' && selectedDistrict) {
      polygonsRef.current.forEach(({ polygon, name }) => {
        if (name === selectedDistrict) {
          polygon.setOptions({
            fillColor: '#378ADD', fillOpacity: 0.12,
            strokeColor: '#185FA5', strokeOpacity: 0.8, strokeWeight: 2,
          });
        }
      });

      // 클러스터러 없이 순수 마커만 (원형 오버레이와 겹치지 않음)
      const districtChargers = chargers.filter(c => c.district === selectedDistrict);

      districtChargers.forEach(charger => {
        const isSelected = selectedCharger?.id === charger.id;
        const repStat = getStationRepresentativeStat(charger.chargers);
        const statColor = getStatColor(repStat);
        const pinColor = isSelected ? '#FFFFFF' : statColor;
        const iconColor = isSelected ? statColor : '#000000';
        const strokeColor = isSelected ? '#000000' : '#FFFFFF';
        const strokeWidth = isSelected ? '3' : '1.5';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 36 48">
          <path d="M18 2C9.16 2 2 9.16 2 18c0 13 16 27 16 27s16-14 16-27C34 9.16 26.84 2 18 2z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <path d="M21 11l-8 12h6l-2 10 9-14h-6l1-8z" fill="${iconColor}"/>
        </svg>`;
        const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        const w = isSelected ? 38 : 32;
        const h = isSelected ? 48 : 42;
        const markerImage = new window.kakao.maps.MarkerImage(
          imageSrc,
          new window.kakao.maps.Size(w, h),
          { offset: new window.kakao.maps.Point(w / 2, h) }
        );
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(charger.lat, charger.lng),
          image: markerImage,
          title: charger.name,
        });
        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedCharger(charger);
        });
        markerListRef.current.push(marker);
      });

      const currentLevel = map.getLevel();
      if (currentLevel >= 7) {
        isProgrammaticMove.current = true;
        if (selectedCharger) {
          map.setCenter(new window.kakao.maps.LatLng(selectedCharger.lat, selectedCharger.lng));
          map.setLevel(4);
        } else if (districtChargers.length > 0) {
          const avgLat = districtChargers.reduce((s, c) => s + c.lat, 0) / districtChargers.length;
          const avgLng = districtChargers.reduce((s, c) => s + c.lng, 0) / districtChargers.length;
          map.setCenter(new window.kakao.maps.LatLng(avgLat, avgLng));
          map.setLevel(6);
        }
        setTimeout(() => { isProgrammaticMove.current = false; }, 600);
      }
    }
  }, [mapReady, zoomState, chargers, allChargers, selectedCharger,
      clearOverlays, clearMarkers, hideAllPolygons,
      selectCity, selectDistrict, setSelectedCharger]);

  return <div ref={mapRef} className="w-full h-full bg-gray-100" />;
}