// Lightweight animation utilities for mobile performance
// Uses IntersectionObserver instead of framer-motion for better performance

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Conditional animation hook - disable animations on low-end devices
export const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Lazy load framer-motion only when needed
export const lazyMotion = () => import('framer-motion');
