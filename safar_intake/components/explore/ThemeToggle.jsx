'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const KEY = 'safar-explore-theme';
const DEFAULT_THEME = 'premium'; // Safar Curated design language is the default.

export function applyTheme(t) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-explore-theme', t);
  try { localStorage.setItem(KEY, t); } catch {}
}

export function getInitialTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try { return localStorage.getItem(KEY) || DEFAULT_THEME; } catch { return DEFAULT_THEME; }
}

export default function ThemeToggle({ compact = false, floating = false }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    applyTheme(t);
  }, []);
  const toggle = () => {
    const next = theme === 'aurora' ? 'premium' : 'aurora';
    setTheme(next);
    applyTheme(next);
  };
  const floatStyle = floating
    ? { background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', color: '#fff', backdropFilter: 'blur(10px)' }
    : undefined;
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'aurora' ? 'Safar Curated' : 'Aurora'} theme`}
      title={theme === 'aurora' ? 'Switch to Safar Curated theme' : 'Switch to Aurora theme'}
      className={`inline-flex items-center gap-1.5 rounded-full border transition ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} text-xs font-medium e-theme-toggle`}
      style={floatStyle}
    >
      {theme === 'aurora' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      {!compact && <span>{theme === 'aurora' ? 'Curated' : 'Aurora'}</span>}
    </button>
  );
}
