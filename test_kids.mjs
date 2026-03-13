import fs from 'fs';

const channels = [
  { id: 'disney', url: 'http://103.229.254.25:7001/play/a09r/index.m3u8' },
  { id: 'disney_jr', url: 'http://103.229.254.25:7001/play/a09o/index.m3u8' },
  { id: 'nickelodeon', url: 'http://103.229.254.25:7001/play/a0cq/index.m3u8' },
  { id: 'nick_jr', url: 'http://103.229.254.25:7001/play/a0cr/index.m3u8' },
  { id: 'sony_yay', url: 'http://103.229.254.25:7001/play/a0cl/index.m3u8' }
];

async function runTests() {
  const results = [];
  for (let c of channels) {
    try {
      const pUrl = `http://localhost:3001/api/proxy?url=${encodeURIComponent(c.url)}`;
      const res = await fetch(pUrl, { method: 'GET', signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      let isM3u8 = text.includes('#EXTM3U');
      results.push({ id: c.id, status: res.status, isM3u8 });
    } catch(e) {
      results.push({ id: c.id, error: e.message });
    }
  }
  fs.writeFileSync('stream_results_kids.json', JSON.stringify(results, null, 2), 'utf-8');
}
runTests();
