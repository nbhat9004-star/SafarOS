// SafarOS — Data Import & Migration Engine (foundation).
// Lightweight CSV + XLSX parsing + header detection + mapping suggestions.
// Architecture is format-extensible (PDF/JSON/XML/Tally are future phases).
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

// Parse a base64/text upload into { columns[], rows[] (array of header->value maps) }.
export function parseUpload({ type = 'csv', content = '', encoding = 'base64' } = {}) {
  let workbook;
  if (type === 'csv') {
    const text = encoding === 'base64' ? Buffer.from(String(content), 'base64').toString('utf8') : String(content);
    workbook = XLSX.read(text, { type: 'string', raw: false });
  } else {
    const buf = Buffer.from(String(content), 'base64');
    workbook = XLSX.read(buf, { type: 'buffer' });
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { columns: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: false });
  if (!grid.length) return { columns: [], rows: [] };
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
