export default function GlassCard({ className = '', children, as: Tag = 'div', ...props }) {
  return <Tag className={`e-glass rounded-3xl ${className}`} {...props}>{children}</Tag>;
}
