'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, RefreshCw, Send, Globe, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function WebsiteChatInbox() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState('');
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await api('/api/website-chat');
      const conversations = data.conversations || [];
      setRows(conversations);
      setSelected((current) => current && conversations.some((row) => row.id === current) ? current : (conversations[0]?.id || ''));
    } catch (error) {
      if (!quiet) toast.error(error.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const openConversation = async (id, quiet = false) => {
    if (!id) return;
    if (!quiet) setDetailLoading(true);
    try {
      const data = await api('/api/website-chat?conversationId=' + encodeURIComponent(id));
      setMessages(data.messages || []);
      setRows((old) => old.map((row) => row.id === id ? { ...row, unreadCount: 0 } : row));
    } catch (error) {
      if (!quiet) toast.error(error.message);
    } finally {
      if (!quiet) setDetailLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) openConversation(selected); else setMessages([]); }, [selected]);
  useEffect(() => {
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      await load(true);
      if (selected) await openConversation(selected, true);
    }, 6000);
    return () => clearInterval(timer);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => !q || [row.visitorName, row.visitorEmail, row.packageName, row.lastMessagePreview].some((value) => String(value || '').toLowerCase().includes(q)));
  }, [rows, query]);
  const active = rows.find((row) => row.id === selected);

  const sendReply = async () => {
    const message = draft.trim();
    if (!active || !message || sending) return;
    setSending(true);
    try {
      const data = await api('/api/website-chat', {
        method: 'POST',
        body: JSON.stringify({ action: 'reply', conversationId: active.id, message }),
      });
      setMessages((old) => [...old, data.message]);
      setRows((old) => old.map((row) => row.id === active.id ? { ...row, lastMessagePreview: message.slice(0, 180), lastMessageAt: data.message.createdAt } : row));
      setDraft('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return <Card><CardContent className="space-y-3 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><div className="flex items-center gap-2 font-semibold"><Globe className="h-4 w-4" /> Website chats</div><p className="text-xs text-muted-foreground">Messages from the chat widget installed on your agency website</p></div>
      <div className="flex items-center gap-2"><Badge variant="outline">{rows.reduce((sum, row) => sum + Number(row.unreadCount || 0), 0)} unread</Badge><Button size="sm" variant="outline" onClick={() => load()} disabled={loading}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh</Button></div>
    </div>
    {loading ? <div className="h-24 animate-pulse rounded-lg bg-muted/40" /> : rows.length === 0 ? (
      <div className="rounded-lg border border-dashed p-6 text-center"><MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><div className="text-sm font-medium">No website chats yet</div><p className="mt-1 text-xs text-muted-foreground">Install the SafarOS chat widget from Messages → Channels to receive customer enquiries here.</p></div>
    ) : <div className="grid gap-3 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
      <div className="space-y-2"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search website chats" /><div className="max-h-[460px] divide-y overflow-y-auto rounded-lg border">
        {filtered.map((row) => <button key={row.id} type="button" onClick={() => setSelected(row.id)} className={'block w-full p-3 text-left hover:bg-muted/50 ' + (selected === row.id ? 'bg-muted' : '')}>
          <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{row.visitorName || 'Website visitor'}</span>{Number(row.unreadCount || 0) > 0 && <Badge>{row.unreadCount}</Badge>}</div>
          {row.visitorEmail && <div className="truncate text-xs text-muted-foreground">{row.visitorEmail}</div>}
          {row.packageName && <div className="mt-1 truncate text-xs text-violet-700">Enquiry: {row.packageName}</div>}
          <div className="mt-1 truncate text-xs text-muted-foreground">{row.lastMessagePreview || 'New conversation'}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : ''}</div>
        </button>)}
        {filtered.length === 0 && <div className="p-4 text-xs text-muted-foreground">No matching chats.</div>}
      </div></div>
      <div className="flex min-h-[360px] flex-col rounded-lg border p-3">{active ? <>
        <div className="border-b pb-2"><div className="font-medium">{active.visitorName || 'Website visitor'}</div><div className="text-xs text-muted-foreground">{active.visitorEmail || 'Website visitor'}{active.packageName ? ' · ' + active.packageName : ''}</div></div>
        <div className="min-h-[180px] max-h-[340px] flex-1 space-y-2 overflow-y-auto py-3">{detailLoading ? <div className="h-20 animate-pulse rounded bg-muted/40" /> : messages.length === 0 ? <div className="py-8 text-center text-xs text-muted-foreground">No messages yet.</div> : messages.map((message) => <div key={message.id} className={'flex ' + (message.direction === 'inbound' ? 'justify-start' : 'justify-end')}><div className={'max-w-[85%] rounded-xl px-3 py-2 text-sm ' + (message.direction === 'inbound' ? 'bg-muted' : 'bg-primary text-primary-foreground')}><div className="whitespace-pre-wrap break-words">{message.text}</div><div className={'mt-1 text-[10px] ' + (message.direction === 'inbound' ? 'text-muted-foreground' : 'text-primary-foreground/70')}>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}</div></div></div>)}</div>
        <div className="space-y-2 border-t pt-3"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reply to this customer…" rows={2} maxLength={2000} disabled={sending} /><div className="flex justify-end"><Button size="sm" onClick={sendReply} disabled={sending || !draft.trim()}>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{sending ? 'Sending…' : 'Send reply'}</Button></div></div>
      </> : <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">Select a website conversation</div>}</div>
    </div>}
  </CardContent></Card>;
}

export function WebsiteChatEmbed({ agencySlug }) {
  const [base, setBase] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (typeof window !== 'undefined') setBase(window.location.origin); }, []);
  const snippet = base && agencySlug ? '<script src="' + base + '/api/website-chat/widget?agency=' + encodeURIComponent(agencySlug) + '" async></script>' : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); toast.success('Website chat code copied'); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error('Copy failed. Select and copy the code manually.'); }
  };
  if (!agencySlug) return null;
  return <div className="mt-3 w-full rounded-lg border bg-muted/20 p-3 space-y-2">
    <div className="text-sm font-medium">Install your website chat widget</div>
    <p className="text-xs text-muted-foreground">Copy this code and paste it just before the closing &lt;/body&gt; tag on your agency website.</p>
    <code className="block break-all rounded-md bg-background p-3 text-[11px]">{snippet || 'Preparing your installation code…'}</code>
    <Button size="sm" variant="outline" onClick={copy} disabled={!snippet}>{copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy code'}</Button>
  </div>;
}
