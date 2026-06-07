#!/usr/bin/env python3
"""
jeju_stations.json의 district 필드가 도로명으로 저장된 경우를
GeoJSON 폴리곤 point-in-polygon 방식으로 올바른 읍면동으로 보정합니다.

사용법:
  python3 scripts/fix_districts.py
"""

import json
import sys
import re
from pathlib import Path

# ── 경로 설정 ──────────────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent / "public"
STATIONS_PATH = BASE / "jeju_stations.json"
GEOJSON_PATH  = BASE / "jeju_districts.geojson"
OUTPUT_PATH   = BASE / "jeju_stations.json"  # 원본을 덮어씌움 (백업 권장)


# ── Point-in-Polygon (Ray Casting) ─────────────────────────────────────────
def point_in_polygon(lat: float, lng: float, ring: list[list[float]]) -> bool:
    """ring: [[lng, lat], ...] (GeoJSON 순서)"""
    x, y = lng, lat
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def point_in_feature(lat: float, lng: float, feature: dict) -> bool:
    geom = feature["geometry"]
    geom_type = geom["type"]
    coords = geom["coordinates"]

    polygons = coords if geom_type == "MultiPolygon" else [coords]
    for polygon in polygons:
        outer_ring = polygon[0]
        if point_in_polygon(lat, lng, outer_ring):
            # 구멍(hole) 체크
            in_hole = False
            for hole in polygon[1:]:
                if point_in_polygon(lat, lng, hole):
                    in_hole = True
                    break
            if not in_hole:
                return True
    return False


# ── 메인 ──────────────────────────────────────────────────────────────────
def main():
    print(f"📂 충전소 데이터 로드 중: {STATIONS_PATH}")
    with open(STATIONS_PATH, encoding="utf-8") as f:
        stations = json.load(f)

    print(f"🗺  GeoJSON 로드 중: {GEOJSON_PATH}")
    with open(GEOJSON_PATH, encoding="utf-8") as f:
        geojson = json.load(f)

    features = geojson["features"]
    district_names = [feat["properties"]["name"] for feat in features]
    print(f"   → 행정 읍면동 수: {len(district_names)}")

    # 도로명 district 여부 판단
    def is_road_district(d: str) -> bool:
        return bool(d) and not any(x in d for x in ["읍", "면", "동"])

    road_stations = [s for s in stations if is_road_district(s.get("district", ""))]
    print(f"\n🔍 도로명 district 충전소: {len(road_stations)} / {len(stations)}")

    # Point-in-Polygon 보정
    fixed = 0
    not_found = 0

    for i, station in enumerate(stations):
        orig_district = station.get("district", "")
        if not is_road_district(orig_district):
            continue  # 이미 읍면동인 경우 스킵

        lat = station.get("lat")
        lng = station.get("lng")
        if lat is None or lng is None:
            not_found += 1
            continue

        matched_district = None
        for feat in features:
            if point_in_feature(lat, lng, feat):
                matched_district = feat["properties"]["name"]
                break

        if matched_district:
            station["district"] = matched_district
            fixed += 1
        else:
            not_found += 1
            # 미매칭 시 주소 괄호 안 동 이름으로 fallback
            addr = station.get("address", "")
            paren = re.search(r'\(([^)]*(?:읍|면|동)[^)]*)\)', addr)
            if paren:
                candidate = paren.group(1).strip()
                # 여러 단어면 마지막 읍면동 단어만 추출
                tokens = candidate.split()
                for tok in reversed(tokens):
                    if any(x in tok for x in ["읍", "면", "동"]):
                        station["district"] = tok
                        not_found -= 1
                        fixed += 1
                        break

        if (i + 1) % 200 == 0:
            print(f"   처리 중... {i+1}/{len(stations)} (보정: {fixed}, 미매칭: {not_found})")

    print(f"\n✅ 보정 완료!")
    print(f"   보정됨:  {fixed}개")
    print(f"   미매칭:  {not_found}개 (도로명 그대로 유지)")

    # 보정 후 district 분포 확인
    after_districts = {}
    for s in stations:
        d = s.get("district", "")
        after_districts[d] = after_districts.get(d, 0) + 1

    still_road = {k: v for k, v in after_districts.items()
                  if not any(x in k for x in ["읍", "면", "동"])}
    print(f"   보정 후 도로명 district 남은 수: {len(still_road)}개 ({sum(still_road.values())}개 충전소)")

    # 이도2동 확인
    ido2_count = after_districts.get("이도2동", 0)
    print(f"\n📊 이도2동 충전소 수: {ido2_count}개")

    # 저장
    print(f"\n💾 저장 중: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(stations, f, ensure_ascii=False, separators=(",", ":"))
    print("완료!")


if __name__ == "__main__":
    main()
