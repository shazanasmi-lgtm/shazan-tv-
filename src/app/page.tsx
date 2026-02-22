"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Tv, Search, Radio, Wifi, WifiOff, Maximize, Play, Pause, Lock, Unlock,
    ChevronRight, ChevronLeft, Volume2, VolumeX, Settings, Send, Info, Zap, RefreshCw, Layers, Server,
    Globe, Activity, Filter, ChevronDown, List, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';

// --- TYPES ---
interface Channel {
    id: string;
    name: string;
    logo: string;
    url: string;
    category: string;
    country?: string;
    language?: string;
}

// --- FREE HOSTS ---
const FREE_HOSTS = [
    { id: 'direct', name: 'Direct (Normal Data)', host: 'direct', icon: '🌐' },
    { id: 'viu', name: 'Dialog Viu (Zero)', host: 'viu.lk', icon: '📺' },
    { id: 'dtv', name: 'DTV Proxy', host: 'dtv.dialog.lk', icon: '⚡' },
    { id: 'pivp', name: 'Pivp Proxy', host: 'p.pivp.lk', icon: '🚀' },
    { id: 'whatsapp', name: 'WhatsApp Pack', host: 'v.whatsapp.net', icon: '🟢' },
];

// --- BUILT-IN VERIFIED CHANNELS (always available) ---
const BUILTIN_CHANNELS: Channel[] = [
    // Verified public live HLS feeds
    { id: 'aj', name: 'Al Jazeera English', logo: '📡', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', category: 'News', country: 'Qatar', language: 'English' },
    { id: 'nhk', name: 'NHK World Japan', logo: '🏯', url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index_1M.m3u8', category: 'News', country: 'Japan', language: 'English' },
    { id: 'dw', name: 'DW English', logo: '🌍', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', category: 'News', country: 'Germany', language: 'English' },
    { id: 'france24', name: 'France 24 English', logo: '🗼', url: 'https://www.france24.com/fr/direct', category: 'News', country: 'France', language: 'English' },
    { id: 'euronews', name: 'Euronews', logo: '🇪🇺', url: 'https://euronews-prod-samsung-dplus-en.akamaized.net/hls/live/2040842/eeuronewslive/index.m3u8', category: 'News', country: 'Europe', language: 'English' },
    { id: 'f24ar', name: 'France 24 Arabic', logo: '🌙', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', category: 'News', country: 'France', language: 'Arabic' },
    { id: 'test1', name: 'HD Test Stream', logo: '📽️', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Entertainment', country: 'Global', language: 'English' },
    { id: 'citytv', name: 'Citytv Canada', logo: '🏙️', url: 'https://citytv.com/live', category: 'Entertainment', country: 'Canada', language: 'English' },
    // SL Channels
    { id: 'itn', name: 'ITN Sri Lanka', logo: '📺', url: 'https://222103-hls.akamaized.net/668828a00bf80aa436254876/live_aabd3d003af211efadcf7986aa245789/rewind-3600.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'rupa', name: 'Rupavahini', logo: '🏛️', url: 'https://slrc.live/Rupavahini/stream.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'sirasa', name: 'Sirasa TV', logo: '🌟', url: 'https://edge2-moblive.yuppcdn.net/transsd/smil:sirtv09.smil/playlist.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'derana', name: 'Derana TV', logo: '🦁', url: 'https://edge3-moblive.yuppcdn.net/transhd2/smil:detv04.smil/index.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'swarna', name: 'Swarnavahini', logo: '💎', url: 'https://edge1-moblive.yuppcdn.net/drm/smil:swarnawahinidrm.smil/manifest.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'hiru', name: 'Hiru TV', logo: '☀️', url: 'http://61.245.163.69:1935/live/hiru.stream/playlist.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'supreme', name: 'Supreme TV', logo: '🏆', url: 'http://112.134.144.172:80/live/supreme/index.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'tnl', name: 'TNL TV', logo: '📡', url: 'http://61.245.163.69:1935/live/tnl.stream/playlist.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'English' },
    { id: 'islandsports', name: 'Island Sports', logo: '🏀', url: 'http://61.245.163.69:1935/live/islandsports.stream/playlist.m3u8', category: 'SL TV', country: 'Sri Lanka', language: 'Sinhala' },
    { id: 'test_hls', name: 'HLS Test (Mux)', logo: '🛠️', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Entertainment', country: 'Global', language: 'English' },
];

// --- IPTV-ORG PLAYLISTS (10,000+ free world channels) ---
const IPTV_PLAYLISTS = [
    { id: 'world_news', name: 'World News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', category: 'News' },
    { id: 'world_sports', name: 'World Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', category: 'Sports' },
    { id: 'world_movies', name: 'World Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', category: 'Movies' },
    { id: 'world_kids', name: 'Kids & Family', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u', category: 'Kids' },
    { id: 'world_music', name: 'Music Channels', url: 'https://iptv-org.github.io/iptv/categories/music.m3u', category: 'Music' },
    { id: 'world_docu', name: 'Documentaries', url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u', category: 'Documentary' },
    { id: 'world_comedy', name: 'Comedy', url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u', category: 'Entertainment' },
    { id: 'world_religious', name: 'Religious', url: 'https://iptv-org.github.io/iptv/categories/religious.m3u', category: 'Religious' },
    { id: 'country_lk', name: '🇱🇰 Sri Lanka', url: 'https://iptv-org.github.io/iptv/countries/lk.m3u', category: 'SL TV' },
    { id: 'country_in', name: '🇮🇳 India', url: 'https://iptv-org.github.io/iptv/countries/in.m3u', category: 'India' },
    { id: 'country_us', name: '🇺🇸 USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u', category: 'USA' },
    { id: 'country_uk', name: '🇬🇧 UK', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u', category: 'UK' },
    { id: 'country_ca', name: '🇨🇦 Canada', url: 'https://iptv-org.github.io/iptv/countries/ca.m3u', category: 'Canada' },
    { id: 'country_jp', name: '🇯🇵 Japan', url: 'https://iptv-org.github.io/iptv/countries/jp.m3u', category: 'Japan' },
    { id: 'country_kr', name: '🇰🇷 Korea', url: 'https://iptv-org.github.io/iptv/countries/kr.m3u', category: 'Korea' },
    { id: 'country_au', name: '🇦🇺 Australia', url: 'https://iptv-org.github.io/iptv/countries/au.m3u', category: 'Australia' },
];

// --- M3U PARSER ---
function parseM3U(text: string, defaultCategory: string): Channel[] {
    const lines = text.split('\n');
    const channels: Channel[] = [];
    let current: Partial<Channel> | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF')) {
            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const groupMatch = line.match(/group-title="([^"]*)"/);
            const langMatch = line.match(/tvg-language="([^"]*)"/);
            const countryMatch = line.match(/tvg-country="([^"]*)"/);

            current = {
                name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                logo: logoMatch ? logoMatch[1] : '📺',
                category: groupMatch && groupMatch[1] ? groupMatch[1] : defaultCategory,
                language: langMatch ? langMatch[1] : '',
                country: countryMatch ? countryMatch[1] : '',
            };
        } else if (line.length > 5 && !line.startsWith('#') && current) {
            current.url = line;
            current.id = `iptv_${Math.random().toString(36).substr(2, 9)}`;
            if (!current.logo || current.logo === '') current.logo = '📺';
            channels.push(current as Channel);
            current = null;
        }
    }
    return channels;
}

// --- CONFIG & UTILS ---
const CORS_PROXIES = [
    '/api/proxy?url=',
    'DIRECT',
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://corsproxy.io/?'
];
const GET_PROXY_URL = (proxy: string, source: string) => {
    if (proxy === 'DIRECT') return source;
    return `${proxy}${encodeURIComponent(source)}`;
};

// ============================
// MAIN APP COMPONENT
// ============================
export default function ShazanTVApp() {
    const [allChannels, setAllChannels] = useState<Channel[]>(BUILTIN_CHANNELS);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [activeHost, setActiveHost] = useState(FREE_HOSTS[0]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isSpoofingActive, setIsSpoofingActive] = useState(false);
    const [activeProxyIndex, setActiveProxyIndex] = useState(0);
    const [status, setStatus] = useState('Ready — 5 Channels Loaded');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);
    const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);
    const [loadedPlaylists, setLoadedPlaylists] = useState<Set<string>>(new Set());
    const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);
    const [customM3uUrl, setCustomM3uUrl] = useState('');
    const [customM3uLoading, setCustomM3uLoading] = useState(false);

    const [logs, setLogs] = useState<string[]>(['System Ready.']);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const proxyRetryRef = useRef<number>(0);
    const heartbeatRef = useRef<any>(null);

    const addLog = useCallback((msg: string) => {
        setLogs((prev: string[]) => [msg, ...prev].slice(0, 20));
        console.log('[ShazanTV]', msg);
    }, []);

    const CATEGORIES = ['All', ...Array.from(new Set(allChannels.map((c: any) => c.category))).sort()];

    // --- LOAD IPTV-ORG PLAYLIST ---
    const loadPlaylist = useCallback(async (playlist: any) => {
        if (loadedPlaylists.has(playlist.id)) return;
        setLoadingPlaylist(playlist.id);
        setStatus(`Loading ${playlist.name}...`);
        try {
            const proxyUrl = GET_PROXY_URL(CORS_PROXIES[0], playlist.url);
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error('Failed');
            const text = await res.text();
            const parsed = parseM3U(text, playlist.category);
            setAllChannels((prev: any[]) => {
                const existingUrls = new Set(prev.map((c: any) => c.url));
                const unique = parsed.filter((c: any) => !existingUrls.has(c.url));
                return [...prev, ...unique];
            });
            setLoadedPlaylists((prev: Set<string>) => {
                const next = new Set(Array.from(prev));
                next.add(playlist.id);
                return next;
            });
            setActiveCategory(playlist.category);
            setStatus(`✅ ${playlist.name} loaded — ${parsed.length} channels`);
            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error(`Error loading playlist ${playlist.name}:`, err);
            setStatus(`⚠️ Could not load ${playlist.name}`);
        } finally {
            setLoadingPlaylist(null);
        }
    }, [loadedPlaylists]);

    // --- LOAD CUSTOM M3U URL ---
    const loadCustomM3U = async () => {
        if (!customM3uUrl.trim()) return;
        setCustomM3uLoading(true);
        setStatus('Loading custom playlist...');
        try {
            if (customM3uUrl.toLowerCase().endsWith('.ehi')) {
                setStatus('⚠️ EHI files are for HTTP Injector, not for M3U playlists.');
                setCustomM3uLoading(false);
                return;
            }
            const proxyUrl = GET_PROXY_URL(CORS_PROXIES[0], customM3uUrl.trim());
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error('Failed to fetch');
            const text = await res.text();
            const parsed = parseM3U(text, 'Custom');
            if (parsed.length === 0) throw new Error('No channels found');
            setAllChannels((prev: Channel[]) => {
                const existingUrls = new Set(prev.map((c: Channel) => c.url));
                const unique = parsed.filter((c: Channel) => !existingUrls.has(c.url));
                return [...prev, ...unique];
            });
            setStatus(`✅ Added ${parsed.length} channels from custom M3U`);
            setCustomM3uUrl('');
        } catch (err: any) {
            setStatus('⚠️ Failed to load M3U — check URL or CORS');
        } finally {
            setCustomM3uLoading(false);
        }
    };

    // --- PLAYER LOGIC ---
    const initializePlayer = useCallback((channel: Channel) => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const source = channel.url;

        addLog(`Connecting to: ${channel.name}...`);
        setStatus('Connecting...');
        setShowPlayOverlay(false);
        setIsPlaying(false);

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: channel.name,
                artist: 'Shazan TV',
                album: channel.category,
                artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/716/716429.png', sizes: '512x512', type: 'image/png' }]
            });
            navigator.mediaSession.setActionHandler('play', () => video.play());
            navigator.mediaSession.setActionHandler('pause', () => video.pause());
        }

        const isProxyNeeded = source.includes('iptv-org') || source.includes('github') || !source.startsWith('https') || source.includes('yuppcdn') || source.includes('akamaized.net') || source.includes('dialog.lk');

        let proxyToUse = CORS_PROXIES[activeProxyIndex % CORS_PROXIES.length];
        if (isProxyNeeded && proxyToUse === 'DIRECT' && proxyRetryRef.current === 0) {
            proxyToUse = CORS_PROXIES[0]; // Auto-force Local Proxy for SL/Restricted Links
        }

        let finalUrl = GET_PROXY_URL(proxyToUse, source);

        if (proxyToUse === '/api/proxy?url=') {
            addLog('Mode: LOCAL CLOUD PROXY (High Compatibility)');
        }

        addLog(`Route: ${proxyToUse === 'DIRECT' ? 'ISP/Direct' : 'Filtered Node'}`);

        const tryAlternative = () => {
            const nextIndex = (activeProxyIndex + 1) % CORS_PROXIES.length;
            proxyRetryRef.current += 1;

            if (proxyRetryRef.current >= CORS_PROXIES.length * 3) {
                setStatus('❌ Source Down — Try Another');
                addLog('CRITICAL: Exhausted all routes.');
                proxyRetryRef.current = 0;
                setActiveProxyIndex(0);
                return;
            }

            const proxyLabel = CORS_PROXIES[nextIndex] === 'DIRECT' ? 'Direct Connection' :
                CORS_PROXIES[nextIndex] === '/api/proxy?url=' ? 'Cloud Proxy (Stable)' :
                    `Public Proxy ${nextIndex}`;
            const msg = `Repairing: trying ${proxyLabel}...`;
            setStatus(`🔄 ${msg}`);
            addLog(msg);
            setActiveProxyIndex(nextIndex);
        };

        const startHeartbeat = () => {
            if (heartbeatRef.current) clearTimeout(heartbeatRef.current);
            heartbeatRef.current = setTimeout(() => {
                if (status.includes('Loading') || status.includes('Connecting')) {
                    addLog('Heartbeat: Load timeout, switching proxy.');
                    tryAlternative();
                }
            }, 12000);
        };

        if (hlsRef.current) { hlsRef.current.destroy(); }

        if (Hls.isSupported()) {
            console.log('HLS Supported. Initializing for:', channel.name);
            console.log('Final URL to load:', finalUrl);
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                debug: true, // Turn on debug to see what's happening
                backBufferLength: 90,
                maxBufferSize: 30 * 1000 * 1000,
                maxBufferLength: 30,
                manifestLoadingMaxRetry: 15,
                levelLoadingMaxRetry: 15,
                manifestLoadingTimeOut: 20000,
                xhrSetup: (xhr: XMLHttpRequest, url: string) => {
                    xhr.withCredentials = false;
                    // Advanced Dialog Spoofing Headers
                    if (isSpoofingActive && activeHost.host !== 'direct') {
                        xhr.setRequestHeader('X-Online-Host', activeHost.host);
                        xhr.setRequestHeader('X-Forwarded-Host', activeHost.host);
                        xhr.setRequestHeader('X-Config-Host', activeHost.host);
                    }
                    // Optional: Custom User Agent for some proxies
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                }
            });

            setStatus('Loading Steam...');
            hls.loadSource(finalUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                addLog('Stream Matched!');
                proxyRetryRef.current = 0;
                if (heartbeatRef.current) clearTimeout(heartbeatRef.current);
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => { setIsPlaying(true); setStatus('🔴 Live — ' + channel.name); })
                        .catch(() => {
                            setShowPlayOverlay(true);
                            setStatus('Ready — Tap Screen to Play');
                        });
                }
            });

            hls.on(Hls.Events.ERROR, (_: any, data: any) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            addLog(`Network Error: ${data.details} (${data.response?.code || 'No Code'})`);
                            if (data.details === 'manifestLoadError' || data.details === 'levelLoadError' || data.response?.code === 0) {
                                tryAlternative();
                            } else {
                                hls.startLoad();
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            addLog('Media Error: Recovering...');
                            setStatus('⚠️ Media Error - Recovering...');
                            hls.recoverMediaError();
                            break;
                        default:
                            addLog('Fatal Error: Rotating.');
                            tryAlternative();
                            break;
                    }
                } else {
                    setStatus('Buffering...');
                }
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = finalUrl;
            video.play()
                .then(() => { setIsPlaying(true); setStatus('🔴 Live — ' + channel.name); })
                .catch(() => { setShowPlayOverlay(true); setStatus('Ready — Tap to Play'); });
        }
    }, [isSpoofingActive, activeHost, activeProxyIndex]);

    useEffect(() => {
        if (selectedChannel) {
            initializePlayer(selectedChannel);
            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return () => { if (hlsRef.current) hlsRef.current.destroy(); };
    }, [selectedChannel, activeHost, isSpoofingActive, activeProxyIndex, initializePlayer]);

    // Handle Rotation & Fullscreen Orientation
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (document.fullscreenElement && window.screen.orientation) {
                // If we entered fullscreen and are on mobile, try to lock to landscape
                if (window.innerWidth < 768) {
                    window.screen.orientation.lock('landscape').catch(() => {
                        // Some browsers don't support locking
                    });
                }
            } else if (!document.fullscreenElement && window.screen.orientation) {
                window.screen.orientation.unlock();
            }
        };

        const handleOrientationChange = () => {
            if (window.screen.orientation.type.startsWith('landscape') && !document.fullscreenElement) {
                // If user rotates to landscape manually, suggest fullscreen
                setStatus('Rotate to watch in full screen');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.screen.orientation?.addEventListener('change', handleOrientationChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.screen.orientation?.removeEventListener('change', handleOrientationChange);
        };
    }, []);

    const handleManualPlay = () => {
        if (isLocked) { setShowUnlockPrompt(true); setTimeout(() => setShowUnlockPrompt(false), 3000); return; }
        videoRef.current?.play().then(() => { setIsPlaying(true); setShowPlayOverlay(false); });
    };

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                if (window.screen.orientation && window.innerWidth < 768) {
                    window.screen.orientation.lock('landscape').catch(() => { });
                }
            }).catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    const filteredChannels = allChannels.filter((c: Channel) => {
        const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.country || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = activeCategory === 'All' || c.category === activeCategory;
        return matchSearch && matchCat;
    });

    return (
        <main className="flex flex-col min-h-screen max-w-md mx-auto relative bg-[#0a0a0f] text-white overflow-hidden">
            {/* BG Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-700/15 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-700/10 rounded-full blur-[100px]" />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10 pb-28 no-scrollbar">

                {/* HEADER */}
                <header className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/80 backdrop-blur-xl z-40 border-b border-white/5">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
                            SHAZAN <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[10px] tracking-normal">TV</span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{status}</span>
                            {selectedChannel && (
                                <button onClick={() => initializePlayer(selectedChannel)} className="text-blue-500 hover:text-blue-400">
                                    <RefreshCw size={10} className={status.includes('...') ? 'animate-spin' : ''} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{allChannels.length.toLocaleString()} Channels Loaded</p>
                        <button onClick={() => setShowPlaylistPanel(!showPlaylistPanel)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-[10px] font-black text-blue-400">
                            <Globe size={12} /> ADD
                        </button>
                    </div>
                </header>

                {/* WORLD CHANNELS PANEL */}
                <AnimatePresence>
                    {showPlaylistPanel && (
                        <motion.section
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-white/5 bg-[#0d0d15]"
                        >
                            <div className="px-6 pt-4 pb-6">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Globe size={12} className="text-blue-400" />
                                    Load World Channels (iptv-org — 10,000+ Free)
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {IPTV_PLAYLISTS.map(pl => (
                                        <button
                                            key={pl.id}
                                            onClick={() => loadPlaylist(pl)}
                                            disabled={loadedPlaylists.has(pl.id) || loadingPlaylist === pl.id}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all border text-[10px] font-bold ${loadedPlaylists.has(pl.id)
                                                ? 'bg-green-600/10 border-green-500/30 text-green-400'
                                                : loadingPlaylist === pl.id
                                                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 animate-pulse'
                                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                                }`}
                                        >
                                            {loadingPlaylist === pl.id ? <RefreshCw size={12} className="animate-spin" /> : loadedPlaylists.has(pl.id) ? '✅' : <List size={12} />}
                                            {pl.name}
                                        </button>
                                    ))}
                                </div>

                                {/* CUSTOM M3U URL INPUT */}
                                <div className="mt-5 pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <RefreshCw size={11} className="text-purple-400" />
                                        Custom M3U Playlist URL
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            placeholder="https://example.com/channels.m3u"
                                            value={customM3uUrl}
                                            onChange={e => setCustomM3uUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && loadCustomM3U()}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all min-w-0"
                                        />
                                        <button
                                            onClick={loadCustomM3U}
                                            disabled={customM3uLoading || !customM3uUrl.trim()}
                                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${customM3uLoading
                                                ? 'bg-purple-600/10 border-purple-500/30 text-purple-400 animate-pulse'
                                                : 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30'
                                                }`}
                                        >
                                            {customM3uLoading ? <RefreshCw size={12} className="animate-spin" /> : 'LOAD'}
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-gray-600 mt-1.5">Paste any M3U / M3U8 playlist link and all channels will be added automatically.</p>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* PLAYER */}
                <section className="px-4 pt-4 pb-2" ref={containerRef}>
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 group shadow-2xl">
                        {selectedChannel ? (
                            <div className="w-full h-full relative" onClick={handleManualPlay}>
                                <video ref={videoRef} className="w-full h-full object-contain" playsInline />

                                {/* Lock overlay */}
                                <AnimatePresence>
                                    {isLocked && showUnlockPrompt && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-lg">
                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsLocked(false); }}
                                                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 border-4 border-white/20">
                                                <Lock size={28} />
                                            </button>
                                            <p className="mt-4 text-[10px] font-black tracking-[0.3em] text-white/90 uppercase">TAP TO UNLOCK</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Play overlay */}
                                <AnimatePresence>
                                    {!isLocked && showPlayOverlay && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                            <div className="w-20 h-20 bg-blue-500/90 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 backdrop-blur-sm border-4 border-white/20">
                                                <Play size={36} fill="white" className="ml-1" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Rotation Prompt */}
                                <AnimatePresence>
                                    {isPlaying && !document.fullscreenElement && window.innerWidth < window.innerHeight && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                            className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 z-30 pointer-events-none">
                                            <p className="text-[10px] font-black flex items-center gap-2">
                                                <RefreshCw size={12} className="animate-spin-slow" /> ROTATE FOR FULL SCREEN
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Spinner */}
                                {!isPlaying && !showPlayOverlay && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase">CONNECTING</span>
                                                <span className="text-[8px] text-gray-500 mt-1 uppercase">Checking Spoofing Nodes...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* HUD Top */}
                                <div className={`absolute top-3 left-3 right-3 flex justify-between items-center transition-opacity ${isLocked ? 'opacity-0' : 'opacity-100'}`}>
                                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[7px] font-black">LIVE</span>
                                    </div>
                                    <span className="text-[7px] font-mono text-blue-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-blue-500/20 truncate max-w-[140px]">
                                        {selectedChannel.name}
                                    </span>
                                </div>

                                {/* Controls overlay bottom */}
                                <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent transition-opacity ${isLocked ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsLocked(true); }} className="p-1 text-white/70 hover:text-white"><Unlock size={16} /></button>
                                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); videoRef.current?.requestPictureInPicture(); }} className="p-1 text-white/70 hover:text-white"><Layers size={16} /></button>
                                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleFullScreen(); }} className="p-1 text-white/70 hover:text-white"><Maximize size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                <Radio size={40} className="text-blue-500/20" />
                                <p className="text-gray-500 text-xs">Select a channel below</p>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="mt-2 flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                            <span className="text-[9px] text-gray-400 font-bold truncate max-w-[200px]">{status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveProxyIndex((prev: number) => (prev + 1) % CORS_PROXIES.length)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black border bg-white/5 border-white/10 text-blue-400 focus:bg-blue-500/20"
                                title="Change Proxy Server"
                            >
                                <Server size={9} /> Proxy {activeProxyIndex + 1}
                            </button>
                            <button
                                onClick={() => setIsSpoofingActive(!isSpoofingActive)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black border transition-all ${isSpoofingActive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'
                                    }`}
                            >
                                {isSpoofingActive ? <Wifi size={9} /> : <WifiOff size={9} />}
                                {isSpoofingActive ? 'BYPASS ON' : 'DIRECT'}
                            </button>
                        </div>
                    </div>

                    {/* Debug Console */}
                    <div className="mt-3 bg-black/40 rounded-lg p-3 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Diagnostic Logs</span>
                            <div className="flex gap-2">
                                <button onClick={() => { proxyRetryRef.current = 0; setActiveProxyIndex(0); initializePlayer(selectedChannel!); }} className="text-[9px] text-green-400 hover:text-green-300 font-bold px-2 py-0.5 bg-green-400/10 rounded uppercase">Re-Check</button>
                                <button onClick={() => setLogs([])} className="text-[9px] text-gray-400 hover:text-white px-2 py-0.5 bg-white/5 rounded">Clear</button>
                            </div>
                        </div>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto no-scrollbar font-mono text-[8px]">
                            {logs.map((log, i) => (
                                <div key={i} className={`pl-2 py-1 border-l-2 ${log.includes('CRITICAL') ? 'text-red-400 border-red-500 bg-red-500/5' : log.includes('Matched') ? 'text-green-400 border-green-500 bg-green-500/5' : 'text-gray-400 border-white/10'}`}>
                                    <span className="text-gray-600 opacity-50">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> {log}
                                </div>
                            ))}
                        </div>
                        {proxyRetryRef.current > 0 && (
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px]">
                                <span className="text-gray-500 italic">Current Route: {CORS_PROXIES[activeProxyIndex] === 'DIRECT' ? 'Direct Connection' : 'Filtered Proxy Cluster'}</span>
                                <span className="text-blue-400 font-bold uppercase">Retry {proxyRetryRef.current}/{CORS_PROXIES.length - 1}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* BYPASS NODES */}
                {isSpoofingActive && (
                    <section className="px-4 mb-4">
                        <div className="flex overflow-x-auto gap-2 no-scrollbar">
                            {FREE_HOSTS.filter(h => h.id !== 'direct').map(host => (
                                <button key={host.id} onClick={() => setActiveHost(host)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black border transition-all ${activeHost.id === host.id
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                        : 'bg-white/5 border-white/5 text-gray-400'
                                        }`}
                                >
                                    <span>{host.icon}</span> {host.name}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
                {/* DIALOG ZERO DATA INFO */}
                <section className="px-6 py-4">
                    <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-3xl p-5 shadow-inner">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                                <Zap className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white">Shazan TV Smart Bypass</h2>
                                <p className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wider">Watch without consuming data</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                                <h3 className="text-[11px] font-black text-blue-400 mb-1 uppercase">How to use (Zero Data):</h3>
                                <ul className="text-[10px] text-gray-400 space-y-1.5 font-bold">
                                    <li className="flex gap-2"><span>1.</span><span>Turn on <b>BYPASS</b> (Zap icon) below until it's Green.</span></li>
                                    <li className="flex gap-2"><span>2.</span><span>Go to <b>CRICKET</b> category to find match links.</span></li>
                                    <li className="flex gap-2"><span>3.</span><span>These links bypass Dialog data tracking.</span></li>
                                </ul>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsSpoofingActive(!isSpoofingActive)}
                                    className={`flex-1 py-3 rounded-2xl font-black text-[10px] transition-all shadow-lg ${isSpoofingActive
                                        ? 'bg-green-500 text-black shadow-green-500/20'
                                        : 'bg-blue-600 text-white shadow-blue-600/20'
                                        }`}
                                >
                                    {isSpoofingActive ? '✅ ACTIVE' : '🚀 ACTIVATE'}
                                </button>
                                <a
                                    href="/shazan-tv.ehi"
                                    download="shazan-tv.ehi"
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-gray-400 hover:text-white transition-colors"
                                    title="Download for HTTP Injector"
                                >
                                    EHI
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-4 mb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder={`Search ${allChannels.length}+ channels...`}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                        />
                    </div>
                </section>

                {/* CATEGORIES */}
                <section className="mb-3">
                    <div className="flex overflow-x-auto gap-2 px-4 no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'bg-white/5 text-gray-500 border border-white/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* CHANNEL RESULTS COUNT */}
                <div className="px-4 mb-2">
                    <p className="text-[9px] text-gray-600 font-bold">{filteredChannels.length.toLocaleString()} channels {activeCategory !== 'All' ? `in ${activeCategory}` : 'total'}</p>
                </div>

                {/* CHANNEL GRID */}
                <section className="px-4">
                    <div className="grid grid-cols-2 gap-3">
                        {filteredChannels.slice(0, 200).map(channel => (
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                key={channel.id}
                                onClick={() => { setSelectedChannel(channel); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`relative flex flex-col items-start p-3 rounded-2xl text-left transition-all group border ${selectedChannel?.id === channel.id
                                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {/* Logo area */}
                                <div className="w-full flex items-center justify-center mb-2 h-10">
                                    {channel.logo && channel.logo.startsWith('http') ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={channel.logo} alt="" className="h-8 w-auto max-w-full object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    ) : (
                                        <span className="text-3xl">{channel.logo || '📺'}</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-white leading-tight line-clamp-2 w-full">{channel.name}</span>
                                <div className="flex items-center justify-between w-full mt-1">
                                    <span className="text-[7px] font-bold text-gray-500 uppercase tracking-wide truncate">{channel.category}</span>
                                    {channel.country && <span className="text-[7px] text-gray-600 truncate ml-1">{channel.country}</span>}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                    {filteredChannels.length > 200 && (
                        <p className="text-center text-[9px] text-gray-600 font-bold mt-4 pb-2">
                            Showing 200 of {filteredChannels.length} — use search to narrow results
                        </p>
                    )}
                </section>
            </div>

            {/* BOTTOM NAV */}
            <nav className="fixed bottom-4 left-4 right-4 bg-[#13131f]/90 backdrop-blur-2xl rounded-[28px] px-4 py-3 flex items-center justify-around z-50 border border-white/10 shadow-2xl">
                <button onClick={() => { setActiveCategory('All'); setShowPlaylistPanel(false); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex flex-col items-center gap-0.5 ${activeCategory === 'All' && !showPlaylistPanel ? 'text-blue-400' : 'text-gray-500'}`}>
                    <Tv size={18} /><span className="text-[7px] font-black">LIVE</span>
                </button>
                <button
                    onClick={() => {
                        const nextState = !showPlaylistPanel;
                        setShowPlaylistPanel(nextState);
                        if (nextState && scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center gap-0.5 ${showPlaylistPanel ? 'text-blue-400' : 'text-gray-500'}`}
                >
                    <Globe size={18} /><span className="text-[7px] font-black">WORLD</span>
                </button>
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-600/40 -mt-6 border-4 border-[#0a0a0f]" onClick={() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <Play size={18} fill="white" className="ml-0.5 text-white" />
                </div>
                <button onClick={() => setIsSpoofingActive(!isSpoofingActive)} className={`flex flex-col items-center gap-0.5 ${isSpoofingActive ? 'text-green-400' : 'text-gray-500'}`}>
                    <Zap size={18} /><span className="text-[7px] font-black">BYPASS</span>
                </button>
                <button className="flex flex-col items-center gap-0.5 text-gray-500">
                    <Settings size={18} /><span className="text-[7px] font-black">MORE</span>
                </button>
            </nav>
        </main>
    );
}
