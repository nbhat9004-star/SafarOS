'use client';

// SafarOS — Password reset (agency users: type=agency, Super Admin: type=platform).
// Without ?token → request a reset link. With ?token → choose a new password.
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const ResetForm = () => {
  const params = useSearchParams();
  const type = params.get('type') === 'platform' ? 'platform' : 'agency';
  const token = params.get('token') || '';
  const base = type === 'platform' ? '/api/platform/auth' : '/api/auth';
  const back = type === 'platform' ? '/admin' : '/login';
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const minLen = type === 'platform' ? 10 : 8;

  const post = async (path, body) => {
    const res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  };
  const requestLink = async () => {
    setBusy(true); setMsg(null);
    try { const d = await post('/forgot-password', { email }); setMsg({ ok: true, text: d.message }); }
    catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };
  const resetPw = async () => {
    if (pw.password !== pw.confirm) { setMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    setBusy(true); setMsg(null);
    try { await post('/reset-password', { token, password: pw.password }); setMsg({ ok: true, done: true, text: 'Your password has been changed. You can now sign in.' }); }
    catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-md"><CardContent className="space-y-4 p-8">
        <div>
          <div className="text-lg font-bold text-slate-900">{token ? 'Choose a new password' : 'Reset your password'}</div>
          <div className="text-xs text-muted-foreground">{type === 'platform' ? 'SafarOS Super Admin' : 'SafarOS agency account'}</div>
        </div>
        {!token && (<>
          <p className="text-sm text-muted-foreground">Enter your account email. If it exists and email is set up on this platform, we will send a link that is valid for 30 minutes.</p>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && requestLink()} /></div>
          <Button className="w-full" onClick={requestLink} disabled={busy || !email}>{busy ? 'Sending…' : 'Send reset link'}</Button>
        </>)}
        {token && !msg?.done && (<>
          <div className="space-y-1.5"><Label>New password (min {minLen} characters)</Label><Input type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Confirm new password</Label><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && resetPw()} /></div>
          <Button className="w-full" onClick={resetPw} disabled={busy || !pw.password}>{busy ? 'Saving…' : 'Set new password'}</Button>
        </>)}
        {msg && <div className={`rounded-md border px-3 py-2 text-sm ${msg.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg.text}</div>}
        <div className="text-center"><a href={back} className="text-xs text-violet-700 hover:underline">Back to sign in</a></div>
      </CardContent></Card>
    </div>
  );
};

const ResetPasswordPage = () => (
  <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
    <ResetForm />
  </Suspense>
);

export default ResetPasswordPage;
