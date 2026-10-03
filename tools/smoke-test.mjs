#!/usr/bin/env node
/**
 * Headless smoke test — builds nothing, just drives the production bundle in jsdom.
 *
 *   npm run build && npm run test:smoke
 *
 * Verifies that every view renders, the tabs switch, the catalog filters, and the
 * spreadsheet edits / adds / deletes rows without a console error.
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
if (!fs.existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.detail?.stack || e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('warn', (...a) => errors.push('console.warn: ' + a.join(' ')));

const dom = new JSDOM(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'), {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
const doc = window.document;

const bundle = fs.readdirSync(path.join(DIST, 'assets')).find((f) => f.endsWith('.js'));
const script = doc.createElement('script');
script.textContent = fs.readFileSync(path.join(DIST, 'assets', bundle), 'utf8');
doc.body.appendChild(script);

const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const click = async (el, ms) => {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(ms);
};
const dblclick = async (el, ms) => {
  el.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  await wait(ms);
};
const byText = (sel, text) => [...doc.querySelectorAll(sel)].find((e) => e.textContent.includes(text));

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) console.log(`  ✓ ${label}`);
  else {
    console.log(`  ✗ ${label} ${detail}`);
    failures++;
  }
};

await wait(1200);

console.log('catalog view');
const total = doc.querySelectorAll('.card').length;
check(`renders ${total} drink cards`, total === 258, `(got ${total})`);
check('every card has a photo', doc.querySelectorAll('.card__shot img').length === total);
check('masthead shows the store name', doc.body.textContent.includes("Harry's Convenience Stores"));

const energyChip = byText('.chip', 'Energy Drinks');
await click(energyChip, 500);
check('energy department filter', doc.querySelectorAll('.card').length === 79, `(got ${doc.querySelectorAll('.card').length})`);
const search = doc.querySelector('.search input');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
setter.call(search, 'mango loco');
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await wait(400);
check('search narrows results', doc.querySelectorAll('.card').length === 2, `(got ${doc.querySelectorAll('.card').length})`);
await click(byText('.btn', 'Clear filters'), 500);
check('clear filters restores the catalog', doc.querySelectorAll('.card').length === 258);

const tabs = [...doc.querySelectorAll('.tab')];

console.log('planogram view');
await click(tabs[1], 600);
check('renders cold vault zones', doc.querySelectorAll('.door').length === 14, `(got ${doc.querySelectorAll('.door').length})`);
check('every SKU is placed on a shelf', doc.querySelectorAll('.facing').length > 200);
await click(byText('.btn', 'Merchandising rules'), 400);
check('merchandising rules modal opens', doc.querySelectorAll('.modal .rule').length === 8);
await click(doc.querySelector('.modal .icon-btn'), 300);
check('modal closes', doc.querySelectorAll('.modal').length === 0);

console.log('training guide');
await click(tabs[2], 600);
check('renders one micro-card per SKU', doc.querySelectorAll('.pitem').length === 258);
check('defaults to a 4-column grid', !!doc.querySelector('.pgrid--4'));
check('prints the sign-off header', doc.querySelectorAll('.signoff div').length === 3);
await click(byText('.chip', '3 columns'), 400);
check('column switcher works', !!doc.querySelector('.pgrid--3'));

console.log('spreadsheet');
await click(tabs[3], 700);
const rowCount = () => doc.querySelectorAll('table.sheet tbody tr').length;
check(`renders ${rowCount()} rows`, rowCount() === 258, `(got ${rowCount()})`);
check('has 7 sheet tabs', doc.querySelectorAll('.sheet-tab').length === 7);
await click(doc.querySelectorAll('.sheet-tab')[2], 500);
check('energy sheet tab filters rows', rowCount() === 79, `(got ${rowCount()})`);
await click(doc.querySelectorAll('.sheet-tab')[0], 500);

const nameCell = doc.querySelector('table.sheet tbody tr td:nth-child(4)');
await dblclick(nameCell, 300);
const input = nameCell.querySelector('input');
check('double-click opens a cell editor', !!input);
if (input) {
  setter.call(input, 'Barq\'s Root Beer — TEST EDIT');
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await wait(400);
  check('edit is committed', doc.querySelector('table.sheet tbody tr td:nth-child(4)').textContent.includes('TEST EDIT'));
}
await click(byText('.btn', 'Add SKU'), 500);
check('add row', rowCount() === 259, `(got ${rowCount()})`);
await click(doc.querySelector('table.sheet tbody tr .row-tools button'), 500);
check('delete row', rowCount() === 258, `(got ${rowCount()})`);
await click(byText('.btn', 'Reset to original catalog'), 500);
check('reset clears local edits', !doc.querySelector('table.sheet tbody tr td:nth-child(4)').textContent.includes('TEST EDIT'));

const noise = errors.filter((e) => !/Not implemented: HTMLCanvasElement|Could not parse CSS/.test(e));
check('no console errors', noise.length === 0, '\n   ' + noise.slice(0, 6).join('\n   '));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
