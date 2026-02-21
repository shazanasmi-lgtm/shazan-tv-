"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Play,
    Tv,
    Settings,
    Zap,
    Info,
    Wifi,
    WifiOff,
    Search,
    Maximize,
    Volume2,
    Lock,
    Unlock,
    Activity,
    Smartphone,
    Layers,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';

// --- DATA TYPES ---
interface Channel {
    id: string;
    name: string;
    logo: string;
    url: string;
    category: string;
}

// --- CONFIG ---
const FREE_HOSTS = [
    { id: 'viu', name: 'Dialog Viu (Zero)', host: 'viu.lk', icon: '📺' },
    { id: 'pivp', name: 'DTV Proxy', host: 'p.pivp.lk', icon: '⚡' },
    { id: 'whatsapp', name: 'WhatsApp Pack', host: 'v.whatsapp.net', icon: '🟢' },
    { id: 'dialog_portal', name: 'Zero Portal', host: 'tm.dialog.lk', icon: '🔵' },
];

const CHANNELS: Channel[] = [
    // --- SPORTS (Real Streams) ---
    { id: 'sp1', name: 'Star Sports 1 HD', logo: '🏏', url: 'https://ythls.armelin.one/channel/UCOivPJiXBMmxhsC8uLRr-cg.m3u8', category: 'Sports' },
    { id: 'sp2', name: 'Star Sports 2', logo: '🏏', url: 'https://ythls.armelin.one/channel/UCLx9D5GDcpGEFxUrn3WIHBQ.m3u8', category: 'Sports' },
    { id: 'sp3', name: 'Sony Ten 1', logo: '�', url: 'https://ythls.armelin.one/channel/UCkFl5MIEHCuNHFT8Pqe59vA.m3u8', category: 'Sports' },
    { id: 'sp4', name: 'DTV Sports Live', logo: '⚽', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },

    // --- NEWS (Verified Public HLS Streams) ---
    { id: 'n1', name: 'Al Jazeera English', logo: '📡', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', category: 'News' },
    { id: 'n2', name: 'NHK World Japan', logo: '🏯', url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index_1M.m3u8', category: 'News' },
    { id: 'n3', name: 'DW English TV', logo: '�', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', category: 'News' },
    { id: 'n4', name: 'France 24 English', logo: '🗼', url: 'https://static.france.tv/live/france-24/hls/france-24.m3u8', category: 'News' },
    { id: 'n5', name: 'Euronews', logo: '🇪🇺', url: 'https://euronews-prod-samsung-dplus-en.akamaized.net/hls/live/2040842/eeuronewslive/index.m3u8', category: 'News' },

    // --- MOVIES ---
    { id: 'm1', name: 'Bollywood Hub', logo: '🎬', url: 'https://ythls.armelin.one/channel/UClSHjnYkRLGR7EQnJJqA7mg.m3u8', category: 'Movies' },
    { id: 'm2', name: 'Hollywood Movies', logo: '🍿', url: 'https://ythls.armelin.one/channel/UCczXE3ckOBe5I5_cGrp-aKA.m3u8', category: 'Movies' },
    { id: 'm3', name: 'Tamil Movies', logo: '🎭', url: 'https://ythls.armelin.one/channel/UC1kTgMWWtNmgZV-dP3LBKFQ.m3u8', category: 'Movies' },

    // --- DOCUMENTARY ---
    { id: 'd1', name: 'Discovery Science', logo: '🔭', url: 'https://ythls.armelin.one/channel/UCWX3yGbOHDZCOtCmFjSFDaA.m3u8', category: 'Documentary' },
    { id: 'd2', name: 'Nat Geo Wild', logo: '🐆', url: 'https://ythls.armelin.one/channel/UCpVm7bg6pXKo1Pr6k5kxG9A.m3u8', category: 'Documentary' },

    // --- ENTERTAINMENT ---
    { id: 'e1', name: 'Sony TV India', logo: '�', url: 'https://ythls.armelin.one/channel/UCQd-0MghMaPKtEdhYM5bkUQ.m3u8', category: 'Entertainment' },
    { id: 'e2', name: 'Colors TV', logo: '🌈', url: 'https://ythls.armelin.one/channel/UCx5XPfXxRQhWFl5OxNPD39A.m3u8', category: 'Entertainment' },
    { id: 'e3', name: 'Zee TV', logo: '⭐', url: 'https://ythls.armelin.one/channel/UCppHk8KJFyq_SQwY7Y5IQEA.m3u8', category: 'Entertainment' },

    // --- SRI LANKAN TV ---
    { id: 'sl1', name: 'ITN Sri Lanka', logo: '📺', url: 'https://cdn.itn.lk/live/stream.m3u8', category: 'SL TV' },
    { id: 'sl2', name: 'Rupavahini', logo: '🏛️', url: 'https://slrc.live/Rupavahini/stream.m3u8', category: 'SL TV' },
    { id: 'sl3', name: 'Sirasa TV', logo: '🌟', url: 'https://sirasa.m3u8.stream/live.m3u8', category: 'SL TV' },
    { id: 'sl4', name: 'Derana TV', logo: '🦁', url: 'https://derana.m3u8.stream/live.m3u8', category: 'SL TV' },
    { id: 'sl5', name: 'Hiru TV', logo: '☀️', url: 'https://hiru.m3u8.stream/live.m3u8', category: 'SL TV' },
    { id: 'sl6', name: 'Swarnavahini', logo: '🌅', url: 'https://swarna.m3u8.stream/live.m3u8', category: 'SL TV' },
    { id: 'sl7', name: 'TV1 Sri Lanka', logo: '📡', url: 'https://tv1.m3u8.stream/live.m3u8', category: 'SL TV' },
];

export default function ShazanTVApp() {
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [activeHost, setActiveHost] = useState(FREE_HOSTS[0]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isSpoofingActive, setIsSpoofingActive] = useState(true);
    const [status, setStatus] = useState('System Ready');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const CATEGORIES = ['All', 'Sports', 'Movies', 'News', 'Documentary', 'Entertainment', 'SL TV'];

    // --- VIDEO PLAYBACK LOGIC ---
    const initializePlayer = (channel: Channel) => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const source = channel.url;

        setStatus('Connecting...');
        setShowPlayOverlay(false);
        setIsPlaying(false);

        // Media Session Setup for Background Play
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: channel.name,
                artist: 'Shazan TV - Premium Streaming',
                album: channel.category,
                artwork: [
                    { src: 'https://cdn-icons-png.flaticon.com/512/716/716429.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => video.play());
            navigator.mediaSession.setActionHandler('pause', () => video.pause());
        }

        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });

            const bypassed = isSpoofingActive ? `https://p.pivp.lk/proxy?url=${encodeURIComponent(source)}&host=${activeHost.host}` : source;
            hls.loadSource(bypassed);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().then(() => {
                    setIsPlaying(true);
                    setStatus('Streaming: ' + channel.name);
                }).catch(() => {
                    setShowPlayOverlay(true);
                    setStatus('Tap to Resume');
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    setStatus('Stream Error');
                    hls.recoverMediaError();
                }
            });

            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            const bypassed = isSpoofingActive ? `https://p.pivp.lk/proxy?url=${encodeURIComponent(source)}&host=${activeHost.host}` : source;
            video.src = bypassed;
            video.play()
                .then(() => { setIsPlaying(true); setStatus('Streaming: ' + channel.name); })
                .catch(() => { setShowPlayOverlay(true); setStatus('Tap to Resume'); });
        }
    };

    useEffect(() => {
        if (selectedChannel) {
            initializePlayer(selectedChannel);
        }
        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [selectedChannel, activeHost, isSpoofingActive]);

    const handleManualPlay = () => {
        if (isLocked) {
            setShowUnlockPrompt(true);
            setTimeout(() => setShowUnlockPrompt(false), 3000);
            return;
        }
        if (videoRef.current) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
                setShowPlayOverlay(false);
                if (selectedChannel) setStatus('Streaming: ' + selectedChannel.name);
            });
        }
    };

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error("Fullscreen failed", err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const playChannel = (channel: Channel) => {
        setSelectedChannel(channel);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredChannels = CHANNELS.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden bg-[#0a0a0f] text-white">

            {/* --- BACKGROUND DECOR --- */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
                {/* --- HEADER --- */}
                <header className="p-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-blue-400" />
                            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                SHAZAN TV
                            </h1>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Premium Zero-Data Player</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 glass rounded-xl text-gray-400">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* --- PLAYER SECTION --- */}
                <section className="px-6 mb-8" ref={containerRef}>
                    <div className="relative aspect-video glass rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5 group">
                        {selectedChannel ? (
                            <div className="w-full h-full relative" onClick={() => handleManualPlay()}>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-contain"
                                    playsInline
                                    poster={selectedChannel.logo}
                                />

                                {/* Lock Prompt Overlay */}
                                <AnimatePresence>
                                    {isLocked && showUnlockPrompt && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsLocked(false); }}
                                                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50"
                                            >
                                                <Lock size={28} />
                                            </button>
                                            <p className="mt-4 text-[10px] font-bold tracking-[0.2em]">TAP TO UNLOCK</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Play Overlay */}
                                <AnimatePresence>
                                    {!isLocked && showPlayOverlay && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
                                        >
                                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                                                <Play size={32} fill="white" className="ml-1" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!isPlaying && !showPlayOverlay && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
                                            <span className="text-[9px] font-bold text-blue-400 tracking-widest uppercase">Connecting...</span>
                                        </div>
                                    </div>
                                )}

                                {/* HUD Displays */}
                                <div className={`absolute top-4 left-4 right-4 flex justify-between items-center transition-opacity ${isLocked ? 'opacity-0' : 'opacity-100'}`}>
                                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[8px] font-black">LIVE</span>
                                    </div>
                                    <div className="text-[8px] font-mono text-blue-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/20">
                                        {activeHost.host}
                                    </div>
                                </div>

                                {/* Controls Overlay */}
                                <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity ${isLocked ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white/90">{selectedChannel.name}</span>
                                            <span className="text-[8px] text-blue-400 font-bold tracking-widest uppercase">{selectedChannel.category}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsLocked(true); }} className="p-1 hover:text-blue-400">
                                                <Unlock size={18} />
                                            </button>
                                            <button
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    if (videoRef.current) videoRef.current.requestPictureInPicture();
                                                }}
                                                className="p-1 hover:text-blue-400"
                                            >
                                                <Layers size={18} />
                                            </button>
                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleFullScreen(); }} className="p-1 hover:text-blue-400">
                                                <Maximize size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#1a1a25]/50">
                                <Tv size={48} className="text-blue-500/20 mb-4" />
                                <p className="text-gray-400 text-sm font-medium">Select a channel to begin</p>
                            </div>
                        )}
                    </div>

                    {/* Status Bar */}
                    <div className="mt-4 flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${isSpoofingActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {isSpoofingActive ? <Wifi size={12} /> : <WifiOff size={12} />}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500">
                            <Layers size={12} />
                            <span>{CHANNELS.length} CHANNELS ONLINE</span>
                        </div>
                    </div>
                </section>

                {/* --- HOST SELECTOR --- */}
                <section className="mb-8 overflow-hidden">
                    <div className="px-6 mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-yellow-400" />
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Fast Bypass Nodes</h2>
                    </div>
                    <div className="flex overflow-x-auto gap-3 px-6 no-scrollbar pb-2">
                        {FREE_HOSTS.map((host) => (
                            <button
                                key={host.id}
                                onClick={() => setActiveHost(host)}
                                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeHost.id === host.id
                                    ? 'bg-blue-600/20 border-blue-500 border shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                    : 'bg-white/5 border border-white/5'
                                    }`}
                            >
                                <span className="text-xl">{host.icon}</span>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-white leading-none mb-1">{host.name}</p>
                                    <p className="text-[8px] text-gray-500 font-mono tracking-tighter">{host.host}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* --- SEARCH & CATEGORIES --- */}
                <section className="px-6 mb-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Find channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                        />
                    </div>

                    <div className="flex overflow-x-auto gap-2 no-scrollbar mb-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'bg-white/5 text-gray-500 border border-white/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* --- CHANNELS LIST --- */}
                <section className="px-6">
                    <div className="grid grid-cols-2 gap-4">
                        {filteredChannels.map((channel) => (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                key={channel.id}
                                onClick={() => playChannel(channel)}
                                className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all group ${selectedChannel?.id === channel.id
                                    ? 'bg-blue-600/10 border-blue-500 border-2 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-4xl mb-3 transition-transform group-hover:scale-110 duration-300">{channel.logo}</div>
                                <span className="text-[11px] font-black text-center text-white leading-snug tracking-tight mb-1">{channel.name}</span>
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{channel.category}</span>
                            </motion.button>
                        ))}
                    </div>
                </section>

            </div>

            {/* --- BOTTOM NAVIGATION --- */}
            <nav className="fixed bottom-6 left-6 right-6 glass rounded-[32px] p-2 flex items-center justify-between z-50 border border-white/10 shadow-2xl backdrop-blur-2xl">
                <button className="flex-1 flex flex-col items-center gap-1 text-blue-400">
                    <Tv size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Live TV</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                    <Smartphone size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Mobile</span>
                </button>
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40 -mt-8 border-4 border-[#0a0a0f]">
                    <Play size={20} fill="white" className="ml-1 text-white" />
                </div>
                <button className="flex-1 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                    <Zap size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Boost</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
                    <Globe size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Global</span>
                </button>
            </nav>
        </main>
    );
}
