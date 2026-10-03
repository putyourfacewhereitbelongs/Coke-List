import { useState } from 'react';
import Emblem from './components/Emblem.jsx';
import CatalogView from './components/CatalogView.jsx';
import PlanogramView from './components/PlanogramView.jsx';
import TrainingGuide from './components/TrainingGuide.jsx';
import SpreadsheetView from './components/SpreadsheetView.jsx';
import { STORE, useCatalog } from './lib/catalog.js';

const TABS = [
  { id: 'catalog', label: '🥤 Beverage Catalog' },
  { id: 'planogram', label: '🧊 Cold Vault Planogram' },
  { id: 'training', label: '🖨️ Printable Training Guide' },
  { id: 'sheet', label: '📊 Inventory Spreadsheet' },
];

export default function App() {
  const [tab, setTab] = useState('catalog');
  const catalog = useCatalog();
  const { items } = catalog;

  const zero = items.filter((i) => i.zeroSugar).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <Emblem size={58} />
            <div className="brand__text">
              <h1 className="brand__name">
                Harry's Convenience Stores <span>· RTD Beverage Training System</span>
              </h1>
              <p className="brand__tag">{STORE.tagline}</p>
            </div>
          </div>
          <div className="topbar__meta">
            <div className="stat">
              <b>{items.length}</b>
              <span>RTD SKUs</span>
            </div>
            <div className="stat">
              <b>6</b>
              <span>Departments</span>
            </div>
            <div className="stat">
              <b>{zero}</b>
              <span>Zero / Diet</span>
            </div>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'tab' + (tab === t.id ? ' tab--active' : '')}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'catalog' && <CatalogView catalog={catalog} />}
        {tab === 'planogram' && <PlanogramView catalog={catalog} />}
        {tab === 'training' && <TrainingGuide catalog={catalog} />}
        {tab === 'sheet' && <SpreadsheetView catalog={catalog} />}
      </main>
    </div>
  );
}
