import React, { useEffect, useRef, useState } from 'react';
import { Charger, getStatColor, getStationRepresentativeStat } from '../../types/charger';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  chargers: Charger[];
  activeDistrict: string;
  setActiveDistrict: (d: string) => void;
  selectedCharger: Charger | null;
  setSelectedCharger: (c: Charger | null) => void;
}

export default function KakaoMap({
  chargers,
  activeDistrict,
  setActiveDistrict,
  selectedCharger,
  setSelectedCharger
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const polygonsRef = useRef<{ polygon: any; name: string }[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // 1. 지도 및 클러스터러 초기화
  useEffect(() => {
    const script = document.createElement('script');
    // libraries=clusterer 추가
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

        // 마커 클러스터러 생성 (이미지 1 스타일)
        const clusterer = new window.kakao.maps.MarkerClusterer({
          map: map, 
          averageCenter: true, 
          minLevel: 6, // 레벨 6 이상에서 클러스터링 (확대 풀면 숫자 표시)
          styles: [{ 
            width: '40px', height: '40px',
            background: 'rgba(59, 130, 246, 0.9)', // Tailwind blue-500
            borderRadius: '20px',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '40px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255, 255, 255, 0.8)'
          }]
        });
        clustererRef.current = clusterer;

        // (선택) 폴리곤 데이터 로드
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
                strokeWeight: 1,
                strokeColor: '#378ADD',
                strokeOpacity: 0.0, // 기본 숨김
                fillColor: '#E6F1FB',
                fillOpacity: 0.0, // 기본 숨김
              });

              window.kakao.maps.event.addListener(polygon, 'click', () => {
                setActiveDistrict(name);
                setSelectedCharger(null);
              });

              polygonsRef.current.push({ polygon, name });
              polygon.setMap(map);
            });
          });
        } catch (e) {
          console.error("폴리곤 로드 실패", e);
        }

        setMapReady(true);
      });
    };
  }, []);

  // 2. 마커 생성 및 클러스터러에 추가 (이미지 2 스타일)
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !clustererRef.current) return;

    // 기존 마커 지우기
    clustererRef.current.clear();

    const newMarkers = chargers.map(charger => {
      const isSelected = selectedCharger?.id === charger.id;
      const repStat = getStationRepresentativeStat(charger.chargers);
      const statColor = getStatColor(repStat);
      
      // 디자인 로직: 선택되면 하얀 핀에 테두리 검정, 내부는 상태 색상. 평소엔 상태 색상 핀에 검정 번개
      const pinColor = isSelected ? '#FFFFFF' : statColor;
      const iconColor = isSelected ? statColor : '#000000';
      const strokeColor = isSelected ? '#000000' : '#FFFFFF';
      const strokeWidth = isSelected ? '3' : '1.5';

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 36 48">
        <path d="M18 2C9.16 2 2 9.16 2 18c0 13 16 27 16 27s16-14 16-27C34 9.16 26.84 2 18 2z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <path d="M21 11l-8 12h6l-2 10 9-14h-6l1-8z" fill="${iconColor}"/>
      </svg>`;
      
      const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      
      // 선택된 마커는 더 크게 표시
      const width = isSelected ? 38 : 32;
      const height = isSelected ? 48 : 42;
      const markerImage = new window.kakao.maps.MarkerImage(
        imageSrc, 
        new window.kakao.maps.Size(width, height), 
        { offset: new window.kakao.maps.Point(width/2, height) }
      );

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(charger.lat, charger.lng),
        image: markerImage,
        title: charger.name
      });

      // 마커 클릭 시
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedCharger(charger);
        setActiveDistrict(charger.district);
      });

      return marker;
    });

    clustererRef.current.addMarkers(newMarkers);
  }, [chargers, mapReady, selectedCharger, setActiveDistrict, setSelectedCharger]);

  // 3. 지역 또는 충전소 선택 시 지도 이동 및 폴리곤 스타일
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // 선택된 마커가 있으면 해당 위치로 확대
    if (selectedCharger) {
      map.setCenter(new window.kakao.maps.LatLng(selectedCharger.lat, selectedCharger.lng));
      map.setLevel(4);
      return;
    }

    // 지역 선택 시 폴리곤 하이라이트 및 이동
    if (activeDistrict === '전체') {
      polygonsRef.current.forEach(({ polygon }) => {
        polygon.setOptions({ fillOpacity: 0, strokeOpacity: 0 });
      });
      map.setCenter(new window.kakao.maps.LatLng(33.37, 126.55));
      map.setLevel(10);
    } else {
      polygonsRef.current.forEach(({ polygon, name }) => {
        if (name === activeDistrict) {
          polygon.setOptions({ fillColor: '#378ADD', fillOpacity: 0.1, strokeColor: '#185FA5', strokeOpacity: 0.8, strokeWeight: 2 });
        } else {
          polygon.setOptions({ fillOpacity: 0, strokeOpacity: 0 });
        }
      });
      
      const targets = chargers.filter(c => c.district === activeDistrict);
      if (targets.length > 0) {
        const avgLat = targets.reduce((s, c) => s + c.lat, 0) / targets.length;
        const avgLng = targets.reduce((s, c) => s + c.lng, 0) / targets.length;
        map.setCenter(new window.kakao.maps.LatLng(avgLat, avgLng));
        map.setLevel(7);
      }
    }
  }, [activeDistrict, selectedCharger, mapReady, chargers]);

  return <div ref={mapRef} className="w-full h-full bg-gray-100" />;
}
