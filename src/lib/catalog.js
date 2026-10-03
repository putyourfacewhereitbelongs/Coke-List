import { useCallback, useEffect, useMemo, useState } from 'react';
import source from '../data/catalog.json';

const STORAGE_KEY = 'harrys-rtd-catalog-v1';

export const CATEGORIES = source.categories;
export const STORE = { name: source.store, tagline: source.tagline, generated: source.generated };

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const COLUMNS = [
  { key: 'sku', label: 'SKU', width: 86, editable: true },
  { key: 'name', label: 'Drink Name', width: 320, editable: true },
  { key: 'family', label: 'Brand Family', width: 210, editable: true },
  { key: 'size', label: 'Size', width: 96, editable: true },
  { key: 'container', label: 'Container', width: 124, editable: true },
  { key: 'pack', label: 'Packaging', width: 112, editable: true },
  { key: 'doorLabel', label: 'Cooler Door', width: 250, editable: true },
  { key: 'category', label: 'Category', width: 92, editable: false },
];

/** Shared, editable copy of the catalog (persisted to the browser). */
export function useCatalog() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {
      /* ignore corrupt storage */
    }
    return source.items;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota — edits stay in memory for this session */
    }
  }, [items]);

  const updateCell = useCallback((id, key, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }, []);

  const addRow = useCallback((category) => {
    setItems((prev) => {
      const id = Math.max(0, ...prev.map((i) => i.id)) + 1;
      return [
        ...prev,
        {
          id,
          sku: '',
          imageNo: '',
          name: 'New beverage',
          size: '20 oz',
          container: 'Bottle',
          pack: 'Single',
          family: 'Unassigned',
          category: category && category !== 'all' ? category : 'colas',
          image: '',
          door: 0,
          doorLabel: 'Unassigned',
          zeroSugar: false,
          verify: true,
        },
      ];
    });
    return true;
  }, []);

  const removeRow = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const replaceAll = useCallback((rows) => setItems(rows), []);

  const reset = useCallback(() => {
    setItems(source.items);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const dirty = useMemo(() => JSON.stringify(items) !== JSON.stringify(source.items), [items]);

  return { items, updateCell, addRow, removeRow, replaceAll, reset, dirty };
}

export const countsByCategory = (items) =>
  CATEGORIES.map((c) => ({ ...c, count: items.filter((i) => i.category === c.id).length }));

export const familiesOf = (items, category) => {
  const scoped = category === 'all' ? items : items.filter((i) => i.category === category);
  const map = new Map();
  for (const item of scoped) map.set(item.family, (map.get(item.family) ?? 0) + 1);
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
};

export const doorsOf = (items) => {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.doorLabel)) map.set(item.doorLabel, { door: item.door, label: item.doorLabel, items: [] });
    map.get(item.doorLabel).items.push(item);
  }
  return [...map.values()].sort((a, b) => (a.door || 99) - (b.door || 99));
};

export const imageUrl = (item) => (item.image ? `${import.meta.env.BASE_URL}drinks/${item.image}` : '');
