'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft, Bot, Users, Play, Pause, Trash2, Plus, RefreshCw, Loader2,
  ListChecks, Sparkles, ShieldCheck, Activity, Settings, ChevronRight, X,
} from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

const ROLES = [
  { key: 'accommodation_host', label: 'Accommodation Host' },
  { key: 'experience_host',    label: 'Experience Host' },
  { key: 'vehicle_host',       label: 'Vehicle Rental Host' },
  { key: 'tour_guide',         label: 'Tour Guide' },
  { key: 'trip_creator',       label: 'Trip Creator' },
  { key: 'traveller',          label: 'Traveller' },
  { key: 'booking_customer',   label: 'Booking Customer' },
  { key: 'random_explorer',    label: 'Random Explorer' },
];

const TASK_TYPES = [
  { key: 'create_listings', label: 'Create listings',   emoji: '🏨', desc: 'Have host agents publish listings (dynamic categories).' },
  { key: 'publish_trips',   label: 'Publish trips',     emoji: '🗺️', desc: 'Traveller/creator agents publish community trips.' },
  { key: 'join_trips',      label: 'Join trips',        emoji: '🤝', desc: 'Agents request to join other AI trips.' },
  { key: 'book_stay',       label: 'Book stays',        emoji: '🛏️', desc: 'Customer agents book AI-generated listings.' },
  { key: 'send_messages',   label: 'Populate messenger', emoji: '💬', desc: 'Send natural chat messages in AI trips.' },
  { key: 'leave_reviews',   label: 'Leave reviews',     emoji: '⭐', desc: 'Post realistic 4/5-star reviews on AI listings.' },
];

const STATUS_STYLES = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused:   'bg-amber-50 text-amber-700 border-amber-200',
  disabled: 'bg-slate-100 text-slate-600 border-slate-200',
};

function Inner() {
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState({ stats: {}, agents: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [runningTask, setRunningTask] = useState('');
  const [newBatch, setNewBatch] = useState({ count: 5, role: 'traveller', gender: '' });
  const [taskParams, setTaskParams] = useState({ type: 'create_listings', count: 10 });

  const load = async () => {
    try {
      const r = await fetch('/api/admin/ai/dashboard', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setDashboard(j);
    } catch { toast.error('Load failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createBatch = async () => {
    setCreating(true);
    try {
      const r = await fetch('/api/admin/ai/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBatch) });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      toast.success(`Created ${j.count} agent${j.count !== 1 ? 's' : ''}`);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const patchAgent = async (id, patch) => {
    try {
      const r = await fetch(`/api/admin/ai/agents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      setDashboard((d) => ({ ...d, agents: d.agents.map((a) => a.id === id ? j.agent : a) }));
    } catch (e) { toast.error(e.message); }
  };
  const removeAgent = async (id) => {
    if (!confirm('Delete this AI agent and all of its content (listings, trips, messages)? Real user content is never touched.')) return;
    try {
      const r = await fetch(`/api/admin/ai/agents/${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      toast.success('Agent removed');
      setDashboard((d) => ({ ...d, agents: d.agents.filter((a) => a.id !== id) }));
    } catch (e) { toast.error(e.message); }
  };

  const bulkAction = async (action) => {
    try {
      const r = await fetch('/api/admin/ai/agents/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      toast.success(`${action} → ${j.updated} agent(s)`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const runTask = async () => {
    setRunningTask(taskParams.type);
    try {
      const r = await fetch('/api/admin/ai/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskParams) });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      toast.success(`Task done — ${j.task.results.length} actions executed`);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setRunningTask(''); }
  };

  const s = dashboard.stats || {};

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">AI Agent Manager</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={load} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-white border text-xs font-semibold hover:bg-emerald2/5 transition"><RefreshCw className="size-3.5" /> Refresh</button>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-amber-300 grid place-items-center shadow"><Bot className="size-6" /></div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">AI Agent Manager</h1>
            <p className="text-sm text-muted-foreground">Create, control and orchestrate up to 30 AI-powered users that behave exactly like real travellers and hosts.</p>
          </div>
        </div>

        {/* Safety notice */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3 text-sm text-emerald-900">
          <ShieldCheck className="size-4 mt-0.5 shrink-0" />
          <span>AI agents only interact with other AI-generated accounts, listings and trips. Real user content is never touched or modified. Deleting an agent removes only its own content.</span>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <Stat label="Total"     value={s.total || 0} />
          <Stat label="Active"    value={s.active || 0}   tint="emerald" />
          <Stat label="Paused"    value={s.paused || 0}   tint="amber" />
          <Stat label="Disabled"  value={s.disabled || 0} tint="slate" />
          <Stat label="Completed" value={s.completedTasks || 0} tint="emerald" />
          <Stat label="Running"   value={s.runningTasks || 0}   tint="amber" />
          <Stat label="Failed"    value={s.failedTasks || 0}    tint="rose" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b overflow-x-auto mb-4">
          {[
            { key: 'overview', label: 'Overview',  icon: Activity },
            { key: 'agents',   label: 'Agents',    icon: Users },
            { key: 'tasks',    label: 'Scheduler', icon: ListChecks },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${tab === key ? 'border-emerald2 text-emerald2' : 'border-transparent text-muted-foreground hover:text-charcoal'}`}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl border p-5">
                  <div className="font-display font-bold text-charcoal mb-3 flex items-center gap-2"><Sparkles className="size-4 text-amber-500" /> Recent activity</div>
                  {dashboard.tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks yet. Head to Scheduler to run the first one.</div>}
                  <div className="space-y-2">
                    {dashboard.tasks.slice(0, 8).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{TASK_TYPES.find((x) => x.key === t.type)?.emoji || '⚡'}</span>
                          <div>
                            <div className="font-semibold text-charcoal">{TASK_TYPES.find((x) => x.key === t.type)?.label || t.type}</div>
                            <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${t.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{t.status}</span>
                          <span className="text-xs text-muted-foreground">{t.progress}/{t.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border p-5">
                  <div className="font-display font-bold text-charcoal mb-3">By role</div>
                  {Object.keys(s.byRole || {}).length === 0 && <div className="text-sm text-muted-foreground">No agents yet.</div>}
                  <div className="space-y-2">
                    {Object.entries(s.byRole || {}).map(([role, n]) => (
                      <div key={role} className="flex items-center justify-between text-sm">
                        <div className="text-charcoal capitalize">{role.replace(/_/g, ' ')}</div>
                        <div className="font-bold text-emerald2">{n}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t space-y-2">
                    <button onClick={() => bulkAction('resume')} className="w-full inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"><Play className="size-3.5" /> Resume all</button>
                    <button onClick={() => bulkAction('pause')}  className="w-full inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"><Pause className="size-3.5" /> Pause all</button>
                    <button onClick={() => bulkAction('disable')} className="w-full inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-full bg-slate-100 border text-slate-700 text-xs font-semibold">Disable all</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'agents' && (
              <div className="space-y-6">
                {/* Create batch */}
                <div className="bg-white rounded-2xl border p-5">
                  <div className="font-display font-bold text-charcoal mb-3 flex items-center gap-2"><Plus className="size-4 text-emerald2" /> Create AI agents</div>
                  <div className="text-xs text-muted-foreground mb-4">Cap: <strong>30 total</strong>. You currently have {s.total || 0}.</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1">Count</label>
                      <input type="number" min={1} max={30 - (s.total || 0)} value={newBatch.count} onChange={(e) => setNewBatch({ ...newBatch, count: Math.max(1, Math.min(30 - (s.total || 0), Number(e.target.value) || 1)) })} className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none focus:border-emerald2" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1">Role</label>
                      <select value={newBatch.role} onChange={(e) => setNewBatch({ ...newBatch, role: e.target.value })} className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none focus:border-emerald2">
                        {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1">Gender</label>
                      <select value={newBatch.gender} onChange={(e) => setNewBatch({ ...newBatch, gender: e.target.value })} className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none focus:border-emerald2">
                        <option value="">Mixed</option><option value="male">Male</option><option value="female">Female</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button disabled={creating || (s.total || 0) >= 30} onClick={createBatch} className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold transition">
                        {creating ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : <><Plus className="size-4" /> Create batch</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Agents grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {dashboard.agents.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-white rounded-2xl border">No agents yet — create your first batch above.</div>
                  )}
                  {dashboard.agents.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl border p-4">
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.avatar} alt={a.name} className="size-12 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-charcoal truncate">{a.name}</div>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2 truncate">{a.role.replace(/_/g, ' ')}</div>
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[a.status] || 'bg-secondary'}`}>{a.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                        <div><div className="text-xs font-bold text-charcoal">{a.stats?.listings || 0}</div><div className="text-[9px] uppercase text-muted-foreground">List</div></div>
                        <div><div className="text-xs font-bold text-charcoal">{a.stats?.trips || 0}</div><div className="text-[9px] uppercase text-muted-foreground">Trip</div></div>
                        <div><div className="text-xs font-bold text-charcoal">{a.stats?.bookings || 0}</div><div className="text-[9px] uppercase text-muted-foreground">Book</div></div>
                        <div><div className="text-xs font-bold text-charcoal">{a.stats?.joins || 0}</div><div className="text-[9px] uppercase text-muted-foreground">Join</div></div>
                        <div><div className="text-xs font-bold text-charcoal">{a.stats?.messages || 0}</div><div className="text-[9px] uppercase text-muted-foreground">Msg</div></div>
                        <div><div className="text-xs font-bold text-charcoal">{a.stats?.reviews || 0}</div><div className="text-[9px] uppercase text-muted-foreground">Rev</div></div>
                      </div>
                      <div className="mt-2 text-[10px] text-muted-foreground italic truncate">Last: {a.currentAction || 'idle'}</div>
                      <div className="mt-3 pt-3 border-t flex items-center gap-1">
                        {a.status === 'active' ? (
                          <button onClick={() => patchAgent(a.id, { status: 'paused' })} className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"><Pause className="size-3" /> Pause</button>
                        ) : (
                          <button onClick={() => patchAgent(a.id, { status: 'active' })} className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"><Play className="size-3" /> Resume</button>
                        )}
                        <select value={a.role} onChange={(e) => patchAgent(a.id, { role: e.target.value })} className="flex-1 h-8 rounded-lg border bg-white text-xs px-2">
                          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                        <button onClick={() => removeAgent(a.id)} className="size-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 grid place-items-center" title="Delete"><Trash2 className="size-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'tasks' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border p-5">
                  <div className="font-display font-bold text-charcoal mb-3 flex items-center gap-2"><ListChecks className="size-4 text-emerald2" /> Run a task</div>
                  <p className="text-xs text-muted-foreground mb-4">Every task executes real user actions through the same MongoDB collections a real user writes to — the agents behave like genuine travellers/hosts.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {TASK_TYPES.map((t) => (
                      <button key={t.key} onClick={() => setTaskParams({ ...taskParams, type: t.key })} className={`text-left p-4 rounded-2xl border-2 transition ${taskParams.type === t.key ? 'border-emerald2 bg-emerald-50/50' : 'border-emerald-100 bg-white hover:border-emerald-200'}`}>
                        <div className="text-2xl">{t.emoji}</div>
                        <div className="mt-2 font-semibold text-charcoal text-sm">{t.label}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1">Count (max 50 per batch)</label>
                      <input type="number" min={1} max={50} value={taskParams.count} onChange={(e) => setTaskParams({ ...taskParams, count: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} className="w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none focus:border-emerald2" />
                    </div>
                    <button disabled={!!runningTask || dashboard.agents.filter((a) => a.status === 'active').length === 0} onClick={runTask} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold shadow transition">
                      {runningTask ? <><Loader2 className="size-4 animate-spin" /> Running…</> : <><Play className="size-4" /> Run task</>}
                    </button>
                  </div>
                  {dashboard.agents.filter((a) => a.status === 'active').length === 0 && (
                    <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No active agents. Create or resume some in the Agents tab first.</div>
                  )}
                </div>

                {/* Task history */}
                <div className="bg-white rounded-2xl border overflow-hidden">
                  <div className="p-4 border-b font-display font-bold text-charcoal">Task history</div>
                  {dashboard.tasks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No tasks run yet.</div>
                  ) : (
                    <div className="divide-y">
                      {dashboard.tasks.map((t) => (
                        <details key={t.id} className="group">
                          <summary className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/40">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{TASK_TYPES.find((x) => x.key === t.type)?.emoji || '⚡'}</span>
                              <div>
                                <div className="font-semibold text-charcoal text-sm">{TASK_TYPES.find((x) => x.key === t.type)?.label || t.type}</div>
                                <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString('en-IN')} · {t.progress}/{t.count} actions</div>
                              </div>
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${t.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{t.status}</span>
                          </summary>
                          <div className="px-4 pb-4">
                            <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
                              {(t.results || []).map((r, i) => (
                                <div key={i} className={`px-3 py-1.5 rounded-lg border ${r.error ? 'bg-rose-50 border-rose-100' : r.skipped ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50/60 border-emerald-100'}`}>
                                  <span className="font-semibold text-charcoal">{r.agent}</span>
                                  <span className="text-muted-foreground"> · {r.action}</span>
                                  {r.title && <span className="text-emerald2"> · {r.title}</span>}
                                  {r.error && <span className="text-rose-600"> · {r.error}</span>}
                                  {r.skipped && <span className="text-slate-500"> · skipped: {r.skipped}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tint }) {
  const map = { emerald: 'text-emerald2', amber: 'text-amber-600', rose: 'text-rose-600', slate: 'text-slate-600' };
  return (
    <div className="bg-white rounded-2xl border p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl md:text-2xl font-bold ${map[tint] || 'text-charcoal'}`}>{value}</div>
    </div>
  );
}

export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
