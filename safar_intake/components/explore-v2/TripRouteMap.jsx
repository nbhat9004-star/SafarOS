'use client';

/**
 * TripRouteMap — renders a REAL geographic map (Leaflet + OpenStreetMap tiles)
 * for an ordered list of trip stops. No API key, no npm dependency: Leaflet is
 * loaded once from CDN on the client only (never during SSR). Coordinates come
 * from the caller (geocoded via Nominatim) — this component never invents them.
 *
 * Props:
 *   stops  = [{ name, lat, lng }]  (order = array order)
 *   height = number (px)  default 300
 */
import { useEffect, useRef } from 'react';

let leafletPromise = null;
function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.async = true;
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error('leaflet failed to load'));
    document.body.appendChild(s);
  });
  return leafletPromise;
}

function validStops(stops) {
  return (stops || []).filter(
    (s) => s && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))
  );
}

export default function TripRouteMap({ stops = [], height = 300, className = '' }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const valid = validStops(stops);
    if (valid.length === 0) return;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !elRef.current) return;
        if (mapRef.current) { try { mapRef.current.remove(); } catch (e) { /* noop */ } mapRef.current = null; }

        const map = L.map(elRef.current, { scrollWheelZoom: false, attributionControl: true });
        mapRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const latlngs = [];
        valid.forEach((s, i) => {
          const isStart = i === 0;
          const isEnd = i === valid.length - 1;
          const n = String(i + 1).padStart(2, '0');
          const bg = isEnd ? '#D4AF37' : (isStart ? '#0F3D2E' : '#0F6B4F');
          const label = isEnd ? '🏁' : n;
          const icon = L.divIcon({
            className: 'safar-pin',
            html:
              `<div style="background:${bg};color:#fff;font-weight:800;font-size:11px;` +
              `width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
              `display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff">` +
              `<span style="transform:rotate(45deg)">${label}</span></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 26],
          });
          L.marker([Number(s.lat), Number(s.lng)], { icon })
            .addTo(map)
            .bindPopup(`${n} · ${s.name || ''}`);
          latlngs.push([Number(s.lat), Number(s.lng)]);
        });

        if (latlngs.length > 1) {
          L.polyline(latlngs, { color: '#0F6B4F', weight: 4, opacity: 0.85 }).addTo(map);
        }
        try {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36], maxZoom: 12 });
        } catch (e) {
          map.setView(latlngs[0], 8);
        }
        setTimeout(() => { try { map.invalidateSize(); } catch (e) { /* noop */ } }, 120);
      })
      .catch(() => { /* offline / blocked — silently skip */ });

    return () => {
      cancelled = true;
      if (mapRef.current) { try { mapRef.current.remove(); } catch (e) { /* noop */ } mapRef.current = null; }
    };
  }, [JSON.stringify(stops)]);

  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 ${className}`} style={{ height }}>
      <div ref={elRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export function RouteList({ stops = [] }) {
  const valid = (stops || []).filter((s) => s && s.name);
  if (!valid.length) return null;
  return (
    <ol className="mt-4">
      {valid.map((s, i) => {
        const isEnd = i === valid.length - 1;
        const n = String(i + 1).padStart(2, '0');
        return (
          <li key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
            {!isEnd && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-emerald-200" aria-hidden="true" />}
            <span className={`relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white ${isEnd ? 'bg-amber-500' : 'bg-emerald-700'}`}>
              {isEnd ? '🏁' : n}
            </span>
            <span className="pt-0.5 text-[14px] font-semibold text-slate-800">{s.name}</span>
          </li>
        );
      })}
    </ol>
  );
}
