const fs = require('fs');

async function run() {
  const apiKey = encodeURIComponent("1c58f68c33b89375b812598d0f8f961d70097c0eacb43f0fc34da29fc98c181e");
  console.log("Fetching all Jeju charger info...");
  const res = await fetch(`https://apis.data.go.kr/B552584/EvCharger/getChargerInfo?serviceKey=${apiKey}&numOfRows=9999&pageNo=1&zcode=50&dataType=JSON`);
  const text = await res.text();
  const data = JSON.parse(text);
  const items = data.items.item;
  
  const stationsMap = new Map();
  items.forEach(c => {
    if (isNaN(parseFloat(c.lat))) return;
    if (!stationsMap.has(c.statId)) {
      const match = (c.addr || '').match(/제주특별자치도\s+(제주시|서귀포시)\s+([^\s]+)/);
      let district = match ? match[2] : '기타';
      if (district.includes('일동') || district.includes('이동') || district.includes('삼동')) {
        district = district.replace(/[일이삼]동/, '동');
      }
      stationsMap.set(c.statId, {
        id: c.statId,
        name: c.statNm,
        address: c.addr,
        lat: parseFloat(c.lat),
        lng: parseFloat(c.lng),
        district: district,
        chargers: [] // base info only includes what types exist
      });
    }
    stationsMap.get(c.statId).chargers.push({
      chgerId: c.chgerId,
      type: c.chgerType
    });
  });
  
  const stations = Array.from(stationsMap.values());
  fs.writeFileSync('public/jeju_stations.json', JSON.stringify(stations, null, 2));
  console.log(`Saved ${stations.length} stations to public/jeju_stations.json`);
}
run();
