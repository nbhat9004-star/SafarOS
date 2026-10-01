'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Upload, FileSpreadsheet, Check, X, Loader2, AlertTriangle, ArrowLeft,
  Download, Eye, Send, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { listingsApi } from '@/lib/listings-api';

// Lightweight CSV parser — handles quoted fields, embedded commas, CRLF.
function parseCsv(text) {
  const rows = [];
  let cur = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i+1] === '\n') i++;
        cur.push(field); field = '';
        if (cur.length > 1 || cur[0] !== '') rows.push(cur);
        cur = [];
      }
      else { field += c; }
    }
  }
  if (field !== '' || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows;
}

// Normalize header to a known field key.
const HEADER_MAP = {
  name: 'name', title: 'name',
  category: 'category', type: 'category',
  location: 'location', city: 'location', area: 'location',
  description: 'description', desc: 'description', about: 'description',
  phone: 'phone', mobile: 'phone',
  whatsapp: 'whatsapp', wa: 'whatsapp',
  price: 'price', rate: 'price', cost: 'price',
  'image_urls': 'images', 'image urls': 'images', images: 'images',
  image: 'images', photo: 'images', photos: 'images',
};
const normalizeKey = (k) => HEADER_MAP[k.toLowerCase().trim()] || k.toLowerCase().trim();

const CATEGORIES = ['houseboat','cabin','cottage','home','camp','tour','transport','experience'];

function validateRecord(rec) {
  const errs = [];
  if (!rec.name) errs.push('name');
  if (!rec.category) errs.push('category');
  else if (!CATEGORIES.includes(String(rec.category).toLowerCase())) errs.push('category (invalid)');
  if (!rec.location) errs.push('location');
  if (!rec.price || isNaN(Number(rec.price))) errs.push('price');
  return errs;
}

function recordToPayload(rec) {
  const images = (rec.images || '')
    .split(/[\|;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: rec.name,
    category: String(rec.category || '').toLowerCase(),
    location: rec.location,
    description: rec.description || '',
    price: Number(rec.price) || 0,
    images,
    phone: rec.phone || '',
    whatsapp: rec.whatsapp || '',
    status: 'pending',
  };
}

const SAMPLE_CSV = `name,category,location,description,phone,whatsapp,price,image_urls
Valley Pine Cottage,cottage,"Pahalgam, Anantnag",Riverside 2BR cottage with bonfire and garden.,+919999900001,+919999900001,4500,https://example.com/a.jpg|https://example.com/b.jpg
Snowline Cabin,cabin,"Gulmarg, Baramulla",Ski-in/ski-out cabin near Gondola Phase 1.,+919999900002,+919999900002,9200,https://example.com/c.jpg
`;

function AdminImportInner() {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]); // parsed records (objects)
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null); // { success, failed: [{row, error}] }

  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      toast.error('Please choose a .csv file');
      return;
    }
    const text = await f.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast.error('CSV is empty or has no rows');
      return;
    }
    const rawHeaders = parsed[0].map(normalizeKey);
    const dataRows = parsed.slice(1).map((cols) => {
      const rec = {};
      rawHeaders.forEach((h, idx) => { rec[h] = (cols[idx] ?? '').trim(); });
      return rec;
    });
    setFileName(f.name);
    setHeaders(rawHeaders);
    setRows(dataRows);
    setResults(null);
    toast.success(`Parsed ${dataRows.length} record${dataRows.length === 1 ? '' : 's'}`);
  };

  const stats = useMemo(() => {
    const valid = rows.filter((r) => validateRecord(r).length === 0).length;
    return { total: rows.length, valid, invalid: rows.length - valid };
  }, [rows]);

  const clearAll = () => {
    setRows([]); setHeaders([]); setFileName(''); setResults(null);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'safar-listings-sample.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    if (stats.valid === 0) {
      toast.error('No valid rows to import');
      return;
    }
    if (!confirm(`Import ${stats.valid} valid listing${stats.valid === 1 ? '' : 's'} as PENDING (review required)?`)) return;
    setImporting(true);
    setResults(null);
    const ok = []; const failed = [];
    for (let i = 0; i < rows.length; i++) {
      const rec = rows[i];
      const errs = validateRecord(rec);
      if (errs.length) {
        failed.push({ row: i + 1, name: rec.name || `(row ${i+1})`, error: `Missing/invalid: ${errs.join(', ')}` });
        continue;
      }
      try {
        const payload = recordToPayload(rec);
        const res = await listingsApi.create(payload);
        if (res.ok && res.data?.ok) ok.push({ row: i + 1, name: rec.name, id: res.data.listing?.id });
        else failed.push({ row: i + 1, name: rec.name, error: res.data?.error || `HTTP ${res.status}` });
      } catch (err) {
        failed.push({ row: i + 1, name: rec.name, error: err?.message || 'Network error' });
      }
    }
    setResults({ success: ok, failed });
    setImporting(false);
    if (ok.length) toast.success(`Imported ${ok.length} listing${ok.length === 1 ? '' : 's'} (pending review)`);
    if (failed.length) toast.error(`${failed.length} row${failed.length === 1 ? '' : 's'} failed`);
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container pb-16">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal mb-4">
          <ArrowLeft className="size-4" /> Back to Admin
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Admin · Tools</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">CSV listing import</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">Upload a CSV to bulk-create listings. All imported listings are marked <strong>pending</strong> and require manual review on the main Admin page before going live.</p>
          </div>
          <Button variant="outline" onClick={downloadSample} className="rounded-full"><Download className="size-4 mr-2" /> Download sample CSV</Button>
        </div>

        {/* Upload area */}
        <div className="mt-8 rounded-3xl border bg-white p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-50 grid place-items-center shrink-0"><FileSpreadsheet className="size-6 text-emerald2" /></div>
            <div className="flex-1">
              <div className="font-display font-bold text-lg">Choose a CSV file</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Supported headers: <code className="text-charcoal/80">name, category, location, description, phone, whatsapp, price, image_urls</code> (image URLs separated by <code>|</code>).
              </div>
            </div>
            <label className="inline-flex">
              <input type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" />
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold cursor-pointer transition">
                <Upload className="size-4" /> Select CSV
              </span>
            </label>
          </div>
          {fileName && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-secondary text-sm">
              <FileSpreadsheet className="size-4 text-emerald2" />
              <span className="font-medium">{fileName}</span>
              <span className="text-xs text-muted-foreground">— {stats.total} row{stats.total === 1 ? '' : 's'} parsed</span>
              <button onClick={clearAll} className="ml-auto text-muted-foreground hover:text-rose-600" aria-label="Clear"><Trash2 className="size-4" /></button>
            </div>
          )}
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Eye className="size-5 text-emerald2" /> Preview</h2>
              <div className="text-sm text-muted-foreground">
                <span className="text-emerald2 font-semibold">{stats.valid}</span> valid · <span className="text-rose-600 font-semibold">{stats.invalid}</span> invalid
              </div>
            </div>
            <div className="rounded-3xl border bg-white overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 w-12">#</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Price</th>
                    <th className="text-left px-4 py-3">Images</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => {
                    const errs = validateRecord(r);
                    const imgCount = (r.images || '').split(/[\|;\n]+/).filter(Boolean).length;
                    return (
                      <tr key={i} className="border-t hover:bg-secondary/30 transition">
                        <td className="px-4 py-3 text-muted-foreground">{i+1}</td>
                        <td className="px-4 py-3 font-medium">{r.name || <span className="text-rose-600">—</span>}</td>
                        <td className="px-4 py-3 capitalize">{r.category || <span className="text-rose-600">—</span>}</td>
                        <td className="px-4 py-3">{r.location || <span className="text-rose-600">—</span>}</td>
                        <td className="px-4 py-3">{r.phone || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3">{r.price ? `₹${Number(r.price).toLocaleString('en-IN')}` : <span className="text-rose-600">—</span>}</td>
                        <td className="px-4 py-3 text-xs">{imgCount} url{imgCount === 1 ? '' : 's'}</td>
                        <td className="px-4 py-3">
                          {errs.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald2 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Check className="size-3" /> ok</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full" title={errs.join(', ')}><AlertTriangle className="size-3" /> {errs.length} err</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > 50 && (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center border-t">Showing first 50 of {rows.length} rows. All valid rows will be imported.</div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={runImport} disabled={importing || stats.valid === 0} className="rounded-full bg-gradient-emerald font-semibold">
                {importing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                Import {stats.valid} pending listing{stats.valid === 1 ? '' : 's'}
              </Button>
              <Button variant="outline" onClick={clearAll} className="rounded-full" disabled={importing}>Clear</Button>
              <span className="text-xs text-muted-foreground">Imported listings remain <strong>pending</strong> until approved on the Admin page.</span>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {results && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center gap-2 text-emerald2 font-display font-bold text-lg"><Check className="size-5" /> Imported ({results.success.length})</div>
              {results.success.length === 0 ? (
                <div className="text-sm text-muted-foreground mt-2">None imported.</div>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm max-h-72 overflow-y-auto">
                  {results.success.map((s) => (
                    <li key={s.row} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60">
                      <span className="truncate">Row {s.row} · {s.name}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">pending</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/admin">Review on Admin page →</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center gap-2 text-rose-600 font-display font-bold text-lg"><X className="size-5" /> Failed ({results.failed.length})</div>
              {results.failed.length === 0 ? (
                <div className="text-sm text-muted-foreground mt-2">No failures 🎉</div>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm max-h-72 overflow-y-auto">
                  {results.failed.map((f) => (
                    <li key={f.row} className="p-2 rounded-lg bg-rose-50/60">
                      <div className="font-medium truncate">Row {f.row} · {f.name}</div>
                      <div className="text-xs text-rose-700">{f.error}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin']}><AdminImportInner /></ProtectedRoute>;
}
