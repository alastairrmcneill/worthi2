# Worthi — Project Reference

Personal net worth tracking app for iOS + Android (React Native / Expo). Focus: track net worth over time, not budgeting or expenses.

---

## Status

**Phase:** Pre-development. All planning complete. No code written yet.

**Design reference exists:** `design-reference/` contains:
- `vibrant.jsx` — full UI prototype (home, detail, onboarding, settings screens)
- `vibrant-sheets.jsx` — bottom sheet flows (add account, add entry)
- `graph.jsx` — custom Catmull-Rom SVG graph with scrub interaction
- `app.jsx` — root canvas with theme tweaks

---

## Tech Stack

| Concern | Decision |
|---|---|
| Framework | Expo managed (latest SDK) |
| Language | TypeScript strict |
| Navigation | Expo Router |
| State | Zustand |
| Graph | React Native Skia (`@shopify/react-native-skia`) |
| Bottom sheets | `@gorhom/bottom-sheet` |
| Storage | `expo-sqlite` (local-first; cloud sync deferred) |
| Font | Geist (bundled via `expo-font`) |
| Theme | Dark (Dusk) + Light (Linen), follows system, user can override |
| Tests | None for now |

### All dependencies

```
expo-sqlite expo-font expo-secure-store expo-haptics expo-router
expo-document-picker expo-sharing expo-file-system
@shopify/react-native-skia @gorhom/bottom-sheet
react-native-gesture-handler react-native-reanimated
react-native-safe-area-context react-native-screens
zustand
```

---

## Account Types

| Type | Key | Color | Behaviour |
|---|---|---|---|
| Current Account | `current` | `#3B82F6` blue | User enters current balance |
| Credit Card | `credit_card` | `#F43F5E` red | User enters amount owed → **stored negative** |
| Investment | `investment` | `#10B981` green | Deposited (cumulative running total) + current value; shows % return |
| Loan | `loan` | `#F97316` orange | User enters amount owed → **stored negative** |
| Pension | `pension` | `#8B5CF6` purple | Current value only; no return % |
| House | `house` | `#14B8A6` teal | Property value + mortgage balance; can be shared (see below) |

Colors used consistently: type chips, account dots, graph lines, filter chips.

---

## Key Business Rules

### Values & signs
- Credit card / loan: user types positive → stored as negative → displayed `-£1,200` in red
- House net worth contribution = `equity × (ownershipPct / 100)` where `equity = value - mortgageBalance`
- Investment return = `(value - deposited) / deposited * 100`
- Pension: value only, no return displayed

### Shared house
- House accounts have `is_shared` toggle + `ownership_pct` (1–99, default 50)
- Set on creation; editable via 3-dot menu → Edit
- Net worth uses user's equity share only
- Account card shows `"X% owned"` badge
- Detail graph y-axis = user's equity share (scaled)

### Archive behaviour
- Archived accounts: hidden from home list + filter chips
- Still contribute to net worth graph forever (last known value carried forward flat)
- Unarchive from Settings > Archived Accounts

### Graph interpolation
- Linear interpolation between logged entries at irregular intervals
- Before first entry: value = 0
- After last entry: carry last value forward (flat)
- Archived accounts: same rule (carry forward indefinitely)

### Home screen
- Big number at top = total net worth (or filtered total when type chip active)
- All 6 filter chips always visible; default "All"
- Accounts sorted by absolute value descending

### Currency
- User selects from settings; change is relabel only (no conversion)
- Auto-detected from device locale on first launch

---

## Data Model (SQLite)

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_archived INTEGER DEFAULT 0,
  purchase_price REAL,        -- house only
  original_deposit REAL,      -- house only
  is_shared INTEGER DEFAULT 0, -- house only
  ownership_pct REAL DEFAULT 50, -- house only, 1-99
  created_at INTEGER NOT NULL
);

CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date INTEGER NOT NULL,         -- unix ms, date precision
  value REAL NOT NULL,           -- balance / current value / property value
  deposited REAL,                -- investment only: cumulative deposited
  mortgage_balance REAL,         -- house only
  created_at INTEGER NOT NULL
);
CREATE INDEX entries_account_date ON entries(account_id, date);
```

---

## File Structure (to build)

```
src/
  app/
    _layout.tsx               Root layout: font loading, NavigationGuard, theme
    onboarding.tsx            3-screen onboarding (once, gated by hasOnboarded flag)
    (app)/
      _layout.tsx             Stack navigator
      index.tsx               Home screen
      account/[id].tsx        Account detail screen
      settings.tsx            Settings screen
      import-result.tsx       CSV import summary screen

  components/
    graph/
      NetWorthGraph.tsx     Skia graph (port of design-reference/graph.jsx)
      RangePicker.tsx       1M/3M/6M/1Y/All pill buttons
    accounts/
      AccountCard.tsx       Home list row
      AccountDot.tsx        Coloured type dot
      TypePill.tsx          Chip with colour + label
      FilterChip.tsx        Home screen type filter buttons
    sheets/
      AddAccountSheet.tsx   3-step add account flow
      AddEntrySheet.tsx     Add/edit entry (reused for both)
    common/
      Field.tsx             Label + input (port of VField)
      IconButton.tsx        SVG icon wrapper
  stores/
    accountStore.ts         Zustand: accounts + entries CRUD, wired to SQLite
    settingsStore.ts        Zustand: currency, themeOverride
  db/
    client.ts               expo-sqlite setup + migrations runner
    queries.ts              Typed query helpers
  lib/
    interpolate.ts          Linear interpolation between entries
    networth.ts             Net worth at date, filtered totals, equity calc
    formatting.ts           Intl.NumberFormat currency helpers
    csvImport.ts            Parse + validate CSV → typed import structures
    csvTemplate.ts          Generate downloadable template CSV
  theme/
    tokens.ts               DARK_THEME + LIGHT_THEME (from design-reference/vibrant.jsx)
    useTheme.ts             Hook returning active theme tokens
  constants/
    accountTypes.ts         ACCOUNT_TYPES config (color, label, glyph, sign)
```

---

## Screens

### Home
- Top bar: "Worthi" left, settings icon right
- Large net worth number (updates during graph scrub)
- `NetWorthGraph` + `RangePicker` (1M/3M/6M/1Y/All)
- 6 `FilterChip` (always visible; tap filters graph + list + header number)
- Account list (sorted by |value| desc)
- FAB (+) → `AddAccountSheet`
- Empty state: £0, flat graph, "Add your first account" CTA

### Account Detail
- Header: back, name, 3-dot menu (Archive / Rename+Edit / Delete)
- Large current value
- `NetWorthGraph`: investment = 2 lines (value solid + deposited dashed); house = 2 lines (property value solid + equity dashed, scaled to user's share if shared)
- `RangePicker`
- Type-specific summary stats grid
- "Add Entry" button → `AddEntrySheet`
- History list (newest first): date + values + edit (pencil) + delete (trash)
- Delete entry: confirmation alert
- Edit entry: `AddEntrySheet` pre-filled

### Settings
- Currency selector (GBP/USD/EUR/AUD/CAD)
- Import from CSV: file picker + "Download template"
- Archived accounts: list with Unarchive buttons

### Onboarding (3 slides)
1. "Know your number" — headline + subtext
2. "Every account, one place" — account types teaser
3. "Let's get started" — primary CTA opens `AddAccountSheet`; small secondary "Import from CSV" link

On account saved → `hasOnboarded = true` → navigate to home.
Skip button → home.

### Import Result
- "X accounts, Y entries imported"
- "Z rows skipped" with expandable error list
- "View your accounts →" → home

---

## CSV Import Format

Single file, all accounts. Columns:

```
account_name, account_type, date, value, deposited, mortgage_balance,
purchase_price, original_deposit, is_shared, ownership_pct
```

- `account_type`: `current` | `credit_card` | `investment` | `loan` | `pension` | `house`
- `date`: YYYY-MM-DD
- `value`: positive number (importer negates credit_card/loan automatically)
- `deposited`: investment only, cumulative running total
- `mortgage_balance`: house only
- `purchase_price` / `original_deposit`: house only, **first row for that account only**
- `is_shared`: `true`/`false` (house only)
- `ownership_pct`: 1–99 (house + shared only)
- Bad rows skipped; reported in import summary
- Always creates new accounts (no merge with existing)

---

## Graph (Skia port)

Port `design-reference/graph.jsx` → `src/components/graph/NetWorthGraph.tsx`:

- `@shopify/react-native-skia`: `Canvas`, `Path`, `LinearGradient`
- Catmull-Rom → cubic Bezier smoothing (same algorithm as prototype)
- Touch via `react-native-gesture-handler` → find nearest point → `onScrub({ts, value, x, y})`
- Release → `onScrub(null)` clears crosshair + tooltip
- Props: `series`, `series2`, `series2Style` ('dashed'|'solid'), `color`, `fillGradient`, `onScrub`, `showAxis`, `yDomainFrom`, `showZero`
- Series data: `{ ts: number, value: number }[]` (pre-interpolated by caller)

---

## Add Account Sheet (3 steps)

1. **Type picker**: 2-col grid, colour-coded cards with glyph + description
2. **Account details**:
   - Name field
   - House only: purchase price, original deposit, "Shared asset" toggle → if on: ownership % field (default 50)
3. **First entry**:
   - Date picker (today default)
   - house: current property value + current mortgage balance
   - investment: deposited running total + current value
   - credit_card / loan: amount owed (shown positive; stored negative)
   - current / pension: current balance

---

## Sessions

### Session 1 — Scaffold + Foundation ✅ COMPLETE
**Goal:** App boots, correct visual shell in place.

- `npx create-expo-app@latest Worthi --template blank-typescript`
- Install all dependencies (see full list above)
- Configure Expo Router (`app/_layout.tsx`, placeholder screens)
- `src/theme/tokens.ts` — DARK_THEME + LIGHT_THEME from vibrant.jsx
- `src/theme/useTheme.ts` — hook using `useColorScheme()` + Zustand override
- `src/constants/accountTypes.ts` — ACCOUNT_TYPES config
- Load Geist font via `expo-font` in root layout
- `src/stores/settingsStore.ts` — currency + themeOverride (Zustand + AsyncStorage)

**Done when:** App runs on simulator, dark/light theme switches with system, Geist font renders, all placeholder routes load without error.

---

### Session 2 — Data Layer ✅ COMPLETE
**Goal:** All data plumbing in place; no UI yet.

- `src/db/client.ts` — expo-sqlite setup, migrations runner
- `src/db/queries.ts` — typed CRUD helpers for accounts + entries
- `src/stores/accountStore.ts` — Zustand store wired to SQLite (load on init, all CRUD actions)
- `src/lib/interpolate.ts` — linear interpolation between entries
- `src/lib/networth.ts` — net worth at date T, filtered totals, equity calc (incl. shared house)
- `src/lib/formatting.ts` — `Intl.NumberFormat` currency helpers

**Done when:** Can create/read/update/delete accounts + entries via store; `networth.ts` produces correct values for all account types (verify with inline test calls or console logs).

---

### Session 3 — Graph Component
**Goal:** Reusable Skia graph ready to drop into any screen.

- `src/components/graph/NetWorthGraph.tsx` — port of `design-reference/graph.jsx` to React Native Skia
  - Catmull-Rom → cubic Bezier path smoothing
  - Area fill with gradient
  - Optional second line (dashed)
  - Touch scrub via gesture handler → `onScrub` callback
  - Crosshair + circle at scrub point; clears on release
- `src/components/graph/RangePicker.tsx` — 1M/3M/6M/1Y/All pill buttons

**Done when:** Graph renders with mock series data, scrub gesture fires correct `{ts, value}`, second line renders dashed, range picker selects ranges.

---

### Session 4 — Home Screen
**Goal:** Primary screen fully functional with real data.

- `app/(app)/index.tsx` — home screen
- `src/components/accounts/AccountCard.tsx` — list row (name, type pill, value, shared badge if applicable)
- `src/components/accounts/AccountDot.tsx`
- `src/components/accounts/TypePill.tsx`
- `src/components/accounts/FilterChip.tsx`
- Net worth header: scrub updates number; filter chip updates number
- Graph wired to real interpolated data from store
- All 6 filter chips always visible; "All" default
- Account list sorted by |value| desc
- FAB → placeholder (sheet wired in Session 6)
- Empty state: £0, flat graph, "Add your first account" prompt

**Done when:** Home screen shows real data from SQLite, scrub works, filter chips switch graph + list + header, empty state shows when no accounts.

---

### Session 5 — Account Detail Screen
**Goal:** Full per-account drill-down with history management.

- `app/(app)/account/[id].tsx`
- Type-specific summary stats grid (all 6 types; house shows shared % if applicable)
- Graph in detail: investment = value + deposited dashed; house = property value + equity dashed
- History list (newest first): date + values + pencil/trash icons
- Delete entry: confirmation alert → removes from DB
- Edit entry: opens `AddEntrySheet` pre-filled (sheet wired in Session 6 — use placeholder for now)
- 3-dot menu: Archive / Rename+Edit / Delete account
  - Archive: set `is_archived`, navigate back
  - Rename: inline prompt or simple modal
  - Delete: confirmation → cascade delete entries → navigate back

**Done when:** All account types render correct stats; history entries show, can be deleted; archive + delete account work; graph correct per type.

---

### Session 6 — Add / Edit Flows
**Goal:** Users can create accounts and log entries.

- `src/components/sheets/AddAccountSheet.tsx` — 3-step flow
  - Step 1: type picker grid
  - Step 2: name field; house adds purchase price, original deposit, shared toggle + ownership %
  - Step 3: first entry (type-specific fields; credit_card/loan: negate on save)
- `src/components/sheets/AddEntrySheet.tsx` — add + edit entry (reused)
  - Date picker (today default)
  - Type-specific fields
  - Pre-fills when editing
- `src/components/common/Field.tsx` — VField port (label + input, optional prefix, numeric)
- `src/components/common/IconButton.tsx`
- Wire FAB on home → `AddAccountSheet`
- Wire "Add Entry" button + edit pencil on detail → `AddEntrySheet`

**Done when:** Full add account flow works for all 6 types (including shared house); add/edit entry works; new data appears immediately in home + detail.

---

### Session 7 — Onboarding + Settings
**Goal:** First-launch experience and settings screen.

- `app/onboarding.tsx` — 3 slides
  - Slide 1: "Know your number"
  - Slide 2: "Every account, one place"
  - Slide 3: "Let's get started" — primary CTA opens `AddAccountSheet`; small secondary "Import from CSV" link
  - Skip → home
  - After account saved → set `hasOnboarded` flag → home
- `app/(app)/settings.tsx`
  - Currency selector (GBP/USD/EUR/AUD/CAD) → updates `settingsStore`
  - Archived accounts list with Unarchive buttons
  - Import from CSV button (wired in Session 8)
  - Download CSV template button (wired in Session 8)
- Root layout: check `hasOnboarded` flag → route to onboarding or home

**Done when:** Fresh install shows onboarding; skip/complete both route to home correctly; currency change relabels all values; unarchive restores account to home list.

---

### Session 8 — CSV Import
**Goal:** Users can import data from a CSV file.

- `src/lib/csvImport.ts` — parse + validate CSV
  - Validate row by row; skip bad rows, collect error reasons
  - Group by `account_name` → build Account + Entry structures
  - First row per account: read static fields
  - Auto-negate credit_card/loan values
- `src/lib/csvTemplate.ts` — generate example CSV with all columns + one row per account type
- `app/(app)/import-result.tsx` — summary screen
  - "X accounts, Y entries imported"
  - "Z rows skipped" with expandable error list
  - "View accounts →" → home
- Wire "Import from CSV" in settings + onboarding slide 3 → `expo-document-picker` → parse → write to DB → navigate to import-result
- Wire "Download template" → generate CSV → `expo-sharing`

**Done when:** Can import a well-formed CSV (all 6 types including shared house); summary shows correct counts; bad rows skipped and listed; template downloads and opens correctly.

---

### Session 9 — Polish
**Goal:** App feels native and production-ready.

- Haptic feedback on FAB, save, delete
- Sheet open/close animations (if not already from `@gorhom/bottom-sheet`)
- Loading states (DB init)
- Graceful handling of 0 entries (graph flat line at £0)
- Edge cases: account with 1 entry only; entry on today vs past
- Negative equity house (mortgage > value)
- Credit card / loan display always positive label with red colour
- Verify all interpolation edge cases
- App icon + splash screen slots (leave assets for user to drop in)
- Final pass on dark + light theme consistency

**Done when:** All verification checklist items pass.

---

## Verification Checklist

- [ ] Add investment + shared house (60%) + credit card; net worth = investment + (equity × 0.6) − CC
- [ ] Log entries at irregular dates; graph interpolates smoothly
- [ ] Scrub graph; header updates; tooltip + crosshair clear on release
- [ ] Archive account; hidden from list; historical graph data unchanged
- [ ] Toggle currency; symbol changes, numbers unchanged
- [ ] Kill + reopen app; all data persists
- [ ] System dark/light toggle; theme follows; settings override works
- [ ] Import test CSV; summary shows correct counts + skipped rows
- [ ] Download CSV template; correct columns + example data

---

## Deferred (v2)

- Cloud sync (Supabase)
- Screenshot OCR import (vision model extracts values from old app screenshots)
- Manual account reordering
