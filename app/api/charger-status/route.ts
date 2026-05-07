export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_EV_API_KEY!;
  const encodedKey = encodeURIComponent(apiKey);

  try {
    // 1. 충전소 정보 (이름 + statId)
    const infoRes = await fetch(
      `https://apis.data.go.kr/B552584/EvCharger/getChargerInfo?serviceKey=${encodedKey}&numOfRows=9999&pageNo=1&zcode=50&dataType=JSON`
    );
    const infoText = await infoRes.text();
    if (infoText.startsWith('<')) {
      return Response.json({ error: 'info API 실패', items: { item: [] } });
    }
    const infoData = JSON.parse(infoText);
    const infoItems = infoData?.items?.item || [];

    // 2. 충전기 상태
    const statRes = await fetch(
      `https://apis.data.go.kr/B552584/EvCharger/getChargerStatus?serviceKey=${encodedKey}&numOfRows=9999&pageNo=1&zcode=50&dataType=JSON`
    );
    const statText = await statRes.text();
    if (statText.startsWith('<')) {
      return Response.json({ error: 'status API 실패', items: { item: [] } });
    }
    const statData = JSON.parse(statText);
    const statItems = statData?.items?.item || [];

    // 3. statId → stat 맵
    const statMap: Record<string, string> = {};
    statItems.forEach((s: any) => {
      statMap[s.statId] = s.stat;
    });

    // 4. 충전소 이름 → stat 맵으로 변환
    const nameToStat: Record<string, string> = {};
    infoItems.forEach((info: any) => {
      const stat = statMap[info.statId] || '0';
      nameToStat[info.statNm] = stat;
    });

    return Response.json({ nameToStat });
  } catch (e) {
    return Response.json({ error: String(e), nameToStat: {} }, { status: 500 });
  }
}