// SafarOS — Data Import & Migration Engine (foundation).
// CSV, XLSX, DOCX and text-based PDF parsing + header detection + mapping suggestions.
// All tenant scoping, validation, dedupe and inserts happen in the API layer
// using the EXISTING collection validators — this module only parses & maps.

import * as XLSX from 'xlsx';

// Max rows processed per import (keeps the foundation lightweight).
export const IMPORT_ROW_CAP = 2000;

// Import targets wired to EXISTING SafarOS collections (no new business data model).
export const IMPORT_META = {
  suppliers: { label: 'Suppliers', singular: 'supplier', collection: 'suppliers', perm: 'suppliers:create' },
  clients:   { label: 'Clients',   singular: 'client',   collection: 'clients',   perm: 'clients:create' },
  leads:     { label: 'Leads',     singular: 'lead',     collection: 'leads',     perm: 'leads:create' },
  vehicles:  { label: 'Vehicles',  singular: 'vehicle',  collection: 'vehicles',  perm: 'fleet:create' },
  drivers:   { label: 'Drivers',   singular: 'driver',   collection: 'drivers',   perm: 'fleet:create' },
};

// Field catalog per target. `key` matches the EXISTING create-validator body keys.
export const IMPORT_FIELDS = {
  suppliers: [
    { key: 'name', label: 'Name', required: true, aliases: ['name', 'supplier', 'supplier name', 'business', 'business name', 'company'] },
    { key: 'type', label: 'Type', aliases: ['type', 'category', 'supplier type'] },
    { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'contact', 'phone number', 'tel', 'telephone'] },
    { key: 'email', label: 'Email', aliases: ['email', 'e-mail', 'mail'] },
    { key: 'city', label: 'City', aliases: ['city', 'town'] },
    { key: 'address', label: 'Address', aliases: ['address', 'location', 'addr'] },
    { key: 'contactPerson', label: 'Contact Person', aliases: ['contact person', 'contact name', 'owner', 'person'] },
    { key: 'website', label: 'Website', aliases: ['website', 'site', 'url', 'web'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'remarks', 'description', 'note'] },
  ],
  clients: [
    { key: 'name', label: 'Name', required: true, aliases: ['name', 'client', 'client name', 'customer', 'customer name', 'full name'] },
    { key: 'email', label: 'Email', aliases: ['email', 'e-mail', 'mail'] },
    { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'contact', 'phone number', 'tel'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'remarks', 'description', 'note'] },
  ],
  leads: [
    { key: 'name', label: 'Name', required: true, aliases: ['name', 'lead', 'lead name', 'customer', 'full name'] },
    { key: 'email', label: 'Email', aliases: ['email', 'e-mail', 'mail'] },
    { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'contact', 'phone number', 'tel'] },
    { key: 'source', label: 'Source', aliases: ['source', 'lead source', 'channel'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'remarks', 'description', 'note', 'message'] },
  ],
  vehicles: [
    { key: 'vehicleNumber', label: 'Vehicle Number', required: true, aliases: ['vehicle number', 'vehicle no', 'number', 'reg number', 'registration number', 'registration', 'plate'] },
    { key: 'vehicleType', label: 'Type', aliases: ['type', 'vehicle type', 'category'] },
    { key: 'make', label: 'Make', aliases: ['make', 'brand', 'manufacturer'] },
    { key: 'model', label: 'Model', aliases: ['model'] },
    { key: 'seatingCapacity', label: 'Seating Capacity', aliases: ['seating capacity', 'seats', 'capacity', 'seater'] },
    { key: 'fuelType', label: 'Fuel Type', aliases: ['fuel type', 'fuel'] },
    { key: 'color', label: 'Color', aliases: ['color', 'colour'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'remarks', 'description'] },
  ],
  drivers: [
    { key: 'name', label: 'Name', required: true, aliases: ['name', 'driver', 'driver name', 'full name'] },
    { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'contact', 'phone number', 'tel'] },
    { key: 'email', label: 'Email', aliases: ['email', 'e-mail', 'mail'] },
    { key: 'licenseNumber', label: 'License Number', aliases: ['license number', 'licence number', 'license', 'licence', 'dl', 'dl number'] },
    { key: 'licenseExpiry', label: 'License Expiry', aliases: ['license expiry', 'licence expiry', 'dl expiry', 'expiry'] },
    { key: 'address', label: 'Address', aliases: ['address', 'location'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'remarks', 'description'] },
  ],
};

export function isValidImportTarget(t) {
  return !!IMPORT_META[t];
}

// Parse tabular content from a base64 upload. DOCX/PDF imports expect a
// first-row header and a real Word table or text-based PDF table; scanned PDFs
// require OCR and are rejected with a useful message.
function gridToRows(grid) {
  if (!Array.isArray(grid) || !grid.length) return { columns: [], rows: [] };
  const headers = (grid[0] || []).map((h, i) => (String(h || '').trim() || `Column ${i + 1}`));
  const rows = [];
  for (let r = 1; r < grid.length && rows.length < IMPORT_ROW_CAP; r++) {
    const arr = grid[r] || [];
    const obj = {}; let empty = true;
    headers.forEach((h, i) => { const v = arr[i] == null ? '' : String(arr[i]).trim(); obj[h] = v; if (v) empty = false; });
    if (!empty) rows.push(obj);
  }
  return { columns: headers, rows };
}

function decodeHtml(value) {
  return String(value || '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

async function parseDocx(buffer) {
  const mammothModule = await import('mammoth');
  const mammoth = mammothModule.default || mammothModule;
  const converted = await mammoth.convertToHtml({ buffer });
  const html = converted.value || '';
  const tableRows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      decodeHtml(cell[1].replace(/<\/p>\s*<p[^>]*>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    )
  ).filter((row) => row.length);
  if (tableRows.length >= 2) return gridToRows(tableRows);
  const raw = await mammoth.extractRawText({ buffer });
  const lines = String(raw.value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const grid = lines.map((line) => line.includes('\t') ? line.split('\t') : line.split(/\s{2,}/));
  if (grid.length >= 2 && grid[0].length >= 2) return gridToRows(grid);
  throw new Error('No importable table found. Add a header row and tabular rows to the Word document.');
}

async function parsePdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const grid = [];
  try {
    for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
      const page = await doc.getPage(pageNo);
      const content = await page.getTextContent();
      const lines = new Map();
      for (const item of content.items || []) {
        if (!item.str || !item.str.trim() || !item.transform) continue;
        const x = Number(item.transform[4]) || 0;
        const y = Number(item.transform[5]) || 0;
        const key = Math.round(y / 3) * 3;
        if (!lines.has(key)) lines.set(key, []);
        lines.get(key).push({ x, text: item.str.trim(), width: Number(item.width) || 0, size: Math.abs(Number(item.transform[0])) || 10 });
      }
      const pageRows = [...lines.entries()].sort((a, b) => b[0] - a[0]).map(([, items]) => {
        items.sort((a, b) => a.x - b.x);
        let line = ''; let end = null;
        for (const item of items) {
          if (end !== null) line += item.x - end > Math.max(12, item.size * 1.5) ? '\t' : ' ';
          line += item.text;
          end = item.x + item.width;
        }
        return line.trim();
      }).filter(Boolean);
      grid.push(...pageRows);
    }
  } finally {
    await doc.destroy();
  }
  const rows = grid.map((line) => line.includes('\t') ? line.split('\t').map((v) => v.trim()) : line.split(/\s{2,}/).map((v) => v.trim()));
  const usable = rows.filter((r) => r.length >= 2);
  if (usable.length < 2 || usable[0].length < 2) throw new Error('No readable table found. The PDF must contain selectable text arranged in columns; scanned PDFs need OCR first.');
  const width = Math.max(...usable.map((r) => r.length));
  return gridToRows(usable.map((r) => Array.from({ length: width }, (_, i) => r[i] || '')));
}
export async function parseUpload({ type = 'csv', content = '', encoding = 'base64' } = {}) {
  const buffer = Buffer.from(String(content), encoding === 'base64' ? 'base64' : 'utf8');
  if (type === 'docx') return parseDocx(buffer);
  if (type === 'pdf') return parsePdf(buffer);
  let workbook;
  if (type === 'csv') {
    const text = encoding === 'base64' ? buffer.toString('utf8') : String(content);
    workbook = XLSX.read(text, { type: 'string', raw: false });
  } else if (type === 'xlsx' || type === 'xls') {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } else {
    throw new Error('Unsupported file format. Use CSV, Excel, Word (.docx), or text-based PDF.');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { columns: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  return gridToRows(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: false }));
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Suggest a mapping { fieldKey: columnName } by matching headers against aliases.
export function suggestMapping(columns, fields) {
  const cols = columns.map((c) => ({ col: c, n: norm(c) }));
  const used = new Set();
  const mapping = {};
  for (const f of fields) {
    const cands = [f.key, f.label, ...(f.aliases || [])].map(norm).filter(Boolean);
    let hit = cols.find((c) => !used.has(c.col) && cands.includes(c.n));
    if (!hit) hit = cols.find((c) => !used.has(c.col) && cands.some((a) => a && (c.n === a || c.n.includes(a) || a.includes(c.n))));
    mapping[f.key] = hit ? hit.col : '';
    if (hit) used.add(hit.col);
  }
  return mapping;
}
