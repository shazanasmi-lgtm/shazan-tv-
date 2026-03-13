import fs from 'fs';
const channels = [
  { id: 'aljazeera', url: 'https://live-hls-web-aje-fa.thehlive.com/AJE/index.m3u8' },
  { id: 'france24', url: 'https://uvotv-aniview.global.ssl.fastly.net/hls/live/2120684/france24english/playlist.m3u8' },
  { id: 'redbull', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8' }
];

async function runTests() {
  const results = [];
  for (let c of channels) {
    try {
      const pUrl = `http://localhost:3001/api/proxy?url=${encodeURIComponent(c.url)}`;
      const res = await fetch(pUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const text = await res.text();
      let isM3u8 = text.includes('#EXTM3U');
      results.push({ id: c.id, status: res.status, isM3u8 });
    } catch(e) {
      results.push({ id: c.id, error: e.message });
    }
  }
  fs.writeFileSync('stream_results.json', JSON.stringify(results, null, 2), 'utf-8');
}
runTests();
