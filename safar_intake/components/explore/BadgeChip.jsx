export default function BadgeChip({ children, type = 'default', className = '' }) {
  const cls = type === 'live' ? 'e-badge-live' : type === 'ai' ? 'e-badge-ai' : type === 'new' ? 'e-badge-new' : 'bg-white/10 text-white/85 border border-white/15';
  return <span className={`e-badge ${cls} ${className}`}>{children}</span>;
}
