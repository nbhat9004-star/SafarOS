'use client';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { Code2 } from 'lucide-react';

export default function CustomCode() {
  return (
    <WebsiteBuilderShell title="Custom Code" subtitle="Advanced: inject scripts, meta tags, and CSS overrides">
      <div className="bg-white rounded-2xl border p-8 text-center">
        <div className="size-14 mx-auto rounded-2xl bg-emerald2/10 grid place-items-center"><Code2 className="size-6 text-emerald2" /></div>
        <div className="font-display font-bold text-lg mt-3">Coming with production deploy</div>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Custom head/body scripts, analytics snippets and CSS overrides can be added here in a future release. For now, use the 'Custom HTML' section type inside any page or home page to inject arbitrary embeds.</p>
      </div>
    </WebsiteBuilderShell>
  );
}
