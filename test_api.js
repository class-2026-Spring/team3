const apiKey = "1c58f68c33b89375b812598d0f8f961d70097c0eacb43f0fc34da29fc98c181e";
const encodedKey = encodeURIComponent(apiKey);
async function test() {
  const start = Date.now();
  console.log("Fetching...");
  try {
    const res = await fetch(`https://apis.data.go.kr/B552584/EvCharger/getChargerInfo?serviceKey=${encodedKey}&numOfRows=10&pageNo=1&zcode=50&dataType=JSON`);
    const text = await res.text();
    console.log("Time:", Date.now() - start, "ms");
    console.log("Data:", text.substring(0, 200));
  } catch(e) {
    console.log(e);
  }
}
test();
