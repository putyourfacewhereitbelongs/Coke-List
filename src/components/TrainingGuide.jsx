import { useMemo, useState } from 'react';
import Emblem from './Emblem.jsx';
import { CATEGORIES, STORE, imageUrl } from '../lib/catalog.js';

const ROWS_PER_PAGE = 19; // measured against US Letter at 0.32in margins

export default function TrainingGuide({ catalog }) {
  const { items } = catalog;
  const [columns, setColumns] = useState(4);
  const [withImages, setWithImages] = useState(true);
  const [withBoxes, setWithBoxes] = useState(true);
  const [scope, setScope] = useState('all');

  const list = scope === 'all' ? items : items.filter((i) => i.category === scope);

  const sections = useMemo(
    () =>
      CATEGORIES.map((c) => ({ ...c, list: list.filter((i) => i.category === c.id) })).filter((s) => s.list.length),
    [list]
  );

  const perPage = columns * ROWS_PER_PAGE;
  const sheets = Math.max(1, Math.ceil(list.length / perPage));

  return (
    <section>
      <div className="view__head no-print">
        <h2>Ultra-Compact Printable Training Guide</h2>
        <p>
          A micro-card layout built for the back office printer: thumbnail, drink name, size, container, packaging and
          SKU — the whole book on a few sheets of paper.
        </p>
      </div>

      <div className="toolbar no-print">
        <div className="toolbar__row">
          <select className="control" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Sections to print">
            <option value="all">Entire catalog ({items.length} SKUs)</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name} ({items.filter((i) => i.category === c.id).length})
              </option>
            ))}
          </select>
          <div className="chips">
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={'chip' + (columns === n ? ' chip--active' : '')}
                onClick={() => setColumns(n)}
              >
                {n} columns
              </button>
            ))}
          </div>
          <button
            type="button"
            className={'chip chip--toggle' + (withImages ? ' chip--on' : '')}
            onClick={() => setWithImages((v) => !v)}
          >
            Thumbnails
          </button>
          <button
            type="button"
            className={'chip chip--toggle' + (withBoxes ? ' chip--on' : '')}
            onClick={() => setWithBoxes((v) => !v)}
          >
            Check-off boxes
          </button>
          <div className="spacer" />
          <span className="result-line">
            ≈ <b>{perPage}</b> items per page · <b>{sheets}</b> sheet{sheets === 1 ? '' : 's'} ({Math.ceil(sheets / 2)}{' '}
            double-sided)
          </span>
          <button className="btn btn--primary" type="button" onClick={() => window.print()}>
            🖨️ Print guide
          </button>
        </div>
      </div>

      <div className="print-note no-print">
        Print tip: use <b>Letter · Portrait</b>, margins <b>Default</b>, and turn <b>Background graphics ON</b> so the
        department bars print solid. Duplex (two-sided) puts the entire {items.length}-SKU catalog on{' '}
        {Math.ceil(sheets / 2)} physical sheet{Math.ceil(sheets / 2) === 1 ? '' : 's'}.
      </div>

      <div className="print-shell">
        <header className="ph">
          <Emblem size={46} />
          <div className="ph__title">
            <h1>Harry's Convenience Stores — RTD Beverage Training Guide</h1>
            <p>
              {STORE.tagline} · {list.length} ready-to-drink SKUs · revised {STORE.generated}
            </p>
          </div>
          <div className="signoff">
            <div>
              <b>Trainee</b>
              <span />
            </div>
            <div>
              <b>Trainer</b>
              <span />
            </div>
            <div>
              <b>Date verified</b>
              <span />
            </div>
          </div>
        </header>

        {sections.map((section) => (
          <div key={section.id}>
            <div className="pcat">
              <span>
                {section.emoji} {section.name}
              </span>
              <span>{section.list.length} SKUs</span>
            </div>
            <div className={`pgrid pgrid--${columns}`}>
              {section.list.map((item) => (
                <div className="pitem" key={item.id}>
                  {withImages && item.image && <img src={imageUrl(item)} alt="" />}
                  <div className="pitem__txt">
                    <div className="pitem__name">{item.name}</div>
                    <div className="pitem__meta">
                      {item.size} · {item.container}
                      {item.pack !== 'Single' ? ` · ${item.pack}` : ''} · #{item.sku || '—'}
                    </div>
                  </div>
                  {withBoxes && <span className="pitem__box" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
