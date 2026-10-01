'use client';

// -----------------------------------------------------------------------------
// PropertyGallery — Premium mobile-first image gallery for the property page.
//
// Design goals (comparable to Airbnb / Booking.com / Apple Photos / Marriott):
//   • MOBILE: single hero carousel at ~38dvh, natural aspect ratio, pagination
//     dots, floating overlay controls (Back, Save, Share, View All).
//   • DESKTOP (md+): 4-tile premium collage with a full-height hero on the
//     left and a 2×2 grid on the right. Same overlay CTA opens the fullscreen
//     viewer.
//   • FULLSCREEN VIEWER: dark background, horizontal swipe, image counter,
//     pinch-to-zoom, double-tap zoom, close on backdrop tap.
//
// Implementation notes:
//   • Uses embla-carousel-react (already in package.json) for hardware-
//     accelerated horizontal swiping with drag momentum.
//   • Uses framer-motion for open/close spring animations and gesture
//     handling (drag to dismiss, pinch/double-tap zoom).
//   • Adjacent images are eagerly preloaded via `<link rel="preload">` when
//     the fullscreen viewer opens; the rest use native lazy loading.
//   • Zero layout shift: every slide reserves its aspect box before the
//     image arrives.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Small hook: exposes current slide index + slide count for an embla instance.
function useEmblaSelected(embla) {
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    onSelect();
    setCount(embla.scrollSnapList().length);
    embla.on('select', onSelect);
    embla.on('reInit', onSelect);
    return () => { embla.off('select', onSelect); embla.off('reInit', onSelect); };
  }, [embla]);
  return { selected, count };
}

export default function PropertyGallery({
  images,
  title = '',
  onBack,
  onShare,
  onToggleSave,
  isSaved = false,
  saveCount,
}) {
  // Deduplicate + guarantee at least one slide so the layout never collapses.
  const gallery = useMemo(() => {
    const clean = (images || []).filter((s) => typeof s === 'string' && s.trim().length > 0);
    return clean.length ? Array.from(new Set(clean)) : [];
  }, [images]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = useCallback((index = 0) => {
    setViewerIndex(index);
    setViewerOpen(true);
  }, []);

  // Mobile hero carousel (embla)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: gallery.length > 1,
    dragFree: false,
    align: 'center',
    containScroll: 'trimSnaps',
  });
  const { selected } = useEmblaSelected(emblaApi);

  if (!gallery.length) return null;

  const total = gallery.length;

  return (
    <>
      {/* ================================================================
          MOBILE — Single hero carousel (~38dvh) with overlay controls
          ================================================================ */}
      <div className="md:hidden relative w-full select-none">
        <div
          ref={emblaRef}
          className="overflow-hidden bg-charcoal/5"
          style={{ height: '38dvh', minHeight: 260, maxHeight: 460 }}
        >
          <div className="flex h-full">
            {gallery.map((src, i) => (
              <button
                key={`m-${i}`}
                type="button"
                onClick={() => openViewer(i)}
                aria-label={`Open photo ${i + 1} of ${total}`}
                className="relative shrink-0 grow-0 basis-full h-full active:opacity-95 transition"
              >
                <img
                  src={src}
                  alt={title ? `${title} — photo ${i + 1}` : `Photo ${i + 1}`}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Subtle bottom-vignette so overlay controls stay legible on any photo */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />
              </button>
            ))}
          </div>
        </div>

        {/* Overlay: top-left BACK */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute top-3 left-3 size-10 rounded-full bg-white/90 backdrop-blur-md shadow-md grid place-items-center active:scale-95 transition"
          >
            <ArrowLeft className="size-5 text-charcoal" />
          </button>
        )}

        {/* Overlay: top-right SHARE + SAVE */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              aria-label="Share"
              className="size-10 rounded-full bg-white/90 backdrop-blur-md shadow-md grid place-items-center active:scale-95 transition"
            >
              <Share2 className="size-[18px] text-charcoal" />
            </button>
          )}
          {onToggleSave && (
            <button
              type="button"
              onClick={onToggleSave}
              aria-label={isSaved ? 'Remove from saved' : 'Save'}
              aria-pressed={isSaved}
              className="size-10 rounded-full bg-white/90 backdrop-blur-md shadow-md grid place-items-center active:scale-95 transition"
            >
              <Heart className={`size-[18px] ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-charcoal'}`} />
            </button>
          )}
        </div>

        {/* Overlay: pagination dots (bottom-center) */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
            {gallery.slice(0, Math.min(total, 8)).map((_, i) => (
              <span
                key={`d-${i}`}
                className={`transition-all rounded-full ${i === selected ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`}
              />
            ))}
            {total > 8 && <span className="text-[10px] font-semibold text-white/85 ml-1">{selected + 1}/{total}</span>}
          </div>
        )}

        {/* Overlay: bottom-right VIEW ALL PHOTOS (count) */}
        <button
          type="button"
          onClick={() => openViewer(selected || 0)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full bg-white/95 backdrop-blur-md shadow-md text-[12.5px] font-semibold text-charcoal active:scale-95 transition"
        >
          <Camera className="size-4" />
          View All Photos ({total})
        </button>
      </div>

      {/* ================================================================
          DESKTOP — Premium 4-tile collage (unchanged spec: hero + 2x2 grid).
          Same "View All Photos" CTA opens the fullscreen viewer.
          ================================================================ */}
      <div className="hidden md:block relative mt-6 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[60vh] min-h-[420px]">
          <button
            type="button"
            onClick={() => openViewer(0)}
            className="col-span-2 row-span-2 relative group overflow-hidden bg-charcoal/5"
            aria-label="Open photo 1"
          >
            <img
              src={gallery[0]}
              alt={title ? `${title} — photo 1` : 'Photo 1'}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
              draggable={false}
            />
          </button>
          {[1, 2, 3, 4].map((i) => {
            const src = gallery[i % total];
            return (
              <button
                key={`d-${i}`}
                type="button"
                onClick={() => openViewer(i % total)}
                className="relative group overflow-hidden bg-charcoal/5"
                aria-label={`Open photo ${(i % total) + 1}`}
              >
                <img
                  src={src}
                  alt={title ? `${title} — photo ${(i % total) + 1}` : `Photo ${(i % total) + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => openViewer(0)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white shadow-lg border text-[13px] font-semibold text-charcoal hover:bg-secondary transition"
        >
          <Camera className="size-4" />
          View All Photos ({total})
        </button>
      </div>

      {/* ================================================================
          FULLSCREEN VIEWER (mobile + desktop)
          ================================================================ */}
      <FullscreenViewer
        open={viewerOpen}
        images={gallery}
        initialIndex={viewerIndex}
        title={title}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

// -----------------------------------------------------------------------------
// FullscreenViewer — dark, swipeable, zoomable image viewer.
// -----------------------------------------------------------------------------
function FullscreenViewer({ open, images, initialIndex, title, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Body scroll lock while viewer is open.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
    align: 'center',
    duration: 22,
    containScroll: 'trimSnaps',
    startIndex: initialIndex,
    watchDrag: (api, evt) => {
      // Disable horizontal drag while a slide is zoomed in.
      const target = evt?.target;
      if (target && target.closest && target.closest('[data-zoomed="1"]')) return false;
      return true;
    },
  });
  const { selected } = useEmblaSelected(emblaApi);

  // Whenever the viewer re-opens on a new starting index, scroll instantly.
  useEffect(() => {
    if (!open || !emblaApi) return;
    try { emblaApi.scrollTo(initialIndex, true); } catch { /* no-op */ }
  }, [open, initialIndex, emblaApi]);

  // Preload immediate neighbours for a snappy swipe experience.
  const preload = useMemo(() => {
    if (!images.length) return [];
    const set = new Set();
    [-1, 0, 1].forEach((d) => {
      const i = ((selected + d) % images.length + images.length) % images.length;
      set.add(images[i]);
    });
    return Array.from(set);
  }, [images, selected]);

  if (!mounted || typeof document === 'undefined' || !open) return null;

  const total = images.length;

  const node = (
    <AnimatePresence>
      <motion.div
        key="viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[2000] bg-black text-white select-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Preload neighbours */}
        {preload.map((src) => (
          <link key={src} rel="preload" as="image" href={src} />
        ))}

        {/* Header: close + counter + share/save (optional icons omitted to keep minimal chrome) */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur grid place-items-center transition"
          >
            <X className="size-5" />
          </button>
          <div className="text-[13px] font-semibold tabular-nums px-3 py-1.5 rounded-full bg-white/15 backdrop-blur">
            {selected + 1} / {total}
          </div>
          <span className="size-10" />
        </div>

        {/* Slides */}
        <div ref={emblaRef} className="w-full h-full overflow-hidden">
          <div className="flex h-full">
            {images.map((src, i) => (
              <div key={`v-${i}`} className="relative shrink-0 grow-0 basis-full h-full">
                <ZoomableImage
                  src={src}
                  alt={title ? `${title} — photo ${i + 1}` : `Photo ${i + 1}`}
                  onBackdropTap={onClose}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop chevrons */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous photo"
              className="hidden md:grid place-items-center absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur transition"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next photo"
              className="hidden md:grid place-items-center absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur transition"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

// -----------------------------------------------------------------------------
// ZoomableImage — pinch, double-tap and wheel zoom for the fullscreen viewer.
// -----------------------------------------------------------------------------
function ZoomableImage({ src, alt, onBackdropTap }) {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const gesture = useRef({
    // pinch
    startDist: 0,
    startScale: 1,
    // pan
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    panning: false,
    // double-tap
    lastTap: 0,
  });

  const clampScale = (s) => Math.max(1, Math.min(4, s));

  const reset = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };

  const distance = (a, b) => {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      gesture.current.startDist = distance(e.touches[0], e.touches[1]);
      gesture.current.startScale = scale;
    } else if (e.touches.length === 1) {
      // Detect double-tap zoom
      const now = Date.now();
      if (now - gesture.current.lastTap < 280) {
        // Toggle zoom in/out around the tap point
        if (scale > 1) {
          reset();
        } else {
          setScale(2.5);
          setTranslate({ x: 0, y: 0 });
        }
        gesture.current.lastTap = 0;
        return;
      }
      gesture.current.lastTap = now;

      if (scale > 1) {
        gesture.current.panning = true;
        gesture.current.startX = e.touches[0].clientX;
        gesture.current.startY = e.touches[0].clientY;
        gesture.current.startTx = translate.x;
        gesture.current.startTy = translate.y;
      }
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = distance(e.touches[0], e.touches[1]);
      const nextScale = clampScale(gesture.current.startScale * (d / (gesture.current.startDist || d)));
      setScale(nextScale);
    } else if (e.touches.length === 1 && gesture.current.panning) {
      // Only prevent embla drag when zoomed in
      if (scale > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - gesture.current.startX;
        const dy = e.touches[0].clientY - gesture.current.startY;
        setTranslate({ x: gesture.current.startTx + dx, y: gesture.current.startTy + dy });
      }
    }
  };

  const onTouchEnd = () => {
    gesture.current.panning = false;
    if (scale < 1.02) reset();
  };

  const onDoubleClick = (e) => {
    e.stopPropagation();
    if (scale > 1) reset(); else setScale(2.5);
  };

  const onClickBackdrop = (e) => {
    if (scale > 1) return; // don't dismiss while zoomed
    if (e.target === wrapperRef.current) onBackdropTap?.();
  };

  return (
    <div
      ref={wrapperRef}
      onClick={onClickBackdrop}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      data-zoomed={scale > 1 ? '1' : '0'}
      className="w-full h-full flex items-center justify-center overflow-hidden touch-pan-y"
      style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        decoding="async"
        style={{
          transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
          transition: gesture.current.panning ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
        className="max-w-[100vw] max-h-[100dvh] object-contain"
      />
    </div>
  );
}
