#!/usr/bin/env node
/**
 * Harry's Convenience Stores — catalog builder
 *
 * Reads tools/sku-map.txt (the human-maintained master list), matches every row to
 * its original myCoke photo export (NNN-SKU.png), renames the photo to a clean,
 * descriptive drink name inside public/drinks/, and emits src/data/catalog.json.
 *
 *   node tools/build-catalog.mjs            # report only
 *   node tools/build-catalog.mjs --write    # also move/rename the image files
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WRITE = process.argv.includes('--write');
const DRINKS_DIR = path.join(ROOT, 'public', 'drinks');

const CATEGORIES = [
  { id: 'colas', name: 'Colas & Carbonated Soft Drinks', short: 'Colas & Soft Drinks', emoji: '🥤', color: '#C8102E' },
  { id: 'energy', name: 'Energy Drinks', short: 'Energy Drinks', emoji: '⚡', color: '#15803D' },
  { id: 'sports', name: 'Sports & Hydration', short: 'Sports & Hydration', emoji: '🏃', color: '#1D4ED8' },
  { id: 'water', name: 'Waters & Wellness', short: 'Waters & Wellness', emoji: '💧', color: '#0E7490' },
  { id: 'juice', name: 'Juices, Teas & Kids Drinks', short: 'Juices & Teas', emoji: '🧃', color: '#B45309' },
  { id: 'dairy', name: 'Dairy, Coffee & Protein', short: 'Dairy & Coffee', emoji: '🥛', color: '#6D28D9' },
];

/** Cold vault planogram: which door each brand family lives behind. */
const DOORS = [
  { door: 1, label: 'Door 1 — Coca-Cola Trademark', test: (i) => i.family === 'Coca-Cola Family' && i.pack === 'Single' && i.size !== '2 Liter' && i.container !== 'Can' && i.container !== 'Mini Can' },
  { door: 2, label: 'Door 2 — Diet Coke & Dr Pepper', test: (i) => (i.family === 'Diet Coke Family' || i.family === 'Dr Pepper Family') && i.pack === 'Single' && i.size !== '2 Liter' && i.container !== 'Can' },
  { door: 3, label: 'Door 3 — Sprite, Fanta & Flavors', test: (i) => i.category === 'colas' && i.pack === 'Single' && i.size !== '2 Liter' && i.container !== 'Can' },
  { door: 4, label: 'Door 4 — Cans, Minis & Glass', test: (i) => i.category === 'colas' && i.pack !== '15-Pack' && i.size !== '2 Liter' },
  { door: 0, label: 'Floor Display — 2 Liters & Multipacks', test: (i) => i.category === 'colas' },
  { door: 5, label: 'Door 5 — Monster Core & Ultra', test: (i) => i.family === 'Monster Energy Core' || i.family === 'Monster Energy Ultra' },
  { door: 6, label: 'Door 6 — Monster Juice, Rehab & Java', test: (i) => i.family.startsWith('Monster') || i.family.startsWith('Java') },
  { door: 7, label: 'Door 7 — Reign, Bang, NOS & Storm', test: (i) => i.category === 'energy' },
  { door: 8, label: 'Door 8 — Powerade', test: (i) => i.family.startsWith('Powerade') },
  { door: 9, label: 'Door 9 — BODYARMOR', test: (i) => i.category === 'sports' },
  { door: 10, label: 'Door 10 — Still Water', test: (i) => ['smartwater', 'Dasani', 'BODYARMOR SportWater'].includes(i.family) },
  { door: 11, label: 'Door 11 — vitaminwater & Topo Chico', test: (i) => i.category === 'water' },
  { door: 12, label: 'Door 12 — Juice, Tea & Kids', test: (i) => i.category === 'juice' },
  { door: 13, label: 'Grab & Go Cooler — Dairy, Coffee & Protein', test: (i) => i.category === 'dairy' },
];

const slug = (s) =>
  s
    .replace(/&/g, 'and')
    .replace(/%/g, ' Percent ')
    .replace(/\./g, '_')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const sizeToken = (size) => slug(size.replace(/ oz$/, 'oz').replace(/ Liter$/, 'L'));

/* ---------------------------------------------------------------- read map */
const mapFile = path.join(ROOT, 'tools', 'sku-map.txt');
const rows = fs
  .readFileSync(mapFile, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((line, idx) => {
    const [imageNo, name, size, container, pack, family, category, verify = ''] = line.split('|').map((s) => s.trim());
    if (!imageNo || !name || !category) throw new Error(`Bad row ${idx + 1}: ${line}`);
    return { imageNo, name, size, container, pack, family, category, verify: verify === 'verify' };
  });

/* ------------------------------------------------- match photos on the disk */
const sources = new Map(); // imageNo -> { file, sku }
for (const file of fs.readdirSync(ROOT)) {
  const m = /^(\d{3})-(\d+)\.png$/.exec(file);
  if (m) sources.set(m[1], { file, sku: m[2] });
}
for (const file of fs.existsSync(DRINKS_DIR) ? fs.readdirSync(DRINKS_DIR) : []) {
  if (file.endsWith('.png')) sources.set('drinks:' + file, { file: path.join('public/drinks', file) });
}

const missing = rows.filter((r) => !sources.has(r.imageNo)).map((r) => `${r.imageNo} ${r.name}`);
const mapped = new Set(rows.map((r) => r.imageNo));
const orphans = [...sources.keys()].filter((k) => !k.startsWith('drinks:') && !mapped.has(k));

/* ----------------------------------------------------------- build catalog */
const catalog = [];
const seenNames = new Map();
rows.forEach((r, i) => {
  const src = sources.get(r.imageNo);
  const packToken = r.pack && r.pack !== 'Single' ? '_' + slug(r.pack) : '';
  const base = `${slug(r.name)}_${sizeToken(r.size)}_${slug(r.container)}${packToken}`;
  if (seenNames.has(base)) throw new Error(`Duplicate image name ${base}.png (rows ${seenNames.get(base)} & ${i + 1})`);
  seenNames.set(base, i + 1);

  const doorRule = DOORS.find((d) => d.test(r)) ?? { door: 0, label: 'Unassigned' };
  const zeroSugar = /zero sugar|diet |zero |lyte|unsweetened/i.test(r.name);

  catalog.push({
    id: i + 1,
    sku: src ? src.sku ?? '' : '',
    imageNo: r.imageNo,
    name: r.name,
    size: r.size,
    container: r.container,
    pack: r.pack,
    family: r.family,
    category: r.category,
    image: `${base}.png`,
    door: doorRule.door,
    doorLabel: doorRule.label,
    zeroSugar,
    verify: r.verify,
  });
});

/* ------------------------------------------------------------ move the art */
if (WRITE) {
  fs.mkdirSync(DRINKS_DIR, { recursive: true });
  let moved = 0;
  for (const item of catalog) {
    const src = sources.get(item.imageNo);
    if (!src || src.file.startsWith('public/')) continue;
    const from = path.join(ROOT, src.file);
    const to = path.join(DRINKS_DIR, item.image);
    if (!fs.existsSync(from)) continue;
    try {
      execFileSync('git', ['mv', '-f', src.file, path.relative(ROOT, to)], { cwd: ROOT });
    } catch {
      fs.renameSync(from, to);
    }
    moved++;
  }
  console.log(`moved/renamed ${moved} product photos -> public/drinks/`);

  const byCategory = CATEGORIES.map((c) => ({ ...c, count: catalog.filter((i) => i.category === c.id).length }));
  const families = [...new Set(catalog.map((i) => i.family))].map((f) => ({
    name: f,
    category: catalog.find((i) => i.family === f).category,
    count: catalog.filter((i) => i.family === f).length,
  }));
  const doors = [...new Map(catalog.map((i) => [i.door, { door: i.door, label: i.doorLabel }])).values()]
    .sort((a, b) => a.door - b.door)
    .map((d) => ({ ...d, count: catalog.filter((i) => i.door === d.door).length }));

  const out = {
    store: "Harry's Convenience Stores",
    tagline: 'Your Local Friendly Convenience Store • Family-Owned Since 1991 • Fueling your need for SPEED...',
    generated: new Date().toISOString().slice(0, 10),
    total: catalog.length,
    categories: byCategory,
    families,
    doors,
    items: catalog,
  };
  fs.mkdirSync(path.join(ROOT, 'src', 'data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'catalog.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote src/data/catalog.json (${catalog.length} SKUs)`);
}

/* ---------------------------------------------------------------- reporting */
console.log(`rows: ${rows.length}`);
for (const c of CATEGORIES) console.log(`  ${c.name.padEnd(34)} ${catalog.filter((i) => i.category === c.id).length}`);
console.log(`  needs verification: ${catalog.filter((i) => i.verify).length}`);
if (missing.length) console.log(`MISSING PHOTOS (${missing.length}):\n  ` + missing.join('\n  '));
if (orphans.length) console.log(`UNMAPPED PHOTOS (${orphans.length}): ` + orphans.join(', '));
