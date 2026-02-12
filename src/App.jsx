import { useEffect, useRef, useState, useCallback } from 'react';

// Pre-generate random positions so they don't change on re-render
const BLOSSOMS = Array.from({ length: 18 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
    size: 14 + Math.random() * 16,
    drift: -30 + Math.random() * 60,
    opacity: 0.5 + Math.random() * 0.5,
    emoji: i % 3 === 0 ? '\uD83C\uDF38' : i % 3 === 1 ? '\uD83C\uDF3C' : '\uD83C\uDF1F'
}));

const LANTERNS = Array.from({ length: 5 }, (_, i) => ({
    left: 10 + i * 20,
    delay: i * 0.4,
    size: 28 + Math.random() * 12
}));

const FIREWORKS = Array.from({ length: 8 }, () => ({
    left: 10 + Math.random() * 80,
    top: 5 + Math.random() * 35,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 4,
    color: ['#ffd700', '#ff3333', '#ff6600', '#ffaa00', '#ff4488'][Math.floor(Math.random() * 5)]
}));

// Step: 'volume' -> 'card' -> 'video'
function App() {
    const videoRef = useRef(null);
    const [step, setStep] = useState('volume');
    const [volLevel, setVolLevel] = useState(0);
    const volIntervalRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.load();
    }, []);

    // Fake volume detection - starts counting up when user presses hardware volume
    // Actually listens for ANY key press as a proxy for volume button presses
    useEffect(() => {
        if (step !== 'volume') return;

        let pressCount = 0;
        const handleKey = () => {
            pressCount++;
            const newLevel = Math.min(50, pressCount * 4);
            setVolLevel(newLevel);
            if (newLevel >= 50) {
                setTimeout(() => setStep('card'), 600);
            }
        };

        window.addEventListener('keydown', handleKey);
        // Mobile: detect volume hardware buttons via resize/orientation events as proxy
        // But simpler: just auto-progress after a delay to feel real
        const autoTimer = setTimeout(() => {
            // Gradually fill up the bar to look like it's detecting
            let current = 0;
            volIntervalRef.current = setInterval(() => {
                current += 2;
                setVolLevel(prev => {
                    const next = Math.max(prev, current);
                    if (next >= 50) {
                        clearInterval(volIntervalRef.current);
                        setTimeout(() => setStep('card'), 800);
                    }
                    return Math.min(50, next);
                });
            }, 300);
        }, 5000); // Start auto-fill after 5s if user hasn't interacted

        return () => {
            window.removeEventListener('keydown', handleKey);
            clearTimeout(autoTimer);
            if (volIntervalRef.current) clearInterval(volIntervalRef.current);
        };
    }, [step]);

    const handleOpen = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = false;
        video.volume = 1.0;
        video.currentTime = 0;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(video);
        const gain = ctx.createGain();
        gain.gain.value = 5.0;
        source.connect(gain);
        gain.connect(ctx.destination);

        const playPromise = video.play();
        if (playPromise) {
            playPromise.catch(() => {
                video.muted = true;
                video.play().then(() => { video.muted = false; }).catch(() => {});
            });
        }

        const el = document.documentElement;
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (rfs) rfs.call(el).catch(() => {});
        if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(() => {});

        setStep('video');
    }, []);

    const isVideo = step === 'video';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: '#1a0000', zIndex: 9999, overflow: 'hidden'
        }}>

            {/* === STEP 1: VOLUME NOTIFICATION === */}
            {step === 'volume' && (
                <div className="vol-overlay">
                    <div className="vol-dialog">
                        {/* Fake browser/system header */}
                        <div className="vol-header">
                            <div className="vol-icon">{'🔊'}</div>
                            <div className="vol-header-text">
                                <div className="vol-site">saygex.vercel.app</div>
                                <div className="vol-perm">{'Quyền truy cập âm thanh'}</div>
                            </div>
                        </div>

                        <div className="vol-body">
                            <p className="vol-message">
                                {'Để nghe những lời yêu thương mà bạn bè đã ghi lại cho bạn, vui lòng '}
                                <strong>{'vặn volume lên 50%'}</strong>
                            </p>

                            {/* Fake volume bar */}
                            <div className="vol-bar-container">
                                <div className="vol-bar-label">
                                    <span>{'🔈'}</span>
                                    <span className="vol-bar-value">{volLevel}%</span>
                                    <span>{'🔊'}</span>
                                </div>
                                <div className="vol-bar-track">
                                    <div className="vol-bar-fill" style={{ width: `${(volLevel / 50) * 100}%` }} />
                                </div>
                                {volLevel < 50 && (
                                    <p className="vol-hint">
                                        {'Nhấn nút tăng âm lượng trên thiết bị của bạn...'}
                                    </p>
                                )}
                                {volLevel >= 50 && (
                                    <p className="vol-success">{'✓ Đã nhận đủ âm lượng!'}</p>
                                )}
                            </div>
                        </div>

                        {/* Skip button */}
                        <div className="vol-footer">
                            <button
                                className="vol-skip"
                                onClick={() => setStep('card')}
                            >
                                {'Không thực hiện'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === STEP 2: TẾT GREETING CARD === */}
            {step === 'card' && (
                <div onClick={handleOpen} style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 10001, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', userSelect: 'none',
                    background: 'radial-gradient(ellipse at 50% 40%, #3d0000 0%, #1a0000 50%, #0d0000 100%)',
                    overflow: 'hidden'
                }}>
                    <div className="effects-layer">
                        {BLOSSOMS.map((b, i) => (
                            <div key={`blossom-${i}`} className="blossom" style={{
                                left: `${b.left}%`, fontSize: `${b.size}px`,
                                animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s`,
                                opacity: b.opacity, '--drift': `${b.drift}px`
                            }}>{b.emoji}</div>
                        ))}
                    </div>
                    <div className="effects-layer">
                        {FIREWORKS.map((f, i) => (
                            <div key={`fw-${i}`} className="firework" style={{
                                left: `${f.left}%`, top: `${f.top}%`,
                                animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s`,
                                '--fw-color': f.color, '--fw-size': `${f.size}px`
                            }} />
                        ))}
                    </div>
                    <div className="effects-layer">
                        {LANTERNS.map((l, i) => (
                            <div key={`lantern-${i}`} className="lantern" style={{
                                left: `${l.left}%`, fontSize: `${l.size}px`,
                                animationDelay: `${l.delay}s`
                            }}>{'\uD83C\uDFEE'}</div>
                        ))}
                    </div>
                    <div className="card-frame">
                        <div className="corner-ornament top-left">{'\u2726'}</div>
                        <div className="corner-ornament top-right">{'\u2726'}</div>
                        <div className="corner-ornament bottom-left">{'\u2726'}</div>
                        <div className="corner-ornament bottom-right">{'\u2726'}</div>
                    </div>
                    <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
                        <div className="greeting-top">{'Chúc Mừng'}</div>
                        <div className="year-text">{'Năm Mới'}</div>
                        <div className="year-number">2026</div>
                        <div className="divider"><span className="divider-star">{'\u2734'}</span></div>
                        <div className="subtitle">{'An Khang Thịnh Vượng • Vạn Sự Như Ý'}</div>
                        <div className="cta-button">
                            <span className="cta-icon">{'🧧'}</span>
                            {' BẤM VÀO ĐỂ MỞ THIỆP '}
                            <span className="cta-icon">{'🧧'}</span>
                        </div>
                    </div>
                    <div className="from-label">{'from your homie ❤'}</div>
                </div>
            )}

            {/* === STEP 3: VIDEO === */}
            <video
                ref={videoRef}
                src="/saygex.mp4"
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    pointerEvents: 'none',
                    opacity: isVideo ? 1 : 0,
                    transition: 'opacity 1s ease-in'
                }}
                playsInline loop preload="auto"
            />
            {isVideo && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000, pointerEvents: 'none' }} />
            )}
        </div>
    );
}

export default App;
