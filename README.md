# Harry's Convenience Stores — Ready-to-Drink Beverage Training System

Official beverage training catalog, cold vault planogram guide, and interactive inventory
spreadsheet for **Harry's Convenience Stores** — *Family-Owned & Operated Since 1991* in
Tennessee and Georgia.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static production build in dist/
npm run catalog  # rebuild src/data/catalog.json from tools/sku-map.txt
```

---

## 🥤 Overview

This interactive system was engineered from the store's Coca-Cola (myCoke) inventory order
records. It catalogs **258 active Ready-to-Drink (RTD) bottled and canned beverage SKUs** —
one for every genuine product photo in the order export — cropped tightly into small, crisp
thumbnails and saved under clean, descriptive drink names.

Everything runs in the browser: no server, no database, no account. Edits made in the
spreadsheet are kept in local storage and flow straight through to the catalog, the planogram
and the printable training guide.

### Brand Identity & Design System

| Token | Value | Use |
| --- | --- | --- |
| Harry's Red | `#C8102E` | Primary brand color (Pantone 186 C) |
| Dark Red Accent | `#9E0018` | Hover / emblem ring |
| Soft Red Tint | `#FFF1F2` | Product photo backdrops, row hover |
| Neutral Dark / Charcoal | `#0F172A` / `#1E293B` | Masthead, door headers, table head |
| Neutral Warm Slate | `#F8FAFC` / `#E2E8F0` | Page background, borders |

- **Signature Emblem:** circular badge with a stylized cursive **"H"** and **"SINCE 1991"**
  subtext (`src/components/Emblem.jsx`, also used as the favicon).
- **Brand Tagline:** *"Your Local Friendly Convenience Store • Family-Owned Since 1991 •
  Fueling your need for SPEED..."*

---

## 📋 Beverage Categories & "Coke with Coke" Organization (258 RTD SKUs)

| Department | SKUs | Brand families |
| --- | --- | --- |
| 🥤 **Colas & Carbonated Soft Drinks** | **72** | Coca-Cola 23 · Fanta 12 · Sprite 12 · Dr Pepper 10 · Diet Coke 6 · Mello Yello 5 · Seagram's 2 · Barq's 1 · Fresca 1 |
| ⚡ **Energy Drinks** | **79** | Monster Core 16 · Monster Ultra 15 · Juice Monster 9 · Bang 9 · Java Monster & Killer Brew 7 · Reign 7 · Monster Rehab 5 · NOS 5 · Storm 4 · Full Throttle 2 |
| 🏃 **Sports & Hydration** | **40** | Powerade Isotonic 14 · BODYARMOR SuperDrink & LYTE 10 · Flash I.V. 7 · BODYARMOR Fit 5 · Powerade Power Water 4 |
| 💧 **Waters & Wellness** | **27** | vitaminwater 11 · smartwater 7 · Topo Chico Sabores 4 · Dasani 3 · BODYARMOR SportWater 2 |
| 🧃 **Juices, Teas & Kids Drinks** | **25** | Minute Maid 16 · Gold Peak 5 · Tum-E Yummies 4 |
| 🥛 **Dairy, Coffee & Protein** | **15** | Core Power 6 · Dunkin' 6 · fairlife 3 |

Packages span 7.5 oz mini cans, 8 oz and 12 oz glass bottles, 12 oz / 16 oz cans, 20 oz, 24 oz
and 28 oz bottles, 1 L / 1.5 L / 2 L bottles, 4-, 6-, 8-, 15- and 24-pack cases.

### 🧊 Cold vault zones

The 258 SKUs are placed across **14 merchandising zones** — Doors 1–4 for Coca-Cola Trademark,
Diet Coke & Dr Pepper, Sprite/Fanta/flavors, and cans/minis/glass; a floor display for 2 Liters
and multipacks; Doors 5–7 for energy; 8–9 for sports drinks; 10–11 for water; 12 for juice and
tea; and the Grab & Go cooler for dairy, coffee and protein.

---

## 🖼️ Descriptive Image Naming Convention

Every photo in `public/drinks/` is named for the beverage it shows — brand, flavor, size,
container and (when applicable) pack:

```
Coca_Cola_Original_Taste_20oz_Bottle.png
Coca_Cola_Cherry_16oz_Can.png
Coca_Cola_Mexican_12oz_Glass_Bottle_6_Pack.png
Monster_Energy_Ultra_Zero_Sugar_White_16oz_Can.png
Powerade_Mountain_Berry_Blast_28oz_Bottle.png
Core_Power_Elite_High_Protein_Chocolate_42g_14oz_Bottle.png
```

The original export filenames (`162-1026031.png`) are preserved as the **image number** and
**SKU** columns in the catalog, so any photo can still be traced back to its myCoke order line.

---

## 🖨️ Ultra-Compact Printable Training Guide

- Dedicated training view with a dedicated print stylesheet (US Letter, portrait, 0.32 in margins).
- Selectable **3 / 4 / 5-column** ultra-dense micro-card layout.
- Each card: 22 px drink thumbnail at left, then drink name, size, container, packaging, SKU and
  an optional check-off box.
- Roughly **76 items per page** at 4 columns — the entire 258-SKU catalog prints on about
  **4 sheets** (2 double-sided).
- Trainee / Trainer / Date-verified sign-off header prints at the top of the packet.
- Any department can be printed on its own (e.g. energy drinks only for a new vault resetter).

---

## 📊 Spreadsheet Capabilities

- **Sheet tabs:** Master Catalog (258), Colas & Soft Drinks (72), Energy Drinks (79), Sports &
  Hydration (40), Waters & Wellness (27), Juices & Teas (25), Dairy & Coffee (15).
- **Inline editing:** double-click any cell to fix a description, size, container, pack, SKU or
  cooler door. Enter saves, Esc cancels. Add and delete rows, sort by any column, filter rows.
- **Exports:** native multi-sheet `.xlsx` workbook (SheetJS, with auto-filters and sized
  columns) and CSV of the active tab.
- **Import:** load a `.xlsx`/`.csv` order guide back in; columns are matched by header name and
  existing SKUs keep their photos.
- **Reset:** one click restores the shipped catalog.

---

## 🔍 "Needs review" flags

The catalog was reconstructed from product photography, so **33 SKUs** carry an amber *needs
review* dot — mostly Monster Ultra and Reign cans whose flavor is only identifiable by can
color, plus a handful of bottle sizes (smartwater, SportWater) and single-vs-4-pack pairs that
share identical artwork. Filter for them in the catalog ("Needs review"), confirm against the
myCoke order guide, correct the name in the spreadsheet, and the dot clears on export.

---

## 🗂️ Project layout

```
public/drinks/           258 product photos, descriptively named
src/components/          Catalog, Planogram, Training guide, Spreadsheet, Emblem, Rules modal
src/data/catalog.json    Generated catalog (SKU, name, size, container, pack, family, door…)
src/lib/catalog.js       Shared editable-catalog state + helpers
tools/sku-map.txt        Human-maintained master list — the source of truth
tools/build-catalog.mjs  Renames photos + regenerates catalog.json
```

To add or correct a SKU, edit `tools/sku-map.txt` and run `npm run catalog`.

---

*Harry's Convenience Stores • Family-Owned & Operated Since 1991*
