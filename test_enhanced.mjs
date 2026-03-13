import fs from 'fs';

const channels = [
  { id: 'sony_ten_1', url: 'http://103.121.6.5:8000/play/a05w/index.m3u8' },
  { id: 'sony_ten_2', url: 'http://103.229.254.25:7001/play/a02t/index.m3u8' },
  { id: 'sony_ten_5', url: 'http://103.229.254.25:7001/play/a0dw/index.m3u8' },
  { id: 'star_sports_2', url: 'http://103.121.6.5:8000/play/a05u/index.m3u8' },
  { id: 'star_sports_3', url: 'http://103.121.6.5:8000/play/a05y/index.m3u8' },
  { id: 'tv_1', url: 'https://d3ssd0juqbxbw.cloudfront.net/mtvsinstlive/master.m3u8' },
  { id: 'siyatha', url: 'https://rtmp01.voaplus.com/hls/6x6ik312qk4grfxocfcv.m3u8' },
  { id: 'asia_tv', url: 'https://stream.asiatvnet.com/1/live/master.m3u8' },
  { id: 'ndtv_lk', url: 'https://g4wlkqqwl23a-hls-live.5centscdn.com/NDTVLANKA/1ff5fa54d14c3ff6c6bd3918bbb7db5d.sdp/playlist.m3u8' }
];

async function runTests() {
  const results = [];
  for (let c of channels) {
    try {
      const pUrl = `http://localhost:3001/api/proxy?url=${encodeURIComponent(c.url)}`;
      const res = await fetch(pUrl, { method: 'GET', signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      let isM3u8 = text.includes('#EXTM3U');
      results.push({ id: c.id, status: res.status, isM3u8, preview: text.substring(0, 50) });
    } catch(e) {
      results.push({ id: c.id, error: e.message });
    }
  }
  fs.writeFileSync('stream_results_enhanced.json', JSON.stringify(results, null, 2), 'utf-8');
}
runTests();
