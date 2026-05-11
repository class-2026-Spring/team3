const fs = require('fs');
let content = fs.readFileSync('app/ai/page.tsx', 'utf8');

content = content.replace(
`type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
};`,
`type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  stations?: any[];
};`
);

content = content.replace(
`          // Filter and Sort
          const stationsWithDist = data.map((station: any) => ({
            ...station,
            distance: getDistanceFromLatLonInKm(latitude, longitude, parseFloat(station.lat), parseFloat(station.lng)).toFixed(2)
          }));

          // Sort and get top 5
          stationsWithDist.sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
          const top5 = stationsWithDist.slice(0, 5);`,
`          const stationsWithDist = data.map((station: any) => ({
            ...station,
            distance: getDistanceFromLatLonInKm(latitude, longitude, parseFloat(station.lat), parseFloat(station.lng)).toFixed(2)
          }));

          // Filter within 1km
          const within1km = stationsWithDist.filter((s: any) => parseFloat(s.distance) <= 1.0);

          // Sort and get top 10
          within1km.sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));
          const top10 = within1km.slice(0, 10);`
);

// We need to do manual replacements for the logic
fs.writeFileSync('app/ai/page.tsx', content);
