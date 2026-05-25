# Worthi — Project Reference

Personal net worth tracking app for iOS + Android (React Native / Expo). Focus: track net worth over time, not budgeting or expenses.

---

## Status

**Phase:** Feature-complete. All 9 sessions done. Analytics wired.

**Design reference exists:** `design-reference/` contains:
- `vibrant.jsx` — full UI prototype (home, detail, onboarding, settings screens)
- `vibrant-sheets.jsx` — bottom sheet flows (add account, add entry)
- `graph.jsx` — custom Catmull-Rom SVG graph with scrub interaction
- `app.jsx` — root canvas with theme tweaks

---

## Tech Stack

| Concern | Decision |
|---|---|
| Framework | Expo managed (SDK 56) |
| Language | TypeScript strict |
| Navigation | Expo Router |
| State | Zustand |
| Graph | React Native Skia (`@shopify/react-native-skia`) |
| Bottom sheets | `@gorhom/bottom-sheet` v5 |
| Storage | `expo-sqlite` (local-first; cloud sync deferred) |
| Font | Geist (bundled via `expo-font`) |
| Theme | Dark (Dusk) + Light (Linen), follows system, user can override |
| Analytics | `mixpanel-react-native` (anonymous, no PII) |
| Tests | None for now |

### All dependencies

```
expo-sqlite expo-font expo-secure-store expo-haptics expo-router
expo-document-picker expo-sharing expo-file-system
@shopify/react-native-skia @gorhom/bottom-sheet
react-native-gesture-handler react-native-reanimated
react-native-safe-area-context react-native-screens
zustand mixpanel-react-native
```

> `mixpanel-react-native` has native modules — requires EAS Build or `npx expo run:ios`, does not work in Expo Go.

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
- House accounts have `is_shared` toggle + `ownership_pct` (1–99, default 50; non-shared stored as 100)
- Set on creation; editable via 3-dot menu → Rename
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
  ownership_pct REAL DEFAULT 50, -- house only; non-shared stores 100
  created_at INTEGER NOT NULL
);

CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date INTEGER NOT NULL,         -- unix ms, normalised to midnight local time
  value REAL NOT NULL,           -- balance / current value / property value
  deposited REAL,                -- investment only: cumulative deposited
  mortgage_balance REAL,         -- house only
  created_at INTEGER NOT NULL
);
CREATE INDEX entries_account_date ON entries(account_id, date);
```

---

## File Structure

```
src/
  app/
    _layout.tsx               Root layout: fonts, BottomSheetModalProvider, NavigationGuard, analytics init
    onboarding.tsx            3-slide onboarding (FlatList pagination, gated by hasOnboarded)
    (app)/
      _layout.tsx             Stack navigator
      index.tsx               Home screen
      account/[id].tsx        Account detail screen
      settings.tsx            Settings screen
      import-result.tsx       CSV import summary screen

  components/
    graph/
      NetWorthGraph.tsx       Skia graph: Catmull-Rom smoothing, gradient fill, scrub, optional dashed 2nd line
      RangePicker.tsx         1M/3M/6M/1Y/All pill buttons
    accounts/
      AccountCard.tsx         Home list row (name, TypePill, value, shared badge)
      AccountDot.tsx          Coloured type dot
      TypePill.tsx            Chip with colour dot + label
      FilterChip.tsx          Home screen type filter buttons
    sheets/
      AddAccountSheet.tsx     3-step BottomSheetModal: type grid → name/details → first entry
      AddEntrySheet.tsx       Add/edit entry BottomSheetModal (presentForAccount / presentForEdit)
    common/
      Field.tsx               Label + BottomSheetTextInput, optional currency prefix, numeric mode
      DateSelector.tsx        ← date → chevron row (midnight-normalised unix ms)
      IconButton.tsx          Ionicons wrapper with surface background

  stores/
    accountStore.ts           Zustand: accounts + entries CRUD, wired to SQLite
    settingsStore.ts          Zustand: currency, themeOverride, hasOnboarded (persisted AsyncStorage)

  db/
    client.ts                 expo-sqlite setup + migrations runner
    queries.ts                Typed CRUD helpers (snake_case ↔ camelCase mappers)

  lib/
    interpolate.ts            Linear interpolation; buildAccountSeries, buildInvestmentSeries, buildHouseSeries
    networth.ts               currentNetWorth, filteredNetWorth, buildHomeSeries, investmentStats, houseStats
    formatting.ts             Intl.NumberFormat helpers: formatCurrency, formatPercent, formatDate, ISO date parse
    csvImport.ts              DocumentPicker → parse/validate CSV → write to store → navigate to import-result
    csvTemplate.ts            Generate + share example CSV (expo-file-system/legacy + expo-sharing)
    analytics.ts              Mixpanel wrapper: initAnalytics(), track(); is_dev super property

  hooks/
    use-theme.ts              useTheme() + useIsDark() hooks

  constants/
    accountTypes.ts           ACCOUNT_TYPES config (color, label, glyph, sign, description)
    theme.ts                  DARK_THEME, LIGHT_THEME, HOME_GRAPH_COLOR, Spacing

  types/
    index.ts                  Account, Entry, NewAccount, NewEntry, SeriesPoint
```

---

## Analytics

`src/lib/analytics.ts` wraps `mixpanel-react-native`.

- `initAnalytics()` — call once in `_layout.tsx` on app boot; registers `is_dev` super property; SDK handles `$app_open` automatically
- `track(event, properties)` — fire-and-forget, never throws

**Token config:**
- Token read from `process.env.EXPO_PUBLIC_MIXPANEL_TOKEN`
- Local dev: set in `.env` (gitignored; see `.env.example`)
- EAS Build: add as project secret — `eas secret:create --scope project --name EXPO_PUBLIC_MIXPANEL_TOKEN --value <token>`

**Events tracked:**

| Event | Properties | Where |
|---|---|---|
| `account_created` | `account_type` | AddAccountSheet on save |
| `entry_added` | `account_type` | AddEntrySheet on save |
| `entry_edited` | `account_type` | AddEntrySheet on update |
| `entry_deleted` | `account_type` | account/[id].tsx delete confirm |
| `account_archived` | `account_type` | account/[id].tsx 3-dot menu |
| `account_unarchived` | `account_type` | account/[id].tsx + settings |
| `account_deleted` | `account_type` | account/[id].tsx delete confirm |
| `home_filter_changed` | `filter` | index.tsx filter chips |
| `home_range_changed` | `range` | index.tsx range picker |
| `detail_range_changed` | `range`, `account_type` | account/[id].tsx range picker |
| `onboarding_completed` | — | onboarding after account saved |
| `onboarding_skipped` | — | onboarding skip / "Skip for now" |
| `currency_changed` | `currency_code` | settings currency selector |
| `csv_imported` | `accounts_count`, `entries_count`, `skipped_count` | csvImport.ts |
| `csv_template_downloaded` | — | settings download button |

No PII, no `identify()`, no advertising identifiers. Mixpanel SDK manages anonymous `distinct_id` automatically.

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
- Header: back, TypePill + name, 3-dot menu (Archive / Rename / Delete)
- Large current value (equity for house; portfolio value for investment)
- `NetWorthGraph`: investment = value solid + deposited dashed; house = property value solid + equity dashed
- `RangePicker` (defaults to All)
- Type-specific stats grid (2-col):
  - investment: current value, total deposited, return £, return %
  - house: property value, mortgage, full equity, your equity, equity gain, purchase price
  - current/pension: current balance, last updated
  - credit_card/loan: amount owed, last updated
- "Add Entry" button → `AddEntrySheet`
- History list (newest first): date + values + pencil (edit) + trash (delete)
- 3-dot menu: ActionSheetIOS on iOS / Alert on Android
- Rename modal: TextInput modal, cross-platform

### Settings
- Currency selector (GBP/USD/EUR/AUD/CAD)
- Import from CSV + Download template
- Archived accounts: list with Restore buttons

### Onboarding (3 slides, FlatList)
1. "Know your number" — hero net worth number
2. "Every account, one place" — type chips grid
3. "Let's get started" — opens `AddAccountSheet`; "Skip for now" link

After account saved → `hasOnboarded = true` → home.
Skip → home.

### Import Result
- Success/fail icon
- Accounts created, entries imported, rows skipped counts
- Expandable skipped-row error list (row number + reason)
- "View Accounts" → home

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
- `purchase_price` / `original_deposit`: house only, first row for that account only
- `is_shared`: `true`/`false` (house only)
- `ownership_pct`: 1–99 (house + shared only)
- Bad rows skipped; reported in import summary
- Always creates new accounts (no merge with existing)
- Uses `expo-file-system/legacy` for file reads (new File API doesn't support content URIs from DocumentPicker)

---

## Graph (Skia)

`src/components/graph/NetWorthGraph.tsx`:

- `@shopify/react-native-skia`: `Canvas`, `Path`, `LinearGradient`, `DashPathEffect`
- Catmull-Rom → cubic Bezier smoothing
- Area fill with gradient
- Optional second line (`series2`, dashed or solid)
- Touch scrub via `PanResponder` → nearest point → `onScrub({ts, value, value2, x, y})`
- Release → `onScrub(null)` clears crosshair
- Props: `series`, `series2`, `series2Style`, `series2Color`, `color`, `fillGradient`, `onScrub`, `showAxis`, `showCrosshair`, `yDomainFrom`, `showZero`

---

## Bottom Sheets

`@gorhom/bottom-sheet` v5. `BottomSheetModalProvider` wraps the app in `_layout.tsx`.

Both sheets use `forwardRef` + `useImperativeHandle` to expose `present`/`dismiss`:

```ts
// AddAccountSheet
addAccountRef.current?.present()

// AddEntrySheet
addEntryRef.current?.presentForAccount(accountId)
addEntryRef.current?.presentForEdit(accountId, entry)
```

Use `BottomSheetTextInput` (not plain `TextInput`) inside sheets for correct keyboard handling.

---

## Add Account Sheet (3 steps)

1. **Type picker**: 2-col grid, coloured cards with glyph + description
2. **Account details**:
   - Name field
   - House only: purchase price (optional), original deposit (optional), "Shared asset" toggle → ownership % field (1–99, default 50)
3. **First entry**:
   - `DateSelector` (today default, ← → chevrons)
   - investment: deposited running total + current value
   - house: property value + mortgage balance (optional)
   - credit_card / loan: amount owed (shown positive; stored negative)
   - current / pension: current balance

---

## Sessions

### Session 1 — Scaffold + Foundation ✅ COMPLETE
### Session 2 — Data Layer ✅ COMPLETE
### Session 3 — Graph Component ✅ COMPLETE
### Session 4 — Home Screen ✅ COMPLETE
### Session 5 — Account Detail Screen ✅ COMPLETE
### Session 6 — Add / Edit Flows ✅ COMPLETE
### Session 7 — Onboarding + Settings ✅ COMPLETE
### Session 8 — CSV Import ✅ COMPLETE
### Session 9 — Polish ✅ COMPLETE
### Analytics — Mixpanel ✅ COMPLETE

---

## Verification Checklist

- [ ] Add investment + shared house (60%) + credit card; net worth = investment + (equity × 0.6) − CC
- [ ] Log entries at irregular dates; graph interpolates smoothly
- [ ] Scrub graph; header updates; crosshair clears on release
- [ ] Archive account; hidden from list; historical graph data unchanged
- [ ] Toggle currency; symbol changes, numbers unchanged
- [ ] Kill + reopen app; all data persists
- [ ] System dark/light toggle; theme follows
- [ ] Import test CSV; summary shows correct counts + skipped rows
- [ ] Download CSV template; correct columns + example data
- [ ] Add account via onboarding; hasOnboarded set; lands on home
- [ ] Mixpanel events appear in dashboard (check is_dev = true in dev build)

---

## Deferred (v2)

- Cloud sync (Supabase)
- Screenshot OCR import (vision model extracts values from old app screenshots)
- Manual account reordering
- Theme override in settings UI
