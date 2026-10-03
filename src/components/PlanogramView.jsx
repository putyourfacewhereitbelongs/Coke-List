import { useMemo, useState } from 'react';
import RulesModal from './RulesModal.jsx';
import { doorsOf, imageUrl } from '../lib/catalog.js';

const SIZE_RANK = (s) => {
  const n = parseFloat(s);
  if (/liter/i.test(s)) return n * 33.8;
  return Number.isFinite(n) ? n : 99;
};

export default function PlanogramView({ catalog }) {
  const { items } = catalog;
  const [rulesOpen, setRulesOpen] = useState(false);
  const doors = useMemo(() => doorsOf(items), [items]);

  return (
    <section>
      <div className="view__head">
        <h2>Cold Vault Planogram Guide</h2>
        <p>
          How the vault is built at every Harry's: brand families blocked together, zero sugar beside its parent brand,
          and packages running small to large from the top shelf down.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar__row">
          <span className="result-line">
            <b>{doors.length}</b> merchandising zones · <b>{items.length}</b> SKUs placed
          </span>
          <div className="spacer" />
          <button className="btn btn--primary" type="button" onClick={() => setRulesOpen(true)}>
            📐 Merchandising rules
          </button>
        </div>
      </div>

      <div className="vault">
        {doors.map((door) => (
          <Door key={door.label} door={door} />
        ))}
      </div>

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </section>
  );
}

function Door({ door }) {
  const shelves = useMemo(() => {
    const map = new Map();
    for (const item of door.items) {
      if (!map.has(item.family)) map.set(item.family, []);
      map.get(item.family).push(item);
    }
    return [...map.entries()]
      .map(([family, list]) => ({
        family,
        list: [...list].sort((a, b) => SIZE_RANK(a.size) - SIZE_RANK(b.size) || a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => b.list.length - a.list.length || a.family.localeCompare(b.family));
  }, [door]);

  const [title, sub] = door.label.includes(' — ') ? door.label.split(' — ') : [door.label, ''];

  return (
    <div className="door">
      <div className="door__head">
        <div className="door__no">{door.door || '★'}</div>
        <div>
          <div className="door__title">{sub || title}</div>
          <div className="door__sub">
            {title} · {door.items.length} SKUs · {shelves.length} brand blocks
          </div>
        </div>
      </div>
      <div className="door__body">
        {shelves.map((shelf) => (
          <div className="shelf" key={shelf.family}>
            <div className="shelf__label">
              <span>{shelf.family}</span>
              <span>{shelf.list.length}</span>
            </div>
            <div className="shelf__row">
              {shelf.list.slice(0, 16).map((item) => (
                <div className="facing" key={item.id} title={`${item.name} · ${item.size} ${item.container}`}>
                  {item.image && <img src={imageUrl(item)} alt="" loading="lazy" />}
                </div>
              ))}
              {shelf.list.length > 16 && <div className="facing hint">+{shelf.list.length - 16}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
