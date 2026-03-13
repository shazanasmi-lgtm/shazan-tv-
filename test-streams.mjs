import fs from 'fs';
const channels = [
  { id: 'itn', url: 'https://222103-hls.akamaized.net/668828a00bf80aa436254876/live_aabd3d003af211efadcf7986aa245789/rewind-3600.m3u8' },
  { id: 'dw_en', url: 'https://dwamdstream107.akamaized.net/hls/live/2017968/dwstream107/stream05/streamPlaylist.m3u8' }
];

async function runTests() {
  const results = [];
  for (let c of channels) {
    try {
      const pUrl = `http://localhost:3000/api/proxy?url=${encodeURIComponent(c.url)}`;
      const res = await fetch(pUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const text = await res.text();
      let isM3u8 = text.includes('#EXTM3U');
      results.push({ id: c.id, status: res.status, textPreview: text.substring(0, 100) });
    } catch(e) {
      results.push({ id: c.id, error: e.message });
    }
  }
  fs.writeFileSync('stream_results.json', JSON.stringify(results, null, 2), 'utf-8');
}
runTests();
