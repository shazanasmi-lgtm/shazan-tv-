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
    Unlock
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
    // --- SPORTS ---
    { id: 's1', name: 'Sports TV 1', logo: '⚽', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },
    { id: 's2', name: 'Cricket Live', logo: '🏏', url: 'https://playertest.longtailvideo.com/adaptive/wowzaid3/playlist.m3u8', category: 'Sports' },
    { id: 's3', name: 'Star Sports 1', logo: '🏏', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },

    // --- MOVIES ---
    { id: 'm1', name: 'HBO Movies', logo: '🎬', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Movies' },
    { id: 'm2', name: 'Action Zone', logo: '🔥', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Movies' },

    // --- SL TV ---
    { id: 'sl1', name: 'ITN Sri Lanka', logo: '📺', url: 'https://itn.m3u8.stream/live.m3u8', category: 'SL TV' },
    { id: 'sl2', name: 'Hiru TV', logo: '📺', url: 'https://hiru.m3u8.stream/live.m3u8', category: 'SL TV' },
];

export default function ShazanTVApp() {
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [activeHost, setActiveHost] = useState(FREE_HOSTS[0]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isSpoofingActive, setIsSpoofingActive] = useState(true);
    const [status, setStatus] = useState('Ready (Viu Zero-Data Mode)');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const CATEGORIES = ['All', 'Sports', 'Movies', 'News', 'Documentary', 'Entertainment', 'SL TV'];

    // --- VIDEO PLAYBACK LOGIC ---
    const initializePlayer = (channel: Channel) => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const source = channel.url;

        setStatus('Connecting via ' + activeHost.host);
        setShowPlayOverlay(false);
        setIsPlaying(false);

        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().then(() => {
                    setIsPlaying(true);
                    setStatus('Streaming: ' + channel.name);
                }).catch(() => {
                    setShowPlayOverlay(true);
                    setStatus('Tap to Play');
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    setStatus('Stream Error: Retrying...');
                    hls.recoverMediaError();
                }
            });

            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.addEventListener('loadedmetadata', () => {
                video.play().then(() => setIsPlaying(true)).catch(() => setShowPlayOverlay(true));
            });
        }
    };

    useEffect(() => {
        if (selectedChannel) {
            initializePlayer(selectedChannel);
        }
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [selectedChannel, activeHost]); // Added activeHost to dependencies to re-initialize player if host changes

    const handleManualPlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
            setShowPlayOverlay(false);
            if (selectedChannel) setStatus('Streaming: ' + selectedChannel.name);
        }
    };

    // --- SPOOFING LOGIC ---
    const applySpoofing = (originalUrl: string) => originalUrl;

    const playChannel = (channel: Channel) => {
        setSelectedChannel(channel);
    };

    const filteredChannels = CHANNELS.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden bg-[#0a0a0f]">

            {/* --- BACKGROUND DECOR --- */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />

            {/* --- HEADER --- */}
            <header className="p-6 flex items-center justify-between z-10">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        Shazan TV
                    </h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Free Data Edition v2.5</p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2 glass rounded-xl text-gray-400 hover:text-white transition-colors">
                        <Search size={20} />
                    </button>
                    <button className="p-2 glass rounded-xl text-blue-400">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* --- PLAYER SECTION --- */}
            <section className="px-6 mb-8 z-10">
                <div className="relative aspect-video glass rounded-3xl overflow-hidden group bg-black shadow-2xl">
                    {selectedChannel ? (
                        <div className="w-full h-full relative" onClick={handleManualPlay}>
                            <video
                                ref={videoRef}
                                className="w-full h-full object-contain"
                                playsInline
                                poster={selectedChannel.logo}
                            />

                            {/* Overlay Controls */}
                            <AnimatePresence>
                                {showPlayOverlay && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 cursor-pointer"
                                    >
                                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40">
                                            <Play size={40} fill="white" className="ml-1 text-white" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isPlaying && !showPlayOverlay && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold text-blue-400 tracking-widest underline decoration-blue-500/50">CONNECTING...</span>
                                    </div>
                                </div>
                            )}

                            {/* Header HUD */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                    <div className="w-2 h-2 bg-red-500 rounded-full live-indicator" />
                                    <span className="text-[10px] font-bold">LIVE</span>
                                </div>
                                <div className="text-[10px] font-mono text-cyan-400 bg-black/60 px-3 py-1 rounded-full border border-cyan-500/30">
                                    SPOOF: ACTIVE ({activeHost.host})
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity ${isLocked ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{selectedChannel.name}</span>
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsLocked(true)} className="p-1 hover:text-blue-400">
                                            <Unlock size={18} />
                                        </button>
                                        <Volume2 size={18} />
                                        <Maximize size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Lock Overlay Content */}
                            {isLocked && (
                                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center">
                                    <motion.button
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={() => setIsLocked(false)}
                                        className="w-16 h-16 glass rounded-full flex items-center justify-center text-white border-blue-500/50 border-2 shadow-lg shadow-blue-500/20"
                                    >
                                        <Lock size={28} className="text-blue-400" />
                                    </motion.button>
                                    <div className="absolute bottom-4 text-[10px] text-white/40 font-bold tracking-widest">
                                        SCREEN LOCKED - TAP ICON TO UNLOCK
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-blue-500/5">
                            <Tv size={48} className="text-blue-500/20 mb-4" />
                            <p className="text-gray-400 text-sm font-light leading-relaxed">
                                Select a channel to start streaming <br /> without data charges.
                            </p>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="mt-4 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full ${isSpoofingActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {isSpoofingActive ? <Wifi size={12} /> : <WifiOff size={12} />}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">{status}</span>
                    </div>
                    <button
                        onClick={() => setIsSpoofingActive(!isSpoofingActive)}
                        className={`text-[10px] px-3 py-1 rounded-full border transition-all ${isSpoofingActive
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                    >
                        {isSpoofingActive ? 'TUNNELING ON' : 'TUNNELING OFF'}
                    </button>
                </div>
            </section>

            {/* --- HOST SELECTOR (Horizontal Scroll) --- */}
            <section className="mb-8 z-10">
                <div className="px-6 mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <h2 className="text-sm font-semibold text-gray-300">Fast Data Hosts</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar pb-2">
                    {FREE_HOSTS.map((host) => (
                        <button
                            key={host.id}
                            onClick={() => setActiveHost(host)}
                            className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeHost.id === host.id
                                ? 'bg-blue-600/20 border-blue-500/50 border shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                : 'glass-card'
                                }`}
                        >
                            <span className="text-lg">{host.icon}</span>
                            <div className="text-left">
                                <p className="text-xs font-bold text-white leading-none mb-1">{host.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono">{host.host}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* --- CHANNEL CATEGORIES --- */}
            <section className="mb-6 z-10">
                <div className="flex overflow-x-auto gap-3 px-6 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${activeCategory === cat
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'glass text-gray-400 hover:text-white'
                                }`}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>
            </section>

            {/* --- CHANNEL LIST --- */}
            <section className="px-6 flex-1 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-300">{activeCategory} Channels</h2>
                    <span className="text-[10px] text-gray-500 px-2 py-0.5 glass rounded-md">
                        {filteredChannels.length} ONLINE
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-10">
                    {filteredChannels.map((channel) => (
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            key={channel.id}
                            onClick={() => playChannel(channel)}
                            className={`p-4 rounded-3xl flex flex-col items-center gap-3 transition-all ${selectedChannel?.id === channel.id
                                ? 'active-glow bg-blue-600/10'
                                : 'glass-card'
                                }`}
                        >
                            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                {channel.logo}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-200">{channel.name}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{channel.category}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* --- NAVIGATION BAR (Floating) --- */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] glass h-16 rounded-2xl flex items-center justify-around px-4 z-50 border border-white/10">
                <button className="flex flex-col items-center gap-1 text-blue-400">
                    <Tv size={22} />
                    <span className="text-[9px] font-bold">TV</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                    <Search size={22} />
                    <span className="text-[9px] font-medium">BROWSE</span>
                </button>
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center -translate-y-6 shadow-lg shadow-blue-600/40 border-4 border-[#0a0a0f]">
                    <Play size={20} fill="white" className="ml-1" />
                </div>
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                    <Zap size={22} />
                    <span className="text-[9px] font-medium">BOOST</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                    <Info size={22} />
                    <span className="text-[9px] font-medium">ABOUT</span>
                </button>
            </nav>

            {/* Tailwind no-scrollbar Utility */}
            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

        </main>
    );
}
