# Omnipos — Windows 11 Redesign Plan

Branch: `feature/win11-redesign`
Goal: the app should feel like a native Windows 11 desktop app (Fluent 2 / WinUI 3), not a website. The POS screen gets the most work, and the cart gets much more room.

## Progress

| Phase | Status |
|---|---|
| P1 Window, theme, font, CSS | Done |
| P2 NavigationView sidebar, content layer | Done |
| P3 POS split into hook + components | Done |
| P4 POS layout | Done: resizable order pane (splitter, remembered width), one 48px command bar (scanner + search + mode/view switches), 40px category pivot, floating scan InfoBar, featured card optional (off by default), auto-fill product grid, footer with sticky total + flyouts for discount / cash / split / khata, F9 hint on Confirm. **Left for P5:** order details header (customer combobox, order type), 48px line-item rows, `getTokens()` → `makeStyles` |
| P5 POS dialogs + keyboard | Done: order header with Win11 command buttons (InfoBadge for held orders, F4 hint), order details restyled (neutral segmented order type, TextBox-style customer field), cart lines as 48px ListView rows, 7 POS dialogs with smoke backdrop (no blur), 8px corners, ContentDialog shadow and Escape to close (top-most only), POS font weights 400/600. Receipt paper preview keeps its print-like bold text. **Not done:** `getTokens()` → `makeStyles` (large, visual-neutral refactor), arrow-key line selection, A4 invoice template (shared, moved to P6) |
| P6 Other screens | Part 1 done: all live screens — font weights 700/800/900 → 600 (531), corners 10–18px → 8px (113), glow / red-tinted shadows removed (44); shared `CustomInput` / `CustomSelect` as Win11 TextBox / ComboBox (32px, 4px corners, accent underline on focus, list with accent pill). Print templates untouched. Part 2 done: Dashboard — neutral colours on theme tokens (58 dark/light pairs), status colours on Fluent status tokens (90), Win11 segmented tabs, flat cards (no coloured top bars / shadows), flat chart bars without glow, theme-aware tooltip; Reports already used Fluent tokens and palette. Helpers for the next parts: `scripts/win11-tokenize-styles.cjs`, `scripts/win11-status-colors.cjs`. Part 3 done: Catalog — status colours (202) and light-only slate / Fluent-grey neutrals + brand red (184) on theme tokens via `scripts/win11-neutral-brand.cjs`, shorthand borders tokenised, flat division icon tiles; barcode sticker print area deliberately left untouched (print colours must stay black on white). Next parts: Inventory, Khata / Customers / Expenses / Quotations, Admin Settings, Kitchen + Login / License, A4 invoice dialog chrome. Unused files (not imported anywhere, ~4,500 lines): `pages/*`, `components/admin/*`, `components/pos/*`, `components/stock/*`, `components/dashboard/*`, `components/SyncStatusIndicator.tsx`, `features/inventory/InventoryView.tsx` |

---

## 0. Current state (what makes it look like a website)

| Area | Now | Problem |
|---|---|---|
| Window | Default Electron frame, grey title bar, `autoHideMenuBar` | Looks like a browser window. No Mica, no custom title bar |
| Font | `Plus Jakarta Sans` first | Web-startup font. Windows 11 uses **Segoe UI Variable** |
| Accent | Red `#E51937` on many surfaces (selection, badges, active bars, splash glow) | Windows uses accent sparingly: primary button, selection indicator, focus |
| Theme | Two token sets: `AppProviders.tsx` (Fluent theme) + `getTokens()` inside `PosCounterView.tsx` (hard-coded hex) | Colours don't match between screens. 6,400-line POS file is all inline styles |
| Backdrops | Blur + saturate on every dialog | Web "glassmorphism". Windows 11 uses a plain dim (smoke) layer |
| Dropdowns | Forced dark `#16181f` even in light mode (`index.css`) | Breaks light theme |
| POS vertical space | Mode switcher bar (~38px) + pivot header (56px) + scanner bar + hero card (fast food) before products appear | About 200px lost before the first product row |
| Cart | Fixed `380px` and does not grow on large screens | Small on 1920px screens; 1–2 line items look cramped; footer (discount, totals, payment, tender) pushes the item list down |
| Sidebar | 236px expanded / 64px collapsed, applies to POS too | On POS, 236px goes to navigation instead of the cart |

---

## 1. Foundation: window and theme (whole app)

### 1.1 Native Windows 11 window (`src/main/index.ts`)
- `titleBarStyle: 'hidden'` + `titleBarOverlay` (native min/max/close buttons, coloured for the theme, height 40).
- `backgroundMaterial: 'mica'` (Electron 37 supports it on Win11; on Windows 10, fall back to a solid colour).
- Renderer body background **transparent** where Mica should show (title bar + nav pane). Content area uses a "layer" surface on top.
- New IPC call `window:setTitleBarTheme(mode)` so light/dark switches the overlay button colours.
- Raise `minWidth` to 1100 for the POS layout (to be decided — see questions).

### 1.2 Custom title bar component (`components/shell/TitleBar.tsx`, new)
- 40px tall, draggable (`-webkit-app-region: drag`).
- Left: app icon (16px) + "Omnipos" + current page name (Caption style, like File Explorer).
- Centre (optional): global search box / barcode quick search, 32px tall, `no-drag`.
- Right: sync status, user avatar, then the native caption buttons area (reserved width ~138px).

### 1.3 Single token system (`theme/AppProviders.tsx` + new `theme/win11Tokens.ts`)
- Use Fluent's `webLightTheme` / `webDarkTheme` as the base. Override only the brand ramp.
- **Accent**: keep Omnipos red as the brand, used only on primary buttons, selected nav indicator, focus ring and Pay button. Everything else uses neutrals.
- Windows 11 surface layers:
  - Light: Mica base `#F3F3F3`, layer `#FFFFFF` (≈ 70% alpha over Mica), card stroke `rgba(0,0,0,0.06)`.
  - Dark: Mica base `#202020`, layer `#2B2B2B` / `rgba(58,58,58,0.3)`, card stroke `rgba(255,255,255,0.08)`.
- Corner radius: **4px** for controls (buttons, inputs), **8px** for cards, flyouts and dialogs (the actual Win11 values — less round than now).
- Elevation: Win11 shadows (flyout `0 8px 16px rgba(0,0,0,0.14)`, dialog `0 32px 64px rgba(0,0,0,0.28)`).
- Typography (Win11 type ramp): Caption 12, Body 14, Body Strong 14/600, Subtitle 20/600, Title 28/600, Display 68. Font: `'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', sans-serif`. **Remove Plus Jakarta Sans.**
- Remove `getTokens()` from `PosCounterView.tsx` and use `tokens.*` from Fluent so every screen matches.

### 1.4 Global CSS cleanup (`index.css`)
- Remove forced dark dropdown styles; let Fluent's theme handle them.
- Dialog backdrop: plain `rgba(0,0,0,0.3)` (light) / `rgba(0,0,0,0.5)` (dark), **no blur**.
- Scrollbar: Win11 style thin bar (2px idle → 6px on hover, rounded).
- Selection highlight: system-like blue-grey, not red.
- Animations: Fluent curves (`cubic-bezier(0,0,0,1)`, 167ms / 250ms), no bounce.

---

## 2. Shell and navigation (`FluentSidebar.tsx`, `App.tsx`)

- Change the sidebar into a **WinUI NavigationView** look:
  - Transparent on Mica (no own background), sits under the title bar.
  - Items: 36px tall, 4px radius, hover = subtle fill, selected = subtle fill + **3px × 16px accent pill** on the left (Win11 style, not a full-height bar).
  - Expanded 256px → **Compact 48px** (icon only, tooltip on hover). Hamburger button at the top.
- **On POS routes, default to compact (48px)** → gives about 188px back to the cart and products. Remember the user's choice per screen.
- Content area = a "layer": rounded **top-left 8px corner**, 1px stroke, sits on top of the Mica, exactly like Settings / File Explorer in Windows 11.
- Splash and Login screens: remove radial gradient and red glow; plain Mica + logo + Fluent `Spinner`, like a Windows app starting.

---

## 3. POS screen — main focus (`features/pos/PosCounterView.tsx`)

### 3.1 New layout (3 zones)

```
┌──────────────────────────── Title bar 40px (Mica) ───────────────────────────────┐
├──┬────────────────────────────────────────────────┬──────────────────────────────┤
│N │ Command bar 48px: [Fast Food|Mart] [Search/Scan │  ORDER PANE (resizable)      │
│a │ ────────────────] [Grid|List] [Hold][Recall]     │  Header: Order #, customer,  │
│v │ Category pivot 40px (tabs)                      │  order type (Dine/Take/Del)  │
│  │ ─────────────────────────────────────────────── │ ──────────────────────────── │
│48│                                                 │  Line items (ListView)       │
│px│   Product grid (auto-fill, 140–180px tiles)     │  - 48px rows, big touch      │
│  │                                                 │  - qty stepper inline        │
│  │                                                 │  (most of the height)        │
│  │                                                 │ ──────────────────────────── │
│  │                                                 │  Summary (sticky): subtotal, │
│  │                                                 │  discount, tax, TOTAL 28px   │
│  │                                                 │  [ Payment ▾ ]  [  PAY  F9 ] │
└──┴─────────────────────────────────────────────────┴──────────────────────────────┘
```

### 3.2 More room for the cart
1. **Resizable order pane**: default width `clamp(420px, 34vw, 560px)`; drag the splitter to change; width saved in localStorage. (Now: fixed 380px.)
2. **Nav compact on POS** (section 2): +188px.
3. **Merge the top bars**: "Terminal Mode" bar + pivot header + scanner bar → one 48px **CommandBar** + one 40px category pivot. Saves about 60–90px of height.
4. **Scanner goes into the search box** (one input: typing searches, a barcode scan adds the item). The scan result shows as a small Win11 **InfoBar/toast**, not a block.
5. **Meal builder hero card** (fast food) → hide by default; open as a flyout when you click a product with variants. Saves ~170px of height.
6. **Cart footer split**:
   - Always visible (sticky): totals + payment method + big **Pay** button.
   - Discount, split payment, quick-cash denominations, khata → open in a **flyout / ContentDialog** from small buttons ("Discount", "Split", "Cash tender") so the line-item list is not pushed up.
7. Customer selection becomes a compact one-line `Combobox` in the pane header (collapsible details removed).
8. Line items: Win11 ListView rows, 48px (touch-friendly), thumbnail 32px, name + variant, inline `SpinButton`-like stepper, line total right-aligned; swipe/hover shows delete. Selected row gets the accent pill.
9. Once the pane is wide enough, the "Expand cart" drawer is no longer needed — remove it (or keep it only under 1280px).

### 3.3 Product area
- Grid: `repeat(auto-fill, minmax(150px, 1fr))` instead of fixed 4 columns.
- Tile = Win11 card: 8px radius, 1px stroke, image on top, name (Body Strong), price (Caption). Hover = subtle fill + lift; pressed = scale 0.98.
- List view (mart): Fluent `DataGrid` look, 40px rows, sticky header.
- Empty / loading: Fluent `Skeleton` with Win11 shimmer.

### 3.4 Keyboard-first (desktop feel)
- `F2` search/scan, `F4` customer, `F8` hold, `F9` pay, `Ctrl+D` discount, `Del` remove selected line, `+/-` qty, arrow keys move through lines.
- Shortcut hints shown in tooltips and on buttons (`Pay  F9`), like Windows apps.

### 3.5 Modals on POS
All 8 modals (variant picker, kitchen notes, held orders, receipt preview, A4 invoice, weight scale, wholesale numpad, expanded cart) → Fluent `Dialog` with Win11 **ContentDialog** look: 8px radius, title 20px Subtitle, footer with grey band, buttons right-aligned, no blur backdrop. Held orders → right side **Drawer** (Win11 panel).

### 3.6 Code structure (needed to make the redesign safe)
`PosCounterView.tsx` was 6,411 lines with inline styles. **Done in P3** (moved verbatim, no behaviour change):
- `pos/usePosCounter.tsx`: all state, queries, effects and handlers (hook order unchanged); components get its result as `pos`
- `pos/PosCounterView.tsx`: the screen (72 lines) — catalog pane + order pane + dialogs
- `pos/catalog/`: `CatalogPane`, `TerminalModeBar`, `CatalogHeader`, `ScannerBar`, `MealBuilderCard`, `ProductCatalog`, `FastFoodVisualCard`
- `pos/order/`: `OrderPane`, `OrderPaneHeader`, `OrderDetails`, `OrderLineList`, `OrderFooter`
- `pos/dialogs/`: one file per modal (8)
- `pos/posTokens.ts`, `pos/posIcons.tsx`, `pos/posTypes.ts`

Still to do in P4 while redesigning: replace `getTokens()` inline styles with `makeStyles` + Fluent tokens, merge `TerminalModeBar` + `CatalogHeader` + `ScannerBar` into one CommandBar, split `OrderFooter` into a sticky summary + flyouts.

---

## 4. Other screens (after POS)

Same Win11 rules, in this order:
1. Dashboard / Reports — cards as Win11 "settings cards", charts in neutral colours + accent.
2. Catalog, Inventory, Customers, Khata, Expenses — Fluent `DataGrid`, CommandBar on top, details in a side panel.
3. Admin settings — exactly like the Windows 11 **Settings** app (left list, right "SettingsCard" rows with expanders).
4. Kitchen (KDS) — big-tile layout, keep high contrast.
5. License / Login / Splash.

---

## 5. Phases

| Phase | Scope | Result |
|---|---|---|
| **P1** | Window (Mica + custom title bar), token system, font, global CSS | Whole app instantly feels like Windows 11 |
| **P2** | NavigationView sidebar + content layer | Shell finished |
| **P3** | POS split into components (no visual changes yet) + typecheck | Safe base for the redesign |
| **P4** | POS new layout: command bar, resizable order pane, sticky summary, flyouts | Cart gets the extra room |
| **P5** | POS dialogs + keyboard shortcuts | POS finished |
| **P6** | Other screens (section 4) | Whole app consistent |

Each phase = its own commit(s) on `feature/win11-redesign`. After each phase: `npm run typecheck` + run in Electron (`npm run dev:electron`) + screenshots in light/dark at 1366×768 and 1920×1080.

---

## 6. Open questions (please decide)

1. **Accent colour**: keep Omnipos red as the accent, or use the **Windows system accent colour** (automatically follows the user's Windows setting)?
2. **Web mode** (`npm run dev` / Vercel): should the web build keep working? (Custom title bar and Mica exist only in Electron; on the web we show a plain header.)
3. **Default theme**: still dark, or follow the Windows light/dark setting automatically?
4. **Order pane side**: cart on the right (now) or left?
5. **Minimum window size**: OK to raise to 1100×700?
6. **Touch screen**: is the POS used on touch screens? (If yes: 48px rows and bigger buttons; if no, 40px rows for more items.)

---

## Note
The 8 files with uncommitted changes on `main` (printing, POS, admin, api) came with this branch. They should be committed first (on `main` or here) so that redesign commits stay separate.
