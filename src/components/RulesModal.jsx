const RULES = [
  {
    title: '1 · "Coke with Coke" — brand blocking',
    body: 'Never mix brand families on a shelf. Every Coca-Cola Trademark package (Classic, Cherry, Vanilla, Cherry Float, Zero Sugar) blocks together in one vertical column. Diet Coke blocks with Diet Coke, Dr Pepper with Dr Pepper, Sprite with Sprite, Monster with Monster. A customer should be able to find their brand by walking to one spot in the vault.',
  },
  {
    title: '2 · Zero Sugar adjacency',
    body: 'Zero Sugar / Diet packages sit immediately to the right of their full-sugar parent — Coca-Cola Original then Coca-Cola Zero Sugar; Dr Pepper then Diet Dr Pepper then Dr Pepper Zero; Monster Original then Monster Zero Sugar then Ultra. Never isolate the diet set in its own door; it sells off the parent brand.',
  },
  {
    title: '3 · Vertical size hierarchy',
    body: 'Within a brand block, run packages top to bottom from smallest to largest: 7.5 oz minis and 8 oz glass on the top shelf, 12 oz / 16 oz cans next, 20 oz bottles at eye level (the money shelf), then 24 oz, then 1 L / 2 L and multipacks on the bottom where the weight belongs.',
  },
  {
    title: '4 · Eye level is buy level',
    body: '20 oz single-serve bottles of the top 10 movers (Coca-Cola Original, Coke Zero, Dr Pepper, Mountain-style flavors, Sprite) always hold the eye-level shelf. Slow movers and specialty flavors move up or down, never out of their brand block.',
  },
  {
    title: '5 · FIFO stock rotation',
    body: 'First In, First Out — always. Pull the existing stock forward, load the new cases behind it, and front-face every label. Check code dates on every rotation: dairy, Core Power, fairlife, Dunkin\' and juice are the first to date out, energy and water the last.',
  },
  {
    title: '6 · Full, faced and fronted',
    body: 'Every door gets faced at shift change: labels square to the glass, no gaps, no empty facings. If a SKU is out of stock, pull the shelf tag forward and spread the neighboring facings of the same brand — never fill the hole with a different brand.',
  },
  {
    title: '7 · Energy is a destination',
    body: 'Monster leads the energy set (Core, then Ultra Zero Sugar, then Juice, Rehab and Java), followed by Reign, Bang, NOS, Full Throttle and Storm. Keep 4-packs and 24 oz resealable cans on the bottom shelf of the energy doors.',
  },
  {
    title: '8 · Grab & Go discipline',
    body: 'Dairy, protein and iced coffee live in the Grab & Go cooler at 34–38 °F, rotated daily. Core Power 26 g and Elite 42 g block together; fairlife blocks by flavor; Dunkin\' bottles block ahead of the Dunkin\' espresso cans.',
  },
];

export default function RulesModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Planogram merchandising rules">
        <div className="modal__head">
          <h3>🧊 Cold Vault Merchandising Rules</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">
          <div className="rules">
            {RULES.map((r) => (
              <div className="rule" key={r.title}>
                <h4>{r.title}</h4>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
