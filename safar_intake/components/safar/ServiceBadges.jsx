import * as Icons from 'lucide-react';
import { SERVICE_INDEX } from '@/lib/services';

// Compact display of selected services as chips/badges.
// Props: ids: string[], max?: number (default 6), size?: 'sm'|'md'
export default function ServiceBadges({ ids = [], max = 6, size = 'md' }) {
  if (!ids.length) return null;
  const items = ids.map(id => SERVICE_INDEX[id]).filter(Boolean);
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  const padCls = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(s => {
        const Ico = Icons[s.icon] || Icons.Sparkles;
        return (
          <span key={s.id} className={`inline-flex items-center gap-1.5 rounded-full bg-secondary border font-medium text-charcoal ${padCls}`}>
            <Ico className="size-3.5 text-emerald2" />
            {s.label}
          </span>
        );
      })}
      {extra > 0 && (
        <span className={`inline-flex items-center rounded-full bg-charcoal text-white font-semibold ${padCls}`}>+{extra} more</span>
      )}
    </div>
  );
}
