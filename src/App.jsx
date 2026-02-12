import { useEffect, useRef, useState } from 'react';

function App() {
    const videoRef = useRef(null);
    const [opened, setOpened] = useState(false);

    // Preload video so it's ready when user clicks
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.load();
    }, []);

    const handleOpen = () => {
        const video = videoRef.current;
        if (!video) return;

        // Unmute + play inside user gesture handler
        video.muted = false;
        video.volume = 1.0;
        video.currentTime = 0;

        // Web Audio API: boost volume way beyond normal max
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(video);
        const gain = ctx.createGain();
        gain.gain.value = 5.0; // 5x volume boost - cringe level
        source.connect(gain);
        gain.connect(ctx.destination);

        const playPromise = video.play();
        if (playPromise) {
            playPromise.catch((e) => {
                console.error('Play failed:', e);
                video.muted = true;
                video.play().then(() => {
                    video.muted = false;
                }).catch(() => {});
            });
        }

        // Fullscreen - also requires user gesture
        const el = document.documentElement;
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (rfs) rfs.call(el).catch(() => {});

        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').catch(() => {});
        }

        setOpened(true);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: '#0a0a12', zIndex: 9999, overflow: 'hidden'
        }}>
            {/* Greeting card cover */}
            {!opened && (
                <div
                    onClick={handleOpen}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 10001, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', background: 'radial-gradient(ellipse at 50% 30%, #1a1a3e 0%, #0a0a12 70%)',
                        userSelect: 'none'
                    }}
                >
                    {/* Decorative sparkles */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
                        {[...Array(20)].map((_, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                width: `${2 + Math.random() * 3}px`,
                                height: `${2 + Math.random() * 3}px`,
                                borderRadius: '50%',
                                background: ['#ffd700', '#ff6b6b', '#ffa500', '#ff69b4', '#87ceeb'][i % 5],
                                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 3}s`,
                                opacity: 0.7
                            }} />
                        ))}
                    </div>

                    {/* Year */}
                    <div style={{
                        fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: 900,
                        background: 'linear-gradient(135deg, #ffd700, #ff6b6b, #ffa500)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        letterSpacing: '0.05em', lineHeight: 1,
                        textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.3))'
                    }}>
                        2026
                    </div>

                    {/* Subtitle */}
                    <div style={{
                        fontSize: 'clamp(0.9rem, 3vw, 1.4rem)',
                        color: '#c9a84c', letterSpacing: '0.3em', textTransform: 'uppercase',
                        marginTop: '8px', fontWeight: 300
                    }}>
                        Happy New Year
                    </div>

                    {/* Divider */}
                    <div style={{
                        width: '60px', height: '1px', margin: '24px 0',
                        background: 'linear-gradient(90deg, transparent, #ffd700, transparent)'
                    }} />

                    {/* CTA button */}
                    <div style={{
                        padding: '14px 36px', borderRadius: '50px',
                        border: '1px solid rgba(255,215,0,0.4)',
                        background: 'rgba(255,215,0,0.08)',
                        color: '#ffd700', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                        letterSpacing: '0.15em', fontWeight: 400,
                        animation: 'glow 2.5s ease-in-out infinite',
                        transition: 'all 0.3s ease'
                    }}>
                        {'BẤM VÀO ĐỂ XEM THIỆP'}
                    </div>

                    {/* From label */}
                    <div style={{
                        position: 'absolute', bottom: '40px',
                        fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                        color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', fontStyle: 'italic'
                    }}>
                        from your homie
                    </div>
                </div>
            )}

            {/* Video layer - always in DOM */}
            <video
                ref={videoRef}
                src="/saygex.mp4"
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    pointerEvents: 'none',
                    opacity: opened ? 1 : 0,
                    transition: 'opacity 0.8s ease-in'
                }}
                playsInline
                loop
                preload="auto"
            />

            {/* Blocker div */}
            {opened && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000, pointerEvents: 'none' }} />
            )}
        </div>
    );
}

export default App;
