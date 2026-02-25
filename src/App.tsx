import { useState, useCallback, useRef, useEffect } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function App() {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rippleIdRef = useRef(0);

  // Initialize AudioContext on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play "faaaah" sound using Web Audio API
  const playFaaah = useCallback(() => {
    const ctx = initAudio();

    // Create oscillator for the "faaaah" vowel sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // F sound: noise-like attack
    const noiseOsc = ctx.createOscillator();
    const noiseGain = ctx.createGain();

    // Setup main oscillator for "aah" part
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);

    // Formant filter for vowel sound
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, ctx.currentTime);
    filter.Q.setValueAtTime(5, ctx.currentTime);

    // Volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    // F sound setup
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(2000, ctx.currentTime);
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseOsc.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Add second formant for richer vowel
    const oscillator2 = ctx.createOscillator();
    const filter2 = ctx.createBiquadFilter();
    const gain2 = ctx.createGain();

    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1200, ctx.currentTime);
    filter2.Q.setValueAtTime(8, ctx.currentTime);

    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    // Start and stop
    oscillator.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    noiseOsc.start(ctx.currentTime);

    oscillator.stop(ctx.currentTime + 0.7);
    oscillator2.stop(ctx.currentTime + 0.6);
    noiseOsc.stop(ctx.currentTime + 0.1);
  }, [initAudio]);

  const handleInteraction = useCallback(() => {
    playFaaah();
    setIsPressed(true);

    // Add ripple
    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x: 50,
      y: 50,
    };
    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 800);

    setTimeout(() => setIsPressed(false), 150);
  }, [playFaaah]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#1a1410] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(205, 133, 63, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Title */}
      <h1
        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#f5e6d3] mb-4 md:mb-8 tracking-wider text-center px-4 relative z-10"
        style={{ textShadow: '0 0 40px rgba(205, 133, 63, 0.5)' }}
      >
        FAAAH
      </h1>

      <p className="font-body text-[#a89080] text-sm sm:text-base md:text-lg mb-8 md:mb-12 tracking-widest uppercase relative z-10 text-center px-4">
        Touch the circle
      </p>

      {/* Main interactive area */}
      <div className="relative flex items-center justify-center">
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute rounded-full border-2 border-[#cd853f] pointer-events-none"
            style={{
              width: '180px',
              height: '180px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'ripple 0.8s ease-out forwards',
            }}
          />
        ))}

        {/* Outer glow ring */}
        <div
          className={`absolute w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full transition-all duration-300 ${
            isPressed ? 'scale-110 opacity-60' : 'scale-100 opacity-30'
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(205, 133, 63, 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Concentric rings */}
        <div
          className={`absolute w-48 h-48 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full border border-[#cd853f]/20 transition-transform duration-200 ${
            isPressed ? 'scale-95' : 'scale-100'
          }`}
        />
        <div
          className={`absolute w-44 h-44 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full border border-[#cd853f]/30 transition-transform duration-200 ${
            isPressed ? 'scale-95' : 'scale-100'
          }`}
          style={{ transitionDelay: '25ms' }}
        />

        {/* Main button */}
        <button
          onMouseDown={handleInteraction}
          onTouchStart={(e) => {
            e.preventDefault();
            handleInteraction();
          }}
          className={`relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full cursor-pointer transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#cd853f]/50 ${
            isPressed ? 'scale-95' : 'scale-100 hover:scale-105'
          }`}
          style={{
            background: `
              radial-gradient(circle at 30% 30%, #e8a855 0%, #cd853f 40%, #8b5a2b 100%)
            `,
            boxShadow: isPressed
              ? 'inset 0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(205, 133, 63, 0.6)'
              : '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(205, 133, 63, 0.3), inset 0 -4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {/* Inner highlight */}
          <div
            className="absolute inset-4 rounded-full opacity-60"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
          />

          {/* Center indicator */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
              isPressed ? 'opacity-100' : 'opacity-70'
            }`}
          >
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#f5e6d3]"
              style={{
                boxShadow: '0 0 20px rgba(245, 230, 211, 0.8)',
              }}
            />
          </div>
        </button>
      </div>

      {/* Sound wave visualization hint */}
      <div className="mt-12 md:mt-16 flex items-center gap-1 sm:gap-2 opacity-40 relative z-10">
        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((height, i) => (
          <div
            key={i}
            className="w-1 sm:w-1.5 bg-[#cd853f] rounded-full"
            style={{
              height: `${height * 4 + 4}px`,
              animation: isPressed ? `wave 0.3s ease-in-out` : 'none',
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#cd853f]/30" />
      <div className="absolute top-16 left-12 md:top-24 md:left-20 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#cd853f]/20" />
      <div className="absolute bottom-24 right-8 md:bottom-32 md:right-12 w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#cd853f]/25" />
      <div className="absolute top-1/4 right-12 md:right-20 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#f5e6d3]/20" />

      {/* Vintage corner decorations */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 w-8 h-8 md:w-12 md:h-12 border-l-2 border-t-2 border-[#cd853f]/20 rounded-tl-lg" />
      <div className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-12 md:h-12 border-r-2 border-t-2 border-[#cd853f]/20 rounded-tr-lg" />
      <div className="absolute bottom-16 left-4 md:bottom-20 md:left-6 w-8 h-8 md:w-12 md:h-12 border-l-2 border-b-2 border-[#cd853f]/20 rounded-bl-lg" />
      <div className="absolute bottom-16 right-4 md:bottom-20 md:right-6 w-8 h-8 md:w-12 md:h-12 border-r-2 border-b-2 border-[#cd853f]/20 rounded-br-lg" />

      {/* Footer */}
      <footer className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center px-4">
        <p className="font-body text-[#6b5d52] text-xs tracking-wide">
          Requested by <span className="text-[#8b7b6b]">@Nishant293</span> · Built by <span className="text-[#8b7b6b]">@clonkbot</span>
        </p>
      </footer>

      {/* Keyframe animations via style tag */}
      <style>{`
        @keyframes ripple {
          0% {
            width: 180px;
            height: 180px;
            opacity: 0.6;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(2);
          }
        }

        .font-display {
          font-family: 'Righteous', cursive;
        }

        .font-body {
          font-family: 'Quicksand', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default App;
