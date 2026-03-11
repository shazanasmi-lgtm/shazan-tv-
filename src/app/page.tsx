"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Search, MonitorPlay, Globe, Film, Music, Tv as TvIcon, Gamepad2,
    Maximize, Loader2, PlusCircle, LayoutGrid, Zap,
    ShieldCheck, Radio, Settings, Home, Volume2, VolumeX,
    RefreshCw, Play, Pause, ChevronRight, Sparkles, Antenna,
    Star, Wifi, Signal, Info, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Channel {
    id: string;
    name: string;
    logo: string;
    url: string;
    category: string;
}

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const BUILTIN_CHANNELS: Channel[] = [
    { id: 'itn', name: 'ITN', logo: '📺', url: 'https://live.itn.lk/itn/index.m3u8', category: 'SL TV' },
    { id: 'sirasa', name: 'Sirasa TV', logo: '🌟', url: 'https://edge2-moblive.yuppcdn.net/transsd/smil:sirtv09.smil/playlist.m3u8', category: 'SL TV' },
    { id: 'derana', name: 'Derana TV', logo: '🦁', url: 'https://edge3-moblive.yuppcdn.net/transhd2/smil:detv04.smil/index.m3u8', category: 'SL TV' },
    { id: 'hiru', name: 'Hiru TV', logo: '☀️', url: 'http://61.245.163.69:1935/live/hiru.stream/playlist.m3u8', category: 'SL TV' },
    { id: 'rupa', name: 'Rupavahini', logo: '🏛️', url: 'https://slrc.live/Rupavahini/stream.m3u8', category: 'SL TV' },
    { id: 'dw', name: 'DW English', logo: '🌍', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', category: 'News' },
    { id: 'aj', name: 'Al Jazeera', logo: '📡', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', category: 'News' },
    { id: 'nhk', name: 'NHK World', logo: '🏯', url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index_1M.m3u8', category: 'News' },
    { id: 'france24', name: 'France 24', logo: '🗼', url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8', category: 'News' },
    { id: 'test', name: 'HD Test', logo: '📽️', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Test' },
];

const IPTV_PLAYLISTS = [
    { id: 'country_lk', name: 'Sri Lanka', emoji: '🇱🇰', url: 'https://iptv-org.github.io/iptv/countries/lk.m3u', color: 'from-amber-500 to-orange-600', glow: 'rgba(251,146,60,0.3)' },
    { id: 'world_news', name: 'News', emoji: '📰', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', color: 'from-blue-500 to-indigo-600', glow: 'rgba(99,102,241,0.3)' },
    { id: 'world_sports', name: 'Sports', emoji: '⚽', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', color: 'from-orange-500 to-red-600', glow: 'rgba(239,68,68,0.3)' },
    { id: 'world_movies', name: 'Movies', emoji: '🎬', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', color: 'from-purple-500 to-pink-600', glow: 'rgba(168,85,247,0.3)' },
    { id: 'world_music', name: 'Music', emoji: '🎵', url: 'https://iptv-org.github.io/iptv/categories/music.m3u', color: 'from-teal-400 to-emerald-600', glow: 'rgba(16,185,129,0.3)' },
    { id: 'world_kids', name: 'Kids', emoji: '🧒', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u', color: 'from-yellow-400 to-orange-500', glow: 'rgba(234,179,8,0.3)' },
];

const CATEGORY_ICONS: Record<string, string> = {
    'All': '✦',
    'SL TV': '🇱🇰',
    'News': '📰',
    'Sports': '⚽',
    'Movies': '🎬',
    'Music': '🎵',
    'Kids': '🧒',
    'Test': '📡',
    'Custom': '🔗',
};

// AUTO PROXY ENABLED FOR EVERY REQUEST TO INSULATE FOR ZERO DATA
function getProxyUrl(url: string) {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
}

function parseM3U(text: string, defaultCategory: string): Channel[] {
    const lines = text.split('\n');
    const channels: Channel[] = [];
    let current: Partial<Channel> | null = null;
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('#EXTINF')) {
            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const groupMatch = line.match(/group-title="([^"]*)"/);
            current = {
                name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                logo: logoMatch && logoMatch[1] ? logoMatch[1] : '📺',
                category: groupMatch && groupMatch[1] ? groupMatch[1] : defaultCategory,
            };
        } else if (line.length > 5 && !line.startsWith('#') && current) {
            current.url = line;
            current.id = `ch_${Math.random().toString(36).substr(2, 9)}`;
            channels.push(current as Channel);
            current = null;
        }
    }
    return channels;
}

type Tab = 'home' | 'channels' | 'settings';

function ChannelLogo({ logo, name, size = 36 }: { logo: string; name: string; size?: number }) {
    const [imgError, setImgError] = useState(false);
    const isUrl = logo.startsWith('http');

    if (isUrl && !imgError) {
        return (
            <img
                src={logo}
                alt={name}
                style={{ width: size, height: size }}
                className="object-contain rounded-lg"
                onError={() => setImgError(true)}
            />
        );
    }
    return (
        <span style={{ fontSize: size * 0.65 }} className="leading-none select-none">
            {logo.length <= 4 ? logo : '📺'}
        </span>
    );
}

export default function ShazanTVApp() {
    const [channels, setChannels] = useState<Channel[]>(BUILTIN_CHANNELS);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(BUILTIN_CHANNELS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingStream, setIsLoadingStream] = useState(false);
    const [statusMsg, setStatusMsg] = useState('Optimized for Dialog');
    const [isMuted, setIsMuted] = useState(false);

    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<Tab>('home');
    const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
    const [customUrl, setCustomUrl] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // --- PERSISTENCE ---
    useEffect(() => {
        try {
            const saved = localStorage.getItem('shazan_channels_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?.length > 0) setChannels(parsed);
            }
        } catch { }
    }, []);

    const saveChannels = (c: Channel[]) => {
        setChannels(c);
        localStorage.setItem('shazan_channels_v2', JSON.stringify(c.slice(0, 1000)));
    };

    // --- PLAYER ---
    const initPlayer = useCallback((channel: Channel) => {
        if (!videoRef.current) return;
        setIsPlaying(false);
        setIsLoadingStream(true);
        setStatusMsg('⚡ Establishing Zero Data Stream...');
        const video = videoRef.current;

        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

        // MANDATORY PROXY FOR EVERYTHING TO ENSURE BYPASS
        const src = getProxyUrl(channel.url);

        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 60,
                enableWorker: true,
                lowLatencyMode: true,
                manifestLoadingMaxRetry: 5,
                levelLoadingMaxRetry: 5
            });
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoadingStream(false);
                setIsPlaying(true);
                setStatusMsg(`Active · ${channel.name}`);
                video.play().catch(() => { setIsPlaying(false); setStatusMsg('Tap to start'); });
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        setStatusMsg('Retrying connection...');
                        hls.loadSource(src); // Retry the same proxy URL
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                        setIsLoadingStream(false);
                        setStatusMsg('Channel unavailable');
                    }
                } else {
                    setStatusMsg('Buffering...');
                }
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.onloadedmetadata = () => {
                setIsLoadingStream(false);
                video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            };
        }
    }, []);

    useEffect(() => {
        if (activeChannel) initPlayer(activeChannel);
        return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
    }, [activeChannel, initPlayer]);

    const handleLoadPlaylist = async (id: string, url: string, category: string) => {
        setLoadingPlaylistId(id);
        try {
            // Fetch playlist through proxy to bypass any data restrictions on JSON/M3U fetching
            const res = await fetch(getProxyUrl(url));
            const text = await res.text();
            const parsed = parseM3U(text, category);
            if (parsed.length > 0) { saveChannels([...BUILTIN_CHANNELS, ...parsed]); setActiveCategory(category); }
            else alert('No channels found.');
        } catch { alert('Network error. Check your Dialog SIM.'); }
        finally { setLoadingPlaylistId(null); }
    };

    const handleCustomAdd = async () => {
        if (!customUrl.trim()) return;
        setLoadingPlaylistId('custom');
        try {
            if (customUrl.includes('.m3u8')) {
                const newCh: Channel = { id: 'custom_' + Date.now(), name: 'Custom Stream', logo: '🔗', url: customUrl.trim(), category: 'Custom' };
                saveChannels([...channels, newCh]);
                setActiveChannel(newCh);
                setTab('home');
                setCustomUrl('');
                return;
            }
            const res = await fetch(getProxyUrl(customUrl.trim()));
            const text = await res.text();
            const parsed = parseM3U(text, 'Custom');
            if (parsed.length > 0) { saveChannels([...channels, ...parsed]); alert(`✅ ${parsed.length} channels added!`); }
            else alert('No valid channels found.');
            setCustomUrl('');
        } catch { alert('Link failed.'); }
        finally { setLoadingPlaylistId(null); }
    };

    const displayChannels = useMemo(() => {
        let f = channels;
        if (activeCategory !== 'All') f = f.filter(c => c.category === activeCategory);
        if (searchQuery) f = f.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return f.slice(0, 200);
    }, [channels, activeCategory, searchQuery]);

    const categoriesList = useMemo(() => ['All', ...Array.from(new Set(channels.map(c => c.category))).sort()], [channels]);

    const handleChannelSelect = (ch: Channel) => {
        setActiveChannel(ch);
        setTab('home');
    };

    const toggleFullscreen = () => {
        const el = videoRef.current;
        if (!el) return;
        if (document.fullscreenElement) { document.exitFullscreen(); }
        else { el.requestFullscreen?.() || (el as any).webkitRequestFullscreen?.(); }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVideoTap = () => {
        const v = videoRef.current;
        if (!v) return;
        v.paused ? v.play() : v.pause();
        setIsPlaying(!v.paused);
    };

    return (
        <div className="flex flex-col h-screen bg-hero text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ==================== PLAYER ==================== */}
            <div className="player-wrapper flex-shrink-0" style={{ height: 'min(56vw, 300px)' }}>
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain bg-black"
                    playsInline
                    autoPlay
                    muted={isMuted}
                    onClick={handleVideoTap}
                />

                {/* Gradient overlays */}
                <div className="player-gradient-top absolute top-0 left-0 right-0 h-20 z-10 pointer-events-none" />
                <div className="player-gradient-bottom absolute bottom-0 left-0 right-0 h-24 z-10 pointer-events-none" />

                {/* Top HUD */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 z-20">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
                            <Antenna size={11} className="text-violet-400" />
                            <span className="text-xs font-black tracking-widest" style={{ color: '#a78bfa', fontSize: 10 }}>SHAZAN TV</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                            style={{ background: 'rgba(16,185,129,0.75)', backdropFilter: 'blur(8px)' }}>
                            <Zap size={9} className="text-white" />
                            <span className="text-white font-black" style={{ fontSize: 9 }}>DIALOG ZERO DATA ACTIVE</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => activeChannel && initPlayer(activeChannel)}
                            className="flex items-center justify-center rounded-xl"
                            style={{ width: 34, height: 34, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <RefreshCw size={13} className={cn("text-white/60", isLoadingStream && "spinning text-violet-400")} />
                        </button>
                        <button
                            onClick={toggleMute}
                            className="flex items-center justify-center rounded-xl"
                            style={{ width: 34, height: 34, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {isMuted ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} className="text-white/60" />}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center justify-center rounded-xl"
                            style={{ width: 34, height: 34, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Maximize size={13} className="text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Bottom HUD */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-20 pointer-events-none">
                    <div className="flex items-end justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-white truncate" style={{ fontSize: 15, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                                {activeChannel?.name || 'Select a channel'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-xs truncate font-bold" style={{ color: 'rgba(16,185,129,0.9)', fontSize: 10 }}>
                                    Zero Data Connected
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                            <div
                                className="flex items-center justify-center rounded-xl pointer-events-auto"
                                style={{ width: 38, height: 38, background: 'rgba(108,99,255,0.25)', border: '1px solid rgba(108,99,255,0.4)' }}
                                onClick={handleVideoTap}
                            >
                                {isLoadingStream ? (
                                    <Loader2 size={16} className="text-violet-300 spinning" />
                                ) : isPlaying ? (
                                    <Pause size={16} className="text-white" />
                                ) : (
                                    <Play size={16} className="text-white ml-0.5" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading overlay */}
                <AnimatePresence>
                    {isLoadingStream && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none gap-4"
                            style={{ background: 'rgba(5,5,7,0.6)', backdropFilter: 'blur(8px)' }}
                        >
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-16 h-16 rounded-full border-2 border-emerald-500/20 animate-ping" />
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.2))', border: '1px solid rgba(16,185,129,0.5)' }}>
                                    <Loader2 size={20} className="text-emerald-300 spinning" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white/80">{statusMsg}</p>
                                <p className="text-[10px] text-emerald-400/60 mt-1 uppercase tracking-widest font-black">Powered by Dialog Viu</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-shrink-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }} />

            {/* ==================== CONTENT ==================== */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <AnimatePresence mode="wait">

                    {/* ---- HOME TAB ---- */}
                    {tab === 'home' && (
                        <motion.div key="home"
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <div className="flex-shrink-0 px-4 pt-3 pb-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search channels..."
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            <div className="flex-shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
                                {categoriesList.map(cat => (
                                    <button
                                        key={cat} onClick={() => setActiveCategory(cat)}
                                        className={cn("category-pill flex-shrink-0", activeCategory === cat ? "active" : "inactive")}
                                    >
                                        {CATEGORY_ICONS[cat] || '📦'} {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3">
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                    {displayChannels.map((ch, idx) => {
                                        const isActive = activeChannel?.id === ch.id;
                                        return (
                                            <motion.button
                                                key={ch.id}
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                                whileTap={{ scale: 0.91 }}
                                                onClick={() => handleChannelSelect(ch)}
                                                className={cn("channel-card aspect-square flex flex-col items-center justify-center gap-2 p-2 relative z-0", isActive && "active")}
                                            >
                                                {isActive && <span className="absolute top-2 right-2 w-2 h-2 rounded-full live-dot z-10" style={{ background: '#10b981' }} />}
                                                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl"
                                                    style={{
                                                        background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                                        border: isActive ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.05)'
                                                    }}>
                                                    <ChannelLogo logo={ch.logo} name={ch.name} size={28} />
                                                </div>
                                                <span className="relative z-10 font-bold text-center leading-tight line-clamp-2 px-1 w-full"
                                                    style={{ fontSize: 9, color: isActive ? '#6ee7b7' : 'rgba(255,255,255,0.65)' }}>
                                                    {ch.name}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ---- CHANNELS TAB ---- */}
                    {tab === 'channels' && (
                        <motion.div key="channels"
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-4"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                    <Globe size={13} className="text-white" />
                                </div>
                                <p className="text-sm font-black text-white">Channel Packs (Auto Zero Data)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {IPTV_PLAYLISTS.map((pl, idx) => (
                                    <motion.button
                                        key={pl.id} onClick={() => handleLoadPlaylist(pl.id, pl.url, pl.name)}
                                        className="playlist-card text-left"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pl.color} flex items-center justify-center flex-shrink-0`}>
                                            <span style={{ fontSize: 18 }}>{pl.emoji}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-white truncate" style={{ fontSize: 12 }}>{pl.name}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Free · Zero Data</p>
                                        </div>
                                        {loadingPlaylistId === pl.id ? <Loader2 size={14} className="text-white/40 spinning" /> : <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="rounded-2xl p-4" style={{ background: 'rgba(17,17,24,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-xs font-black mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>🔗 Add Custom M3U</p>
                                <div className="flex gap-2">
                                    <input
                                        value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                                        placeholder="Paste m3u link here..." className="search-input flex-1" style={{ borderRadius: 12, paddingLeft: 14 }}
                                    />
                                    <button
                                        onClick={handleCustomAdd} disabled={!customUrl.trim() || loadingPlaylistId !== null}
                                        className="px-4 rounded-xl font-black text-white text-xs bg-emerald-600 shadow-lg active:scale-95"
                                    >
                                        {loadingPlaylistId === 'custom' ? <Loader2 size={13} className="spinning" /> : <PlusCircle size={13} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ---- SETTINGS TAB ---- */}
                    {tab === 'settings' && (
                        <motion.div key="settings"
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-4 space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                    <ShieldCheck size={13} className="text-white" />
                                </div>
                                <p className="text-sm font-black text-white">System Status</p>
                            </div>

                            {/* Active Status Card */}
                            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(17,24,39,0.9))', border: '1px solid rgba(16,185,129,0.3)' }}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                        <Zap size={24} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white">Dialog Zero Data</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">ACTIVE & OPTIMIZED</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: 'rgba(110,231,183,0.7)' }}>
                                    Traffic is automatically routed via <strong>viu.lk</strong>. You can watch all channels even with <strong>Rs. 0.00</strong> balance on your Dialog SIM.
                                </p>
                            </div>

                            {/* Info Card */}
                            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(17,17,24,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Device Info</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-white/50"><Smartphone size={14} /> Connection</div>
                                        <span className="font-bold text-emerald-400">Secure Proxy (Viu)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-white/50"><Signal size={14} /> Optimization</div>
                                        <span className="font-bold text-white">Data Free Mode</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => confirm('Reset app?') && localStorage.clear() && window.location.reload()}
                                className="w-full py-4 rounded-2xl font-black text-sm text-red-400/80 bg-red-500/5 border border-red-500/10 active:scale-95"
                            >
                                Clear Cache & Restart
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ==================== BOTTOM NAV ==================== */}
            <div className="flex-shrink-0" style={{ background: 'rgba(5,5,7,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingTop: 4 }}>
                <div className="flex items-center justify-around px-2">
                    {[
                        { id: 'home', icon: MonitorPlay, label: 'Watch' },
                        { id: 'channels', icon: LayoutGrid, label: 'Channels' },
                        { id: 'settings', icon: Settings, label: 'Status' },
                    ].map(item => {
                        const isActive = tab === item.id;
                        return (
                            <button key={item.id} onClick={() => setTab(item.id as Tab)} className={cn("nav-item flex-1", isActive && "active")}>
                                <item.icon size={21} strokeWidth={isActive ? 2.5 : 1.5} className="nav-icon" style={{ color: isActive ? '#10b981' : 'rgba(255,255,255,0.3)' }} />
                                <span className="nav-label" style={{ color: isActive ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
