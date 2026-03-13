import fs from 'fs';

const channels = [
  { id: 'asia_tv', url: 'https://stream.asiatvnet.com/1/live/master.m3u8' },
  { id: 'charana', url: 'https://edge3-moblive.yuppcdn.net/transhd2/smil:chtv05.smil/index.m3u8' },
  { id: 'jaya', url: 'https://edge3-moblive.yuppcdn.net/drm/smil:jayamagatvdrm.smil/index.m3u8' },
  { id: 'monara', url: 'https://jk3lz8xklw79-hls-live.5centscdn.com/lpl/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8' },
  { id: 'ndtv_lk', url: 'https://g4wlkqqwl23a-hls-live.5centscdn.com/NDTVLANKA/1ff5fa54d14c3ff6c6bd3918bbb7db5d.sdp/playlist.m3u8' },
  { id: 'nethra', url: 'https://edge3-moblive.yuppcdn.net/transsd/smil:chii02.smil/playlist.m3u8' },
  { id: 'shakthi', url: 'https://edge4-moblive.yuppcdn.net/transsd/smil:saktv10.smil/playlist.m3u8' },
  { id: 'shraddha', url: 'https://edge3-moblive.yuppcdn.net/drm1/smil:shraddhatvdrm.smil/index.m3u8' },
  { id: 'siyatha', url: 'https://rtmp01.voaplus.com/hls/6x6ik312qk4grfxocfcv.m3u8' },
  { id: 'star_tamil', url: 'https://edge4-moblive.yuppcdn.net/trans1sd/smil:strtml19.smil/playlist.m3u8' },
  { id: 'swarnavahini', url: 'https://jk3lz8xklw79-hls-live.5centscdn.com/live/6226f7cbe59e99a90b5cef6f94f966fd.sdp/playlist.m3u8' },
  { id: 'buddhist', url: 'https://edge3-moblive.yuppcdn.net/drm1/smil:thebuddhistdrm.smil/index.m3u8' },
  { id: 'tnl', url: 'https://edge3-moblive.yuppcdn.net/transsd/smil:tnl12.smil/playlist.m3u8' },
  { id: 'tv_1', url: 'https://d3ssd0juqbxbw.cloudfront.net/mtvsinstlive/master.m3u8' },
  { id: 'vasantham', url: 'https://edge4-moblive.yuppcdn.net/transsd/smil:vsthtv06.smil/playlist.m3u8' }
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
  fs.writeFileSync('stream_results_lk.json', JSON.stringify(results, null, 2), 'utf-8');
}
runTests();
