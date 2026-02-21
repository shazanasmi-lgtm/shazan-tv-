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
    { id: 's1', name: 'DTV Sports 1', logo: '⚽', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },
    { id: 's2', name: 'Cricket Live', logo: '🏏', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },
    { id: 's3', name: 'Star Sports 1', logo: '🏏', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },
    { id: 's4', name: 'Sony Ten 2', logo: '🎾', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },
    { id: 's5', name: 'Eurosport', logo: '🚴', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Sports' },

    // --- MOVIES & ENTERTAINMENT ---
    { id: 'm1', name: 'HBO Movies', logo: '🎬', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Movies' },
    { id: 'm2', name: 'Action Zone', logo: '🔥', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Movies' },
    { id: 'm3', name: 'Cinema Hall', logo: '🍿', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Movies' },
    { id: 'e1', name: 'Sony TV', logo: '🎭', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Entertainment' },
    { id: 'e2', name: 'Star Plus', logo: '🌟', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Entertainment' },

    // --- DOCUMENTARY ---
    { id: 'd1', name: 'Discovery', logo: '🌍', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Documentary' },
    { id: 'd2', name: 'Nat Geo', logo: '🐆', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Documentary' },
    { id: 'd3', name: 'Animal Planet', logo: '🐘', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'Documentary' },

    // --- INTERNATIONAL NEWS ---
    { id: 'n1', name: 'BBC News', logo: '🌐', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'News' },
    { id: 'n2', name: 'Al Jazeera', logo: '🌍', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'News' },
    { id: 'n3', name: 'CNN', logo: '📢', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'News' },

    // --- SRI LANKAN CHANNELS ---
    { id: 'sl1', name: 'ITN', logo: '📺', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'SL TV' },
    { id: 'sl2', name: 'Rupavahini', logo: '📺', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'SL TV' },
    { id: 'sl3', name: 'Sirasa TV', logo: '📺', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'SL TV' },
    { id: 'sl4', name: 'Derana', logo: '📺', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'SL TV' },
    { id: 'sl5', name: 'Hiru TV', logo: '📺', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', category: 'SL TV' },
];

export default function ShazanTVApp() {
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [activeHost, setActiveHost] = useState(FREE_HOSTS[0]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isSpoofingActive, setIsSpoofingActive] = useState(true);
    const [status, setStatus] = useState('Ready (Viu Zero-Data Mode)');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const CATEGORIES = ['All', 'Sports', 'Movies', 'News', 'Documentary', 'Entertainment', 'SL TV'];

    // --- VIDEO PLAYBACK LOGIC ---
    useEffect(() => {
        if (!selectedChannel || !videoRef.current) return;

        const video = videoRef.current;
        const source = selectedChannel.url;

        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }

            const hls = new Hls({
                // In a real environment with a proxy, we'd add custom headers here
                // xhrSetup: (xhr) => {
                //   if (isSpoofingActive) {
                //     xhr.setRequestHeader('X-Online-Host', activeHost.host);
                //   }
                // }
            });

            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log("Auto-play blocked"));
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.addEventListener('loadedmetadata', () => {
                video.play();
            });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [selectedChannel]);

    // --- SPOOFING LOGIC ---
    const applySpoofing = (originalUrl: string) => {
        if (!isSpoofingActive) return originalUrl;
        // For web browsers, we show the spoofed domain visually
        // Real spoofing happens via XHR headers or a Proxy server
        return originalUrl;
    };

    const playChannel = (channel: Channel) => {
        setSelectedChannel(channel);
        setStatus('Connecting via ' + activeHost.name);

        setTimeout(() => {
            setStatus('Streaming: ' + channel.name);
        }, 1500);
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
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Free Data Edition v2.0</p>
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
                <div className="relative aspect-video glass rounded-3xl overflow-hidden group bg-black">
                    {selectedChannel ? (
                        <div className="w-full h-full relative">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                controls={false}
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {!status.includes('Streaming') && (
                                    <Play size={48} className="text-white/30 animate-pulse" />
                                )}
                            </div>

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
