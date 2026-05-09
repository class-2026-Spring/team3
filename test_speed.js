const apiKey = encodeURIComponent("1c58f68c33b89375b812598d0f8f961d70097c0eacb43f0fc34da29fc98c181e");
async function test() {
  const t1 = Date.now();
  console.log("Fetching status...");
  await fetch(`https://apis.data.go.kr/B552584/EvCharger/getChargerStatus?serviceKey=${apiKey}&numOfRows=9999&pageNo=1&zcode=50&dataType=JSON`).then(r => r.text());
  console.log("Status Time:", Date.now() - t1, "ms");
}
test();
