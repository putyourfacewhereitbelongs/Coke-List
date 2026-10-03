import { useMemo, useState } from 'react';
import { CATEGORY_BY_ID, countsByCategory, familiesOf, imageUrl } from '../lib/catalog.js';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" strokeLinecap="round" />
  </svg>
);

export default function CatalogView({ catalog }) {
  const { items } = catalog;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [family, setFamily] = useState('all');
  const [size, setSize] = useState('all');
  const [zeroOnly, setZeroOnly] = useState(false);
  const [verifyOnly, setVerifyOnly] = useState(false);

  const cats = countsByCategory(items);
  const families = familiesOf(items, category);
  const sizes = useMemo(
    () => [...new Set(items.map((i) => i.size))].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (category !== 'all' && i.category !== category) return false;
      if (family !== 'all' && i.family !== family) return false;
      if (size !== 'all' && i.size !== size) return false;
      if (zeroOnly && !i.zeroSugar) return false;
      if (verifyOnly && !i.verify) return false;
      if (!q) return true;
      return `${i.name} ${i.family} ${i.size} ${i.container} ${i.pack} ${i.sku} ${i.doorLabel}`.toLowerCase().includes(q);
    });
  }, [items, query, category, family, size, zeroOnly, verifyOnly]);

  // Group results by brand family so "Coke stays with Coke" on screen too.
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      if (!map.has(item.family)) map.set(item.family, []);
      map.get(item.family).push(item);
    }
    const order = ['colas', 'energy', 'sports', 'water', 'juice', 'dairy'];
    return [...map.entries()]
      .map(([name, list]) => ({ name, list, category: list[0].category }))
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name));
  }, [filtered]);

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setFamily('all');
    setSize('all');
    setZeroOnly(false);
    setVerifyOnly(false);
  };

  return (
    <section>
      <div className="view__head">
        <h2>Ready-to-Drink Beverage Catalog</h2>
        <p>
          Every bottled and canned beverage Harry's orders through myCoke, photographed, named and grouped by brand
          family — the same "Coke with Coke" order the cold vault is built in.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar__row">
          <label className="search">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drink name, brand, size or SKU…"
              aria-label="Search beverages"
            />
          </label>
          <select
            className="control"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            aria-label="Filter by brand family"
          >
            <option value="all">All brand families ({families.length})</option>
            {families.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.count})
              </option>
            ))}
          </select>
          <select className="control" value={size} onChange={(e) => setSize(e.target.value)} aria-label="Filter by size">
            <option value="all">All sizes</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={'chip chip--toggle' + (zeroOnly ? ' chip--on' : '')}
            onClick={() => setZeroOnly((v) => !v)}
          >
            Zero sugar / diet
          </button>
          <button
            type="button"
            className={'chip chip--toggle' + (verifyOnly ? ' chip--on' : '')}
            onClick={() => setVerifyOnly((v) => !v)}
            title="Items whose flavor or size could not be read directly off the can photo"
          >
            <span className="legend-dot" /> Needs review
          </button>
        </div>

        <div className="toolbar__row">
          <div className="chips">
            <button
              type="button"
              className={'chip' + (category === 'all' ? ' chip--active' : '')}
              onClick={() => {
                setCategory('all');
                setFamily('all');
              }}
            >
              All departments <span className="chip__count">{items.length}</span>
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                className={'chip' + (category === c.id ? ' chip--active' : '')}
                onClick={() => {
                  setCategory(c.id);
                  setFamily('all');
                }}
              >
                {c.emoji} {c.short} <span className="chip__count">{c.count}</span>
              </button>
            ))}
          </div>
          <div className="spacer" />
          <span className="result-line">
            Showing <b>{filtered.length}</b> of {items.length} SKUs
          </span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="empty">
          No beverages match those filters. <button className="btn btn--sm" onClick={resetFilters}>Reset</button>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.name}>
          <div className="section-bar">
            <span className="section-bar__swatch" style={{ background: CATEGORY_BY_ID[g.category]?.color ?? '#C8102E' }} />
            <h3>{g.name}</h3>
            <span className="section-bar__count">
              {g.list.length} {g.list.length === 1 ? 'SKU' : 'SKUs'} · {CATEGORY_BY_ID[g.category]?.name}
            </span>
          </div>
          <div className="grid">
            {g.list.map((item) => (
              <DrinkCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function DrinkCard({ item }) {
  return (
    <article className="card">
      {item.verify && <span className="flag-verify" title="Flavor/size read from the photo — confirm against the myCoke order guide" />}
      <div className="card__shot">
        {item.image ? <img src={imageUrl(item)} alt={item.name} loading="lazy" /> : <span className="hint">No photo</span>}
      </div>
      <div className="card__name">{item.name}</div>
      <div className="card__meta">
        <span className="pill pill--size">{item.size}</span>
        <span className="pill">{item.container}</span>
        {item.pack !== 'Single' && <span className="pill pill--pack">{item.pack}</span>}
        {item.zeroSugar && <span className="pill pill--zero">Zero</span>}
      </div>
      <div className="card__foot">
        <span className="card__sku">SKU {item.sku || '—'}</span>
        <span className="card__door">{item.doorLabel.replace(' — ', ' · ')}</span>
      </div>
    </article>
  );
}
