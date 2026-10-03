import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CATEGORIES, CATEGORY_BY_ID, COLUMNS, imageUrl } from '../lib/catalog.js';

const HEADERS = ['SKU', 'Drink Name', 'Brand Family', 'Size', 'Container', 'Packaging', 'Cooler Door', 'Category', 'Image File'];

const toRow = (i) => [i.sku, i.name, i.family, i.size, i.container, i.pack, i.doorLabel, CATEGORY_BY_ID[i.category]?.name ?? i.category, i.image];

const sheetName = (label) => label.replace(/[\\/?*[\]:]/g, '-').slice(0, 31);

export default function SpreadsheetView({ catalog }) {
  const { items, updateCell, addRow, removeRow, replaceAll, reset, dirty } = catalog;
  const [sheet, setSheet] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const [editing, setEditing] = useState(null); // { id, key }
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const fileRef = useRef(null);

  const tabs = [
    { id: 'all', label: 'Master Catalog', count: items.length },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.short, count: items.filter((i) => i.category === c.id).length })),
  ];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sheet === 'all' ? items : items.filter((i) => i.category === sheet);
    if (q) list = list.filter((i) => toRow(i).join(' ').toLowerCase().includes(q));
    if (sort.key) {
      list = [...list].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * sort.dir);
    }
    return list;
  }, [items, sheet, query, sort]);

  const commit = () => {
    if (editing) updateCell(editing.id, editing.key, draft);
    setEditing(null);
  };

  const startEdit = (item, key) => {
    const col = COLUMNS.find((c) => c.key === key);
    if (!col?.editable) return;
    setEditing({ id: item.id, key });
    setDraft(String(item[key] ?? ''));
  };

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 4000);
  };

  /* ----------------------------------------------------------- exports */
  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const build = (list) => {
      const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...list.map(toRow)]);
      ws['!cols'] = [{ wch: 10 }, { wch: 46 }, { wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 34 }, { wch: 28 }, { wch: 52 }];
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: list.length, c: HEADERS.length - 1 } }) };
      return ws;
    };
    XLSX.utils.book_append_sheet(wb, build(items), sheetName(`Master Catalog (${items.length})`));
    for (const c of CATEGORIES) {
      const list = items.filter((i) => i.category === c.id);
      if (list.length) XLSX.utils.book_append_sheet(wb, build(list), sheetName(`${c.short} (${list.length})`));
    }
    XLSX.writeFile(wb, `Harrys-RTD-Inventory-${new Date().toISOString().slice(0, 10)}.xlsx`);
    flash(`Exported ${items.length} SKUs across ${CATEGORIES.length + 1} sheet tabs.`);
  };

  const exportCsv = () => {
    const list = sheet === 'all' ? items : items.filter((i) => i.category === sheet);
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...list.map(toRow)]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Harrys-RTD-${sheet}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash(`Exported ${list.length} rows to CSV.`);
  };

  /* ------------------------------------------------------------ import */
  const onImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!raw.length) throw new Error('that file has no rows');

      const pick = (row, ...names) => {
        for (const n of names) {
          const key = Object.keys(row).find((k) => k.trim().toLowerCase() === n.toLowerCase());
          if (key && String(row[key]).trim() !== '') return String(row[key]).trim();
        }
        return '';
      };
      const catId = (label) =>
        CATEGORIES.find((c) => c.name.toLowerCase() === label.toLowerCase() || c.short.toLowerCase() === label.toLowerCase() || c.id === label.toLowerCase())?.id ?? 'colas';

      const imported = raw.map((row, idx) => {
        const name = pick(row, 'Drink Name', 'Name', 'Product');
        const existing = items.find((i) => i.sku && i.sku === pick(row, 'SKU'));
        return {
          id: idx + 1,
          sku: pick(row, 'SKU'),
          imageNo: existing?.imageNo ?? '',
          name: name || 'Unnamed beverage',
          size: pick(row, 'Size') || '20 oz',
          container: pick(row, 'Container') || 'Bottle',
          pack: pick(row, 'Packaging', 'Pack') || 'Single',
          family: pick(row, 'Brand Family', 'Family') || 'Unassigned',
          category: catId(pick(row, 'Category') || existing?.category || 'colas'),
          image: pick(row, 'Image File', 'Image') || existing?.image || '',
          door: existing?.door ?? 0,
          doorLabel: pick(row, 'Cooler Door', 'Door') || existing?.doorLabel || 'Unassigned',
          zeroSugar: /zero|diet/i.test(name),
          verify: existing?.verify ?? false,
        };
      });
      replaceAll(imported);
      flash(`Imported ${imported.length} rows from ${file.name}.`);
    } catch (err) {
      flash(`Import failed — ${err.message}`);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section>
      <div className="view__head">
        <h2>Interactive Inventory Spreadsheet</h2>
        <p>
          A live worksheet of the whole vault. Double-click any cell to correct a description, pack size, SKU or cooler
          door — edits save to this browser and flow through the catalog, planogram and printable guide.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar__row">
          <label className="search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter rows…" aria-label="Filter rows" />
          </label>
          <button className="btn btn--primary" type="button" onClick={exportXlsx}>
            ⬇️ Export .xlsx workbook
          </button>
          <button className="btn" type="button" onClick={exportCsv}>
            ⬇️ Export CSV
          </button>
          <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
            ⬆️ Import file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onImport}
            style={{ display: 'none' }}
          />
          <button className="btn" type="button" onClick={() => addRow(sheet)}>
            ➕ Add SKU
          </button>
          <div className="spacer" />
          <button className="btn btn--ghost btn--sm" type="button" onClick={reset} disabled={!dirty}>
            ↺ Reset to original catalog
          </button>
        </div>
        {status && (
          <div className="toolbar__row">
            <span className="result-line">✅ {status}</span>
          </div>
        )}
      </div>

      <div className="sheet-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'sheet-tab' + (sheet === t.id ? ' sheet-tab--active' : '')}
            onClick={() => setSheet(t.id)}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th style={{ width: 44 }}>#</th>
              <th style={{ width: 42 }}>Photo</th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, cursor: 'pointer' }}
                  onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? -s.dir : 1 }))}
                  title="Sort"
                >
                  {c.label} {sort.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : ''}
                </th>
              ))}
              <th style={{ width: 54 }} className="no-print">
                Row
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={item.id}>
                <td>
                  <span className="cell cell--num">{idx + 1}</span>
                </td>
                <td>{item.image ? <img className="sheet__thumb" src={imageUrl(item)} alt="" loading="lazy" /> : null}</td>
                {COLUMNS.map((c) => {
                  const isEditing = editing?.id === item.id && editing?.key === c.key;
                  const value = c.key === 'category' ? CATEGORY_BY_ID[item.category]?.short ?? item.category : item[c.key];
                  return (
                    <td key={c.key} onDoubleClick={() => startEdit(item, c.key)}>
                      {isEditing ? (
                        <span className="cell">
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit();
                              if (e.key === 'Escape') setEditing(null);
                            }}
                          />
                        </span>
                      ) : (
                        <span className={'cell' + (c.editable ? ' cell--editable' : '')} title={c.editable ? 'Double-click to edit' : ''}>
                          {value}
                          {c.key === 'name' && item.verify ? <span className="legend-dot" style={{ marginLeft: 6 }} title="Needs review" /> : null}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="no-print">
                  <span className="row-tools">
                    <button className="btn btn--sm btn--ghost" onClick={() => removeRow(item.id)} title="Delete row">
                      🗑
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sheet-foot">
        <span>
          {rows.length} row{rows.length === 1 ? '' : 's'} shown · {items.length} SKUs total ·{' '}
          <span className="legend-dot" /> needs review ({items.filter((i) => i.verify).length})
        </span>
        <span>Double-click a cell to edit · Enter saves · Esc cancels{dirty ? ' · unsaved local edits' : ''}</span>
      </div>
    </section>
  );
}
