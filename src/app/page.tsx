"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Search, MonitorPlay, Globe, Maximize, Loader2, PlusCircle,
    LayoutGrid, Zap, ShieldCheck, Settings, Volume2, VolumeX,
    RefreshCw, Play, Pause, ChevronRight, Sparkles, Antenna,
    Wifi, Signal, Trash2, AlertCircle, CheckCircle2, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Channel {
    id: string;
    name: string;
    logo: string;
    url: string;
    category: string;
}
type Tab = 'home' | 'channels' | 'settings';

// ─────────────────────────────────────────────
//  PROXY HELPER — Bypasses CORS and injects headers
// ─────────────────────────────────────────────
function proxy(url: string) {
    if (!url) return url;
    
    // Vercel deployment URL (Independent of PC)
    const VERCEL_PROXY = 'https://shazan-tv.vercel.app/api/proxy';
    
    // Local PC fallback (Only for testing while PC is on)
    // const LOCAL_PROXY = 'http://10.55.8.44:3001/api/proxy';

    // IMPORTANT: When building for Phone (Vercel), we use the Vercel URL
    return `${VERCEL_PROXY}?url=${encodeURIComponent(url)}`;
}

// ─────────────────────────────────────────────
//  BUILT-IN CHANNELS
// ─────────────────────────────────────────────
const BUILTIN_CHANNELS: Channel[] = [
    // ── Sri Lanka TV (Working) ──
    { id: 'tv_1', name: 'TV 1 (Sirasa Family)', logo: 'https://i.imgur.com/QShk1BV.png', url: 'https://d3ssd0juqbxbw.cloudfront.net/mtvsinstlive/master.m3u8', category: 'SL TV' },
    { id: 'siyatha', name: 'Siyatha TV', logo: 'https://i.imgur.com/9Zc8G7i.png', url: 'https://rtmp01.voaplus.com/hls/6x6ik312qk4grfxocfcv.m3u8', category: 'SL TV' },
    { id: 'asia_tv', name: 'Asia TV HD', logo: 'https://saddlebrown-jellyfish-181801.hostingersite.com/ATV-logo.png', url: 'https://stream.asiatvnet.com/1/live/master.m3u8', category: 'SL TV' },
    { id: 'ndtv_lk', name: 'NDTV Lanka', logo: 'https://i.imgur.com/5cyTVRJ.png', url: 'https://g4wlkqqwl23a-hls-live.5centscdn.com/NDTVLANKA/1ff5fa54d14c3ff6c6bd3918bbb7db5d.sdp/playlist.m3u8', category: 'SL TV' },
    { id: 'itn', name: 'ITN (Unstable)', logo: 'https://i.imgur.com/QShk1BV.png', url: 'https://222103-hls.akamaized.net/668828a00bf80aa436254876/live_aabd3d003af211efadcf7986aa245789/rewind-3600.m3u8', category: 'SL TV' },
    { id: 'hiru', name: 'Hiru TV (Unstable)', logo: 'https://i.imgur.com/RX6IwK8.png', url: 'https://tv.hiruhost.com:1936/8012/8012/playlist.m3u8', category: 'SL TV' },

    // ── Sports (Working) ──
    { id: 'sony_ten_1', name: 'Sony Sports Ten 1', logo: '⚽', url: 'http://103.121.6.5:8000/play/a05w/index.m3u8', category: 'Sports' },
    { id: 'sony_ten_2', name: 'Sony Sports Ten 2', logo: '🥊', url: 'http://103.229.254.25:7001/play/a02t/index.m3u8', category: 'Sports' },
    { id: 'sony_ten_5', name: 'Sony Sports Ten 5', logo: '🎾', url: 'http://103.229.254.25:7001/play/a0dw/index.m3u8', category: 'Sports' },
    { id: 'star_sports_2', name: 'Star Sports 2 HD', logo: '🏏', url: 'http://103.121.6.5:8000/play/a05u/index.m3u8', category: 'Sports' },
    { id: 'star_sports_3', name: 'Star Sports 3', logo: '🏏', url: 'http://103.121.6.5:8000/play/a05y/index.m3u8', category: 'Sports' },
    { id: 'redbull', name: 'Red Bull TV', logo: '🐂', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8', category: 'Sports' },

    // ── News (Working) ──
    { id: 'aljazeera', name: 'Al Jazeera', logo: '📰', url: 'https://live-hls-web-aje-fa.thehlive.com/AJE/index.m3u8', category: 'News' },
    { id: 'bbc_news', name: 'BBC News HD', logo: '📺', url: 'https://vs-hls-push-uk-live.akamaized.net/x=3/i=urn:bbc:pips:service:bbc_news_channel_hd/t=3840/v=pv14/b=5070016/main.m3u8', category: 'News' },
    { id: 'nasa_tv', name: 'NASA TV', logo: '🚀', url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master_2000.m3u8', category: 'News' },

    // ── Kids (Working) ──
    { id: 'disney', name: 'Disney Channel', logo: '🐭', url: 'http://103.229.254.25:7001/play/a09r/index.m3u8', category: 'Kids' },
    { id: 'nickelodeon', name: 'Nickelodeon', logo: '🧡', url: 'http://103.229.254.25:7001/play/a0cq/index.m3u8', category: 'Kids' },
    { id: 'sony_yay', name: 'Sony Yay!', logo: '😺', url: 'http://103.229.254.25:7001/play/a0cl/index.m3u8', category: 'Kids' },
];

const IPTV_PACKS = [
    { id: 'lk', name: 'Sri Lanka', emoji: '🇱🇰', url: 'https://iptv-org.github.io/iptv/countries/lk.m3u', color: 'from-blue-600 to-indigo-700' },
    { id: 'in', name: 'India', emoji: '🇮🇳', url: 'https://iptv-org.github.io/iptv/countries/in.m3u', color: 'from-orange-500 to-amber-600' },
    { id: 'sports', name: 'Sports', emoji: '⚽', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', color: 'from-emerald-500 to-teal-600' },
    { id: 'news', name: 'World News', emoji: '📰', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', color: 'from-slate-600 to-gray-700' },
    { id: 'movies', name: 'Movies', emoji: '🎬', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', color: 'from-purple-600 to-pink-700' },
    { id: 'kids', name: 'Kids', emoji: '🧒', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u', color: 'from-yellow-500 to-orange-600' },
];

const CAT_ICONS: Record<string, string> = {
    'SL TV': '🇱🇰',
    'Sports': '⚽',
    'News': '📰',
    'Indian': '🇮🇳',
    'Movies': '🎬',
    'Music': '🎵',
    'Kids': '🧒',
    'Custom': '🔗',
    'All': '✦',
};

// ─────────────────────────────────────────────
//  PARSE M3U
// ─────────────────────────────────────────────
function parseM3U(text: string, defaultCat: string): Channel[] {
    const lines = text.split('\n');
    const out: Channel[] = [];
    let cur: Partial<Channel> | null = null;
    for (const raw of lines) {
        const line = raw.trim();
        if (line.startsWith('#EXTINF')) {
            const name = line.match(/,(.+)$/)?.[1]?.trim() || 'Unknown';
            const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || '';
            const cat = line.match(/group-title="([^"]*)"/)?.[1] || defaultCat;
            cur = { name, logo, category: cat };
        } else if (line.length > 5 && !line.startsWith('#') && cur) {
            cur.url = line;
            cur.id = `p_${Math.random().toString(36).substr(2, 9)}`;
            out.push(cur as Channel);
            cur = null;
        }
    }
    return out;
}

// ─────────────────────────────────────────────
//  CHANNEL LOGO
// ─────────────────────────────────────────────
function ChannelLogo({ logo, name, size = 44 }: { logo: string; name: string; size?: number }) {
    const [err, setErr] = useState(false);
    const isUrl = logo.startsWith('http');
    if (isUrl && !err) {
        return (
            <div className="rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center"
                style={{ width: size, height: size }}>
                <img src={logo} alt={name} className="w-full h-full object-contain"
                    onError={() => setErr(true)} loading="lazy" />
            </div>
        );
    }
    const emoji = logo && logo.length <= 4 ? logo : (name[0] || '📺');
    return (
        <div className="rounded-2xl flex items-center justify-center text-white"
            style={{ width: size, height: size, background: 'rgba(108,99,255,0.2)', fontSize: size * 0.45 }}>
            {emoji}
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
// Al Jazeera is confirmed 100% working via Proxy
const DEFAULT_CHANNEL = BUILTIN_CHANNELS.find(c => c.id === 'aljazeera') || BUILTIN_CHANNELS[0];

export default function ShazanTVApp() {
    const [channels, setChannels] = useState<Channel[]>(BUILTIN_CHANNELS);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(DEFAULT_CHANNEL);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('⚡ Connecting...');
    const [isMuted, setIsMuted] = useState(false);
    const [tab, setTab] = useState<Tab>('home');
    const [searchQ, setSearchQ] = useState('');
    const [activeCat, setActiveCat] = useState('All');
    const [loadingPack, setLoadingPack] = useState<string | null>(null);
    const [customUrl, setCustomUrl] = useState('');
    const [zdActive, setZdActive] = useState(true);
    const [retries, setRetries] = useState(0);
    const retriesRef = useRef(0);
    const [proxyOk, setProxyOk] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Load saved channels — v4 clears old broken cache
    useEffect(() => {
        // Remove old broken cache keys
        localStorage.removeItem('shazan_ch_v4');
        try {
            const saved = localStorage.getItem('shazan_ch_v5');
            if (saved) {
                const parsed: Channel[] = JSON.parse(saved);
                // Only use saved if it has extra channels beyond builtins
                if (parsed.length > BUILTIN_CHANNELS.length) {
                    // Merge: always keep latest builtins first
                    const extra = parsed.filter((p: Channel) => !BUILTIN_CHANNELS.some(b => b.id === p.id));
                    setChannels([...BUILTIN_CHANNELS, ...extra]);
                }
            }
        } catch { }
        const zd = localStorage.getItem('zd_active');
        if (zd !== null) setZdActive(zd === 'true');
    }, []);

    const saveChannels = (chs: Channel[]) => {
        setChannels(chs);
        localStorage.setItem('shazan_ch_v5', JSON.stringify(chs.slice(0, 1500)));
    };

    // ── PLAYER ──────────────────────────────
    const destroyHls = useCallback(() => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    }, []);

    const initPlayer = useCallback((channel: Channel, directFallback = false) => {
        if (!videoRef.current) return;
        destroyHls();
        setIsPlaying(false);
        setIsLoading(true);
        if (!directFallback) {
            retriesRef.current = 0;
            setRetries(0);
        }

        const src = directFallback ? channel.url : proxy(channel.url);
        const label = directFallback ? '⚠️ Direct (data applies)' : '⚡ Zero Data Stream...';
        setStatusMsg(label);

        const video = videoRef.current;

        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 90,
                enableWorker: true,
                lowLatencyMode: false,
                startLevel: -1,
                abrEwmaDefaultEstimate: 1500000,
                manifestLoadingMaxRetry: 3,
                levelLoadingMaxRetry: 3,
                fragLoadingMaxRetry: 3,
                fragLoadingRetryDelay: 1500,
                backBufferLength: 30,
            });

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                setIsPlaying(true);
                retriesRef.current = 0;
                setRetries(0);
                setProxyOk(!directFallback);
                setStatusMsg(directFallback ? `${channel.name} (Direct)` : `⚡ ${channel.name}`);
                video.play().catch(() => {
                    setIsPlaying(false);
                    setStatusMsg('Tap ▶ to play');
                });
            });

            hls.on(Hls.Events.ERROR, (_, d) => {
                if (d.fatal) {
                    if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        const r = retriesRef.current;
                        if (r < 2) {
                            retriesRef.current = r + 1;
                            setRetries(r + 1);
                            setStatusMsg(`Reconnecting... (${r + 1}/2)`);
                            setTimeout(() => hls.startLoad(), 2000);
                        } else if (!directFallback) {
                            setStatusMsg('Trying direct...');
                            destroyHls();
                            initPlayer(channel, true);
                        } else {
                            destroyHls();
                            setIsLoading(false);
                            setStatusMsg('❌ Stream unavailable. Try another channel.');
                        }
                    } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        destroyHls();
                        setIsLoading(false);
                        setStatusMsg('❌ Playback error. Tap refresh to retry.');
                    }
                }
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari/iOS)
            video.src = src;
            video.onloadedmetadata = () => {
                setIsLoading(false);
                video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                setStatusMsg(`⚡ ${channel.name}`);
            };
            video.onerror = () => {
                if (!directFallback) initPlayer(channel, true);
                else { setIsLoading(false); setStatusMsg('❌ Stream failed'); }
            };
        } else {
            setIsLoading(false);
            setStatusMsg('HLS not supported on this browser');
        }
    }, [destroyHls]);

    useEffect(() => {
        if (activeChannel) {
            retriesRef.current = 0;
            setRetries(0);
            initPlayer(activeChannel);
        }
        return destroyHls;
    }, [activeChannel]);

    // ── CHANNEL SELECT ──────────────────────
    const selectChannel = (ch: Channel) => {
        setActiveChannel(ch);
        setTab('home');
    };

    // ── PLAYLIST LOAD ───────────────────────
    const loadPack = async (id: string, url: string, cat: string) => {
        setLoadingPack(id);
        try {
            const res = await fetch(proxy(url));
            const text = await res.text();
            const parsed = parseM3U(text, cat);
            if (parsed.length > 0) {
                const combined = [
                    ...BUILTIN_CHANNELS,
                    ...parsed.filter(p => !BUILTIN_CHANNELS.some(b => b.url === p.url))
                ];
                saveChannels(combined);
                setActiveCat(cat);
                setTab('home');
            } else {
                alert('No channels found in this pack.');
            }
        } catch {
            alert('Load failed. Check connection.');
        } finally {
            setLoadingPack(null);
        }
    };

    const addCustom = async () => {
        if (!customUrl.trim()) return;
        setLoadingPack('custom');
        try {
            const trimmed = customUrl.trim();
            if (trimmed.includes('.m3u8') || trimmed.includes('rtmp') || trimmed.includes('rtsp')) {
                const ch: Channel = {
                    id: 'custom_' + Date.now(),
                    name: 'My Stream',
                    logo: '🔗',
                    url: trimmed,
                    category: 'Custom',
                };
                saveChannels([...channels, ch]);
                selectChannel(ch);
                setCustomUrl('');
            } else {
                const res = await fetch(proxy(trimmed));
                const text = await res.text();
                const parsed = parseM3U(text, 'Custom');
                if (parsed.length > 0) {
                    saveChannels([...channels, ...parsed]);
                    alert(`✅ ${parsed.length} channels added!`);
                    setCustomUrl('');
                } else {
                    alert('No channels found in this link.');
                }
            }
        } catch {
            alert('Failed to load link.');
        } finally {
            setLoadingPack(null);
        }
    };

    // ── DISPLAY LIST ────────────────────────
    const displayed = useMemo(() => {
        let f = channels;
        if (activeCat !== 'All') f = f.filter(c => c.category === activeCat);
        if (searchQ) f = f.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()));
        return f.slice(0, 300);
    }, [channels, activeCat, searchQ]);

    const categories = useMemo(() =>
        ['All', ...Array.from(new Set(channels.map(c => c.category))).sort()],
        [channels]);

    const groupedCats = useMemo(() => {
        const priority = ['SL TV', 'Sports', 'News', 'Indian', 'Movies', 'Music', 'Kids'];
        const rest = categories.filter(c => c !== 'All' && !priority.includes(c));
        return [...priority.filter(c => categories.includes(c)), ...rest];
    }, [categories]);

    // ── FULLSCREEN ───────────────────────────
    const toggleFS = () => {
        const el = videoRef.current;
        if (!el) return;
        document.fullscreenElement ? document.exitFullscreen() :
            el.requestFullscreen?.() || (el as any).webkitRequestFullscreen?.();
    };

    const toggleMute = () => {
        if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); }
    };

    // ─────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#070709', color: '#fff', fontFamily: "'Inter', 'Segoe UI', sans-serif", overflow: 'hidden' }}>

            {/* ══════════════ PLAYER ══════════════ */}
            <div style={{ position: 'relative', flexShrink: 0, height: 'min(56vw, 260px)', background: '#000' }}>
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    playsInline autoPlay muted={isMuted}
                    onClick={() => {
                        const v = videoRef.current;
                        if (!v) return;
                        v.paused ? v.play() : v.pause();
                        setIsPlaying(!v.paused);
                    }}
                />

                {/* Top gradient */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(7,7,9,0.9), transparent)', zIndex: 10, pointerEvents: 'none' }} />
                {/* Bottom gradient */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(7,7,9,0.95), transparent)', zIndex: 10, pointerEvents: 'none' }} />

                {/* Top HUD */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', zIndex: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                            <Antenna size={11} color="#a78bfa" />
                            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: '#a78bfa' }}>SHAZAN TV</span>
                        </div>
                        {/* Zero Data Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 10, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', backdropFilter: 'blur(10px)' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'block', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.1em' }}>ZERO DATA</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { icon: <RefreshCw size={13} color="#fff" opacity={0.6} />, action: () => activeChannel && initPlayer(activeChannel) },
                            { icon: isMuted ? <VolumeX size={13} color="#f87171" /> : <Volume2 size={13} color="#fff" opacity={0.6} />, action: toggleMute },
                            { icon: <Maximize size={13} color="#fff" opacity={0.6} />, action: toggleFS },
                        ].map((b, i) => (
                            <button key={i} onClick={b.action}
                                style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {b.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom HUD */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 10px', zIndex: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 8px rgba(0,0,0,0.9)', marginBottom: 3 }}>
                            {activeChannel?.name || 'Select a Channel'}
                        </p>
                        <p style={{ fontSize: 10, color: isLoading ? '#fbbf24' : proxyOk ? '#10b981' : '#fb923c', fontWeight: 700, letterSpacing: '0.05em' }}>
                            {statusMsg}
                        </p>
                    </div>
                    <button
                        onClick={() => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); setIsPlaying(!v.paused); }}
                        style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(108,99,255,0.3)', border: '1px solid rgba(108,99,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
                        {isLoading ? <Loader2 size={16} color="#a78bfa" className="spinning" /> :
                            isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" style={{ marginLeft: 2 }} />}
                    </button>
                </div>

                {/* Loading overlay */}
                {isLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,9,0.7)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 30, pointerEvents: 'none' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.15)', animation: 'ping 1.5s infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 size={22} color="#10b981" className="spinning" />
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{statusMsg}</p>
                            <p style={{ fontSize: 9, color: 'rgba(16,185,129,0.6)', fontWeight: 900, letterSpacing: '0.2em', marginTop: 4 }}>VIU ZERO DATA ENGINE</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.25), transparent)', flexShrink: 0 }} />

            {/* ══════════════ CONTENT ══════════════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <AnimatePresence mode="wait">

                    {/* ── HOME TAB ── */}
                    {tab === 'home' && (
                        <motion.div key="home"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
                            className="no-scrollbar">

                            {/* Header */}
                            <div style={{ padding: '16px 18px 8px' }}>
                                <p style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>Welcome To</p>
                                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>SHAZAN TV</h1>
                            </div>

                            {/* Search */}
                            <div style={{ padding: '0 14px 10px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                        placeholder="Search channels..."
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '12px 14px 12px 38px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Category Pills */}
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 14px 14px' }}
                                className="no-scrollbar">
                                {['All', ...groupedCats].filter((v, i, a) => a.indexOf(v) === i).map(cat => (
                                    <button key={cat} onClick={() => setActiveCat(cat)}
                                        style={{
                                            flexShrink: 0, padding: '8px 16px', borderRadius: 20, fontSize: 10, fontWeight: 900,
                                            letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: activeCat === cat ? '#fff' : 'rgba(255,255,255,0.05)',
                                            color: activeCat === cat ? '#000' : 'rgba(255,255,255,0.4)',
                                        }}>
                                        {CAT_ICONS[cat] || '📦'} {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Channel Sections */}
                            <div style={{ paddingBottom: 100 }}>
                                {(activeCat === 'All' ? groupedCats : [activeCat]).map(cat => {
                                    const chs = (activeCat === 'All' ? channels : displayed).filter(c => c.category === cat);
                                    if (chs.length === 0) return null;
                                    return (
                                        <div key={cat} style={{ marginBottom: 28 }}>
                                            {/* Section header */}
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', marginBottom: 12 }}>
                                                <span style={{ fontSize: 16, marginRight: 8 }}>{CAT_ICONS[cat] || '📦'}</span>
                                                <h2 style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>{cat}</h2>
                                                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)', marginLeft: 12 }} />
                                            </div>

                                            {/* Horizontal scroll */}
                                            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 18px 4px' }}
                                                className="no-scrollbar">
                                                {(searchQ ? displayed.filter(c => c.category === cat) : chs).map(ch => {
                                                    const isActive = activeChannel?.id === ch.id;
                                                    return (
                                                        <motion.button key={ch.id}
                                                            whileTap={{ scale: 0.93 }}
                                                            onClick={() => selectChannel(ch)}
                                                            style={{
                                                                flexShrink: 0, width: 110, display: 'flex', flexDirection: 'column',
                                                                alignItems: 'center', gap: 10, padding: '16px 10px', borderRadius: 24,
                                                                border: isActive ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.06)',
                                                                background: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.03)',
                                                                cursor: 'pointer', transition: 'all 0.25s', position: 'relative'
                                                            }}>
                                                            <ChannelLogo logo={ch.logo} name={ch.name} size={48} />
                                                            {isActive && (
                                                                <div style={{ position: 'absolute', bottom: 14, right: 12, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #000', animation: 'pulse 2s infinite' }} />
                                                            )}
                                                            <span style={{ fontSize: 9, fontWeight: 900, textAlign: 'center', lineHeight: 1.3, color: isActive ? '#000' : 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                                                {ch.name}
                                                            </span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {displayed.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.3)' }}>
                                        <Radio size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                                        <p style={{ fontSize: 14, fontWeight: 700 }}>No channels found</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── CHANNELS TAB ── */}
                    {tab === 'channels' && (
                        <motion.div key="channels"
                            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                            style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 100px', minHeight: 0 }}
                            className="no-scrollbar">

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Globe size={14} color="#fff" />
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>Channel Packs</p>
                                <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 8 }}>⚡ Zero Data</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                {IPTV_PACKS.map(pl => (
                                    <motion.button key={pl.id} whileTap={{ scale: 0.95 }}
                                        onClick={() => loadPack(pl.id, pl.url, pl.name)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', borderRadius: 18,
                                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                            cursor: 'pointer', textAlign: 'left'
                                        }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                            {pl.emoji}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 11, fontWeight: 900, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</p>
                                            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0', fontWeight: 700 }}>Free · Zero Data</p>
                                        </div>
                                        {loadingPack === pl.id ?
                                            <Loader2 size={14} color="rgba(255,255,255,0.4)" className="spinning" /> :
                                            <ChevronRight size={13} color="rgba(255,255,255,0.2)" />}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Custom URL */}
                            <div style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔗 Add M3U / Stream URL</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                                        placeholder="https://example.com/stream.m3u8"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px', color: '#fff', fontSize: 12, outline: 'none' }}
                                    />
                                    <button onClick={addCustom} disabled={!customUrl.trim() || loadingPack !== null}
                                        style={{ padding: '0 16px', borderRadius: 12, background: '#059669', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {loadingPack === 'custom' ? <Loader2 size={14} color="#fff" className="spinning" /> : <PlusCircle size={14} color="#fff" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remove added channels */}
                            {channels.length > BUILTIN_CHANNELS.length && (
                                <button onClick={() => { saveChannels(BUILTIN_CHANNELS); setActiveCat('All'); }}
                                    style={{ width: '100%', marginTop: 14, padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.7)', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Trash2 size={13} /> Remove Added Packs
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ── SETTINGS TAB ── */}
                    {tab === 'settings' && (
                        <motion.div key="settings"
                            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                            style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 100px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
                            className="no-scrollbar">

                            {/* Zero Data Status */}
                            <div style={{ borderRadius: 20, padding: 18, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(7,7,9,0.9))', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Zap size={22} color="#10b981" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>Dialog Zero Data</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: zdActive ? '#10b981' : 'rgba(255,255,255,0.2)', display: 'block', animation: zdActive ? 'pulse 2s infinite' : 'none' }} />
                                                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: zdActive ? '#10b981' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                                                    {zdActive ? 'Active — All Streams Proxied' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        const v = !zdActive; setZdActive(v);
                                        localStorage.setItem('zd_active', String(v));
                                        setStatusMsg(v ? '⚡ Zero Data ON' : '⚠️ Direct Mode ON');
                                    }}
                                        style={{ padding: '8px 16px', borderRadius: 12, background: zdActive ? '#10b981' : 'rgba(255,255,255,0.1)', color: zdActive ? '#000' : '#fff', fontSize: 10, fontWeight: 900, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
                                        {zdActive ? 'ON' : 'OFF'}
                                    </button>
                                </div>

                                {/* How it works */}
                                <div style={{ borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { label: 'Traffic Fingerprint', value: 'Dialog Viu App v8.1.2' },
                                        { label: 'Host Spoof', value: 'free.viu.lk' },
                                        { label: 'Stream Proxy', value: '/api/proxy (Edge)' },
                                        { label: 'M3U8 Rewriting', value: 'Full segment proxying' },
                                    ].map(row => (
                                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{row.label}</span>
                                            <span style={{ color: '#10b981', fontWeight: 800 }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* How to use Zero Data */}
                            <div style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>📖 How to Use Without Data</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        '1. Open app once using Wi-Fi or data',
                                        '2. Add to Home Screen (PWA install)',
                                        '3. Keep Dialog SIM active (any plan)',
                                        '4. Open Shazan TV — Zero Data works!',
                                        '5. All channels stream for FREE ⚡',
                                    ].map(step => (
                                        <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                            <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* App info */}
                            <div style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total Channels</span>
                                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>{channels.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Proxy Status</span>
                                    <span style={{ fontSize: 12, color: proxyOk ? '#10b981' : '#fb923c', fontWeight: 800 }}>{proxyOk ? 'Active' : 'Direct Mode'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Version</span>
                                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>2.0 (Viu Engine)</span>
                                </div>
                            </div>

                            <button onClick={() => {
                                if (confirm('Clear all data and restart?')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                                style={{ padding: '14px', borderRadius: 16, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.7)', fontSize: 12, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em' }}>
                                Clear Cache & Reset
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ══════════════ BOTTOM NAV ══════════════ */}
            <div style={{
                flexShrink: 0, background: 'rgba(7,7,9,0.95)', backdropFilter: 'blur(24px)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))', paddingTop: 6,
                display: 'flex'
            }}>
                {([
                    { id: 'home', icon: MonitorPlay, label: 'Watch' },
                    { id: 'channels', icon: LayoutGrid, label: 'Channels' },
                    { id: 'settings', icon: ShieldCheck, label: 'Zero Data' },
                ] as { id: Tab, icon: any, label: string }[]).map(({ id, icon: Icon, label }) => {
                    const active = tab === id;
                    return (
                        <button key={id} onClick={() => setTab(id)}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} color={active ? '#10b981' : 'rgba(255,255,255,0.25)'} />
                            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? '#10b981' : 'rgba(255,255,255,0.25)' }}>{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
