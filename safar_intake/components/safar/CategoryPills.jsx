'use client';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { CATEGORIES } from '@/lib/data';

export default function CategoryPills({ value, onChange, dark = false }) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto scroll-hide pb-1 mask-fade-r">
        {CATEGORIES.map((c) => {
          const Ico = Icons[c.icon] || Icons.Sparkles;
          const active = value === c.id;
          return (
            <motion.button key={c.id} onClick={() => onChange?.(c.id)} whileTap={{ scale: 0.96 }}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${active ? 'bg-charcoal text-white border-charcoal shadow-md' : (dark ? 'bg-white/10 text-white border-white/15 hover:bg-white/20' : 'bg-white text-charcoal border-border hover:border-charcoal/50')}`}>
              <Ico className="size-4" />
              {c.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
