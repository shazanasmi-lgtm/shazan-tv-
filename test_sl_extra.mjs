import fs from 'fs';

const channels = [
  { id: 'swarnavahini', url: 'https://jk3lz8xklw79-hls-live.5centscdn.com/live/6226f7cbe59e99a90b5cef6f94f966fd.sdp/playlist.m3u8' },
  { id: 'swarnavahini_yupp', url: 'https://edge1-moblive.yuppcdn.net/drm/smil:swarnawahinidrm.smil/manifest.m3u8' },
  { id: 'sirasa_yt', url: 'https://ythls.onrender.com/channel/SirasaTV.m3u8' }, // Assuming my proxy can handle it if it exists
  { id: 'derana_test', url: 'https://edge3-moblive.yuppcdn.net/transhd2/smil:detv04.smil/index.m3u8' }
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
  fs.writeFileSync('stream_results_sl_extra.json', JSON.stringify(results, null, 2), 'utf-8');
}
runTests();
