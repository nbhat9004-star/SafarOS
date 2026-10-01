'use client';
import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

// Kashmir coordinates
const KASHMIR = { lat: 34.0837, lng: 74.7973 };

/**
 * Cinematic 3D globe centered on Kashmir. Auto-rotates.
 * Kashmir is highlighted with an animated glowing marker.
 * Renders on a canvas over a starfield background.
 */
export default function KashmirGlobe({ size = 620, spin = true }) {
  const canvasRef = useRef(null);
  const phiRef = useRef(0);
  const pointerRef = useRef({ down: false, x: 0, lastX: 0, delta: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let widthPx = size;
    let heightPx = size;

    // Kashmir is at lng ~74.8°E — cobe phi is a rotation offset;
    // theta locks latitude tilt. Position so Kashmir sits near the front-centre.
    // phi = -(lng in radians) + PI keeps 0°E at the front; adjust to bring 74.8° forward.
    const kashmirPhiOffset = -(KASHMIR.lng * Math.PI) / 180;
    phiRef.current = kashmirPhiOffset;

    const globe = createGlobe(canvas, {
      devicePixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 2,
      width: widthPx * 2,
      height: heightPx * 2,
      phi: phiRef.current,
      theta: 0.3, // tilt slightly north
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [1, 1, 1],
      markerColor: [0.42, 0.95, 0.72],
      glowColor: [0.36, 0.55, 0.98],
      opacity: 1,
      offset: [0, 0],
      markers: [
        { location: [KASHMIR.lat, KASHMIR.lng], size: 0.10 },
      ],
      onRender: (state) => {
        // Auto-rotate slowly when idle; drag adjusts phi.
        if (spin && !pointerRef.current.down) {
          phiRef.current += 0.0035;
        }
        state.phi = phiRef.current + pointerRef.current.delta;
      },
    });

    // Interaction: click-and-drag to spin manually
    const onDown = (e) => {
      pointerRef.current.down = true;
      pointerRef.current.x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      pointerRef.current.lastX = pointerRef.current.x;
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!pointerRef.current.down) return;
      const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const dx = x - pointerRef.current.lastX;
      pointerRef.current.lastX = x;
      pointerRef.current.delta += dx / 200;
    };
    const onUp = () => {
      if (pointerRef.current.down) {
        // Commit delta into base phi so auto-rotate resumes from current angle
        phiRef.current += pointerRef.current.delta;
        pointerRef.current.delta = 0;
      }
      pointerRef.current.down = false;
      canvas.style.cursor = 'grab';
    };
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      globe.destroy();
    };
  }, [size, spin]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 45%, #050810 0%, #0a0e1a 55%, #06080f 100%)' }}>
      {/* Star-field for the polarsteps-like space feel */}
      <div className="absolute inset-0 opacity-70" aria-hidden style={{ backgroundImage: `radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.9), transparent 55%),
        radial-gradient(1.2px 1.2px at 34% 68%, rgba(255,255,255,0.75), transparent 55%),
        radial-gradient(1px 1px at 58% 18%, rgba(255,255,255,0.8), transparent 55%),
        radial-gradient(1.5px 1.5px at 82% 44%, rgba(255,255,255,0.85), transparent 55%),
        radial-gradient(1px 1px at 74% 82%, rgba(255,255,255,0.75), transparent 55%),
        radial-gradient(1px 1px at 22% 88%, rgba(255,255,255,0.7), transparent 55%),
        radial-gradient(1.2px 1.2px at 46% 32%, rgba(255,255,255,0.75), transparent 55%),
        radial-gradient(1px 1px at 8% 62%, rgba(255,255,255,0.7), transparent 55%),
        radial-gradient(1px 1px at 92% 78%, rgba(255,255,255,0.75), transparent 55%),
        radial-gradient(1.4px 1.4px at 62% 60%, rgba(255,255,255,0.8), transparent 55%)`,
        backgroundSize: '900px 900px' }} />
      {/* Soft blue glow behind the globe */}
      <div className="absolute rounded-full blur-3xl" aria-hidden style={{ width: size * 1.05, height: size * 1.05, background: 'radial-gradient(circle, rgba(96,165,250,0.28) 0%, rgba(96,165,250,0.08) 45%, transparent 70%)' }} />
      {/* Backdrop sphere — visible even when WebGL is limited (e.g. headless env),
          fades under the real globe canvas in real browsers. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.9,
          height: size * 0.9,
          borderRadius: '9999px',
          background: 'radial-gradient(circle at 35% 35%, #1a3554 0%, #0f2340 40%, #061021 85%, #030812 100%)',
          boxShadow: 'inset -60px -60px 90px rgba(0,0,0,0.5), inset 30px 30px 80px rgba(80,140,255,0.10), 0 0 60px rgba(96,165,250,0.25), 0 0 120px rgba(96,165,250,0.12)',
          zIndex: 0,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          maxWidth: '92vw',
          maxHeight: '92vw',
          touchAction: 'none',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
        }}
        aria-label="Interactive globe centered on Kashmir"
      />
    </div>
  );
}
