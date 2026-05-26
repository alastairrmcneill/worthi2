# Worthi — Project Reference

Personal net worth tracking app for iOS + Android (React Native / Expo). Focus: track net worth over time, not budgeting or expenses.

---

## Status

**Phase:** Feature-complete. Sessions 1–9, Analytics, Session 10 (Graph & Icons), Session 11 (Date Picker & Settings) done. Session 12 (Review Prompt) store wired, UI card pending.

**Design reference exists:** `design-reference/` contains:

- `vibrant.jsx` — full UI prototype (home, detail, onboarding, settings screens)
- `vibrant-sheets.jsx` — bottom sheet flows (add account, add entry)
- `graph.jsx` — custom Catmull-Rom SVG graph with scrub interaction
- `app.jsx` — root canvas with theme tweaks

---

## Tech Stack

| Concern       | Decision                                                                   |
| ------------- | -------------------------------------------------------------------------- |
| Framework     | Expo managed (SDK 56)                                                      |
| Language      | TypeScript strict                                                          |
| Navigation    | Expo Router                                                                |
| State         | Zustand                                                                    |
| Graph         | React Native Skia (`@shopify/react-native-skia`)                           |
| Bottom sheets | `@gorhom/bottom-sheet` v5                                                  |
| Storage       | `expo-sqlite` (local-first; cloud sync deferred)                           |
| Font          | Geist (bundled via `expo-font`)                                            |
| Theme         | Dark (Dusk) + Light (Linen), follows system, user can override in Settings |
| Analytics     | `mixpanel-react-native` (anonymous, no PII)                                |
| Tests         | None for now                                                               |

### All dependencies

```
expo-sqlite expo-font expo-secure-store expo-haptics expo-router
expo-document-picker expo-sharing expo-file-system
expo-store-review @react-native-community/datetimepicker
@shopify/react-native-skia @gorhom/bottom-sheet
react-native-gesture-handler react-native-reanimated
react-native-safe-area-context react-native-screens
zustand mixpanel-react-native
```

> `mixpanel-react-native` has native modules — requires EAS Build or `npx expo run:ios`, does not work in Expo Go.

---

## Account Types

| Type            | Key           | Color            | Behaviour                                                            |
| --------------- | ------------- | ---------------- | -------------------------------------------------------------------- |
| Current Account | `current`     | `#3B82F6` blue   | User enters current balance                                          |
| Credit Card     | `credit_card` | `#F43F5E` red    | User enters amount owed → **stored negative**                        |
| Investment      | `investment`  | `#10B981` green  | Deposited (cumulative running total) + current value; shows % return |
| Loan            | `loan`        | `#F97316` orange | User enters amount owed → **stored negative**                        |
| Pension         | `pension`     | `#8B5CF6` purple | Current value only; no return %                                      |
| House           | `house`       | `#14B8A6` teal   | Property value + mortgage balance; can be shared (see below)         |

Colors used consistently: type chips, account dots, graph lines, filter chips.

Account type cards and onboarding chips use **outlined Ionicons** on a coloured background (not emoji). Glyph names stored in `accountTypes.ts` (`glyph` field): `wallet-outline`, `card-outline`, `trending-up-outline`, `document-text-outline`, `shield-checkmark-outline`, `home-outline`.

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

- Archived accounts: hidden from home account list; still show in filter chips (their type chip can still be selected)
- Still contribute to net worth graph and net worth number (last known value carried forward flat indefinitely)
- `buildHomeSeries`, `currentNetWorth`, `filteredNetWorth` all receive ALL accounts (including archived); filtering by `isArchived` is NOT done inside these functions
- `activeAccounts` (non-archived) used only for account list display and `isEmpty` check
- Unarchive from Settings > Archived Accounts

### Graph interpolation

- **Step-function carry-forward**: last known entry on or before the date; holds flat until next entry
- Before first entry: value = 0
- After last entry: carry last value forward indefinitely (flat)
- Archived accounts: same rule (carry forward indefinitely)
- Sample points: daily for ranges ≤ 31 days; 1st of each month + today for longer ranges

### Home screen

- Big number at top = total net worth (or filtered total when type chips active)
- All 6 filter chips always visible; default "All"; **multi-select** — tap multiple types to combine; tap "All" to reset
- Filter state: `Set<AccountType>` (empty = All); header label = "Net Worth" / single type label / "Filtered"
- Graph color = type color when exactly one type selected, else `HOME_GRAPH_COLOR`
- Accounts sorted by absolute value descending (non-archived only)

### Currency

- User selects from settings (single row → BottomSheetModal); change is relabel only (no conversion)
- Auto-detected from device locale on first launch
- Display format in settings row: `£ GBP`

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
      settings.tsx            Settings screen (Appearance / Currency / Data / Support / About + Archived)
      import-result.tsx       CSV import summary screen
      privacy.tsx             In-app privacy policy screen

  components/
    graph/
      NetWorthGraph.tsx       Skia graph: Fritsch-Carlson monotonic spline, gradient fill, scrub, optional dashed 2nd line
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
      DateSelector.tsx        Native date picker (@react-native-community/datetimepicker); no future dates; spinner iOS, modal Android
      IconButton.tsx          Ionicons wrapper with surface background

  stores/
    accountStore.ts           Zustand: accounts + entries CRUD, wired to SQLite
    settingsStore.ts          Zustand: currency, themeOverride, hasOnboarded, hasSeenReviewPrompt (persisted AsyncStorage)

  db/
    client.ts                 expo-sqlite setup + migrations runner
    queries.ts                Typed CRUD helpers (snake_case ↔ camelCase mappers)

  lib/
    interpolate.ts            Step-function interpolation; buildAccountSeries, buildInvestmentSeries, buildHouseSeries (no numPoints; monthly/daily sampling)
    networth.ts               currentNetWorth, filteredNetWorth, buildHomeSeries, investmentStats, houseStats
    formatting.ts             Intl.NumberFormat helpers: formatCurrency, formatPercent, formatDate, ISO date parse
    csvImport.ts              DocumentPicker → parse/validate CSV → write to store → navigate to import-result
    csvTemplate.ts            Generate + share example CSV (expo-file-system/legacy + expo-sharing)
    analytics.ts              Mixpanel wrapper: initAnalytics(), track(); is_dev super property

  hooks/
    use-theme.ts              useTheme() + useIsDark() hooks

  constants/
    accountTypes.ts           ACCOUNT_TYPES config (color, label, glyph as Ionicons name, sign, description)
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

| Event                     | Properties                                         | Where                            |
| ------------------------- | -------------------------------------------------- | -------------------------------- |
| `account_created`         | `account_type`                                     | AddAccountSheet on save          |
| `entry_added`             | `account_type`                                     | AddEntrySheet on save            |
| `entry_edited`            | `account_type`                                     | AddEntrySheet on update          |
| `entry_deleted`           | `account_type`                                     | account/[id].tsx delete confirm  |
| `account_archived`        | `account_type`                                     | account/[id].tsx 3-dot menu      |
| `account_unarchived`      | `account_type`                                     | account/[id].tsx + settings      |
| `account_deleted`         | `account_type`                                     | account/[id].tsx delete confirm  |
| `home_filter_changed`     | `filter`                                           | index.tsx filter chips           |
| `home_range_changed`      | `range`                                            | index.tsx range picker           |
| `detail_range_changed`    | `range`, `account_type`                            | account/[id].tsx range picker    |
| `onboarding_completed`    | —                                                  | onboarding after account saved   |
| `onboarding_skipped`      | —                                                  | onboarding skip / "Skip for now" |
| `currency_changed`        | `currency_code`                                    | settings currency sheet          |
| `csv_imported`            | `accounts_count`, `entries_count`, `skipped_count` | csvImport.ts                     |
| `csv_template_downloaded` | —                                                  | settings download button         |
| `theme_changed`           | `theme`                                            | settings appearance section      |
| `rate_app_tapped`         | —                                                  | settings Rate App row            |
| `review_prompted`         | —                                                  | home review card "Yes"           |
| `review_dismissed`        | —                                                  | home review card "Not yet"       |

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
- Review prompt card (pending): shows when `entries.length >= 1 && !hasSeenReviewPrompt`

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

- **Appearance**: System / Light / Dark radio list (checkmark on active); calls `setThemeOverride`
- **Currency**: single tappable row showing `£ GBP` → opens `BottomSheetModal` with currency list
- **Data**: Import from CSV + Download template
- **Support**: Contact Us (mailto), Rate App (`expo-store-review`), Privacy Policy (→ privacy screen)
- **Archived accounts**: list with Restore buttons (only shown when accounts exist)
- **About**: Version number from `Constants.expoConfig?.version`

### Privacy

- Plain-text privacy policy screen
- Covers: local-only storage, anonymous analytics (Mixpanel), no advertising IDs, contact email

### Onboarding (3 slides, FlatList)

1. "Know your number" — hero net worth number
2. "Every account, one place" — type chips grid (Ionicons icons)
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
- **Fritsch-Carlson monotonic cubic Hermite spline** (no overshoot; replaced Catmull-Rom)
- Area fill with gradient
- Optional second line (`series2`, dashed or solid)
- Touch scrub via `PanResponder` → nearest point → `onScrub({ts, value, value2, x, y})`
- Release → `onScrub(null)` clears crosshair
- Y-axis auto-fits actual data range (8% padding each side); no `showZero` prop
- Props: `series`, `series2`, `series2Style`, `series2Color`, `color`, `fillGradient`, `onScrub`, `showAxis`, `showCrosshair`, `yDomainFrom`, `currencySymbol`

### Axis labels (when `showAxis=true`)

- **Y-axis**: 3–4 nice ticks (`[1,2,5,10]` step pattern) from data range; abbreviated format (`£50k`, `£1.5M`, `-£10k`); rendered as absolute `Text` (Geist_400Regular, 10pt) left of the plot area; padLeft expands to 52px to make room
- **X-axis**: Jan 1 tick marks per year within series range; year label (`2024`, `2025`) as absolute `Text` below axis; padBottom expands to 28px; sub-year ranges show no labels (no Jan 1 boundary exists)
- **Gridlines**: subtle horizontal lines at each y-tick position drawn in Skia (behind fills)
- Callers must pass `currencySymbol={currency.symbol}` from settings store

---

## Bottom Sheets

`@gorhom/bottom-sheet` v5. `BottomSheetModalProvider` wraps the app in `_layout.tsx`.

Both sheets use `forwardRef` + `useImperativeHandle` to expose `present`/`dismiss`:

```ts
// AddAccountSheet
addAccountRef.current?.present();

// AddEntrySheet
addEntryRef.current?.presentForAccount(accountId);
addEntryRef.current?.presentForEdit(accountId, entry);
```

Use `BottomSheetTextInput` (not plain `TextInput`) inside sheets for correct keyboard handling.

---

## Add Account Sheet (3 steps)

1. **Type picker**: 2-col grid, coloured cards with Ionicons icon + description
2. **Account details**:
   - Name field
   - House only: purchase price (optional), original deposit (optional), "Shared asset" toggle → ownership % field (1–99, default 50)
3. **First entry**:
   - `DateSelector` (today default, tappable row → native OS picker; no future dates)
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

### Session 10 — Graph & Icons ✅ COMPLETE

- Account type icons: emoji glyphs → Ionicons names in `accountTypes.ts`
- `AddAccountSheet` type grid and onboarding slide 2 render `<Ionicons>` instead of `<Text>`
- Ownership badge in `AccountCard` sized to match `TypePill` (same height/padding/font)
- Graph interpolation: step-function carry-forward (last known value held flat until next entry)
- Sample points: daily for ≤ 31-day ranges; monthly + today for longer ranges (no `numPoints` param)
- Graph curve: Fritsch-Carlson monotonic cubic Hermite spline (no overshoot; replaced Catmull-Rom)
- Removed `showZero` prop from `NetWorthGraph`; y-axis auto-fits actual data range

### Session 11 — Date Picker & Settings Overhaul ✅ COMPLETE

- `DateSelector` rewritten: tappable row → native `DateTimePicker` (spinner iOS, modal Android); no future dates
- Settings: **Appearance** section — System / Light / Dark radio rows; calls `setThemeOverride`; tracks `theme_changed`
- Settings: **Currency** — single row `£ GBP` → `BottomSheetModal` with currency list
- Settings: **Support** section — Contact Us (mailto), Rate App (`expo-store-review`), Privacy Policy
- Settings: **About** section — version from `Constants.expoConfig?.version`
- New screen: `src/app/(app)/privacy.tsx` — in-app privacy policy

### Session 12 — In-App Review Prompt 🔄 PARTIAL

- `settingsStore`: added `hasSeenReviewPrompt: boolean` + `setHasSeenReviewPrompt` ✅
- `index.tsx`: imports + store hooks wired (`StoreReview`, `hasSeenReviewPrompt`, `setHasSeenReviewPrompt`) ✅
- **Pending**: review card UI in `index.tsx` — "Enjoying Worthi?" card when `entries.length >= 1 && !hasSeenReviewPrompt`; "Yes, love it!" → `StoreReview.requestReview()` + mark seen + track `review_prompted`; "Not yet" → mark seen + track `review_dismissed`

### Post-Session Fixes ✅

- **Privacy policy**: removed "Last updated: May 2025" date from `privacy.tsx`
- **Currency selector**: `currencySymbol` style `width` increased `24 → 36` in `settings.tsx` to prevent multi-char symbols (A$, CA$) stacking vertically
- **Filter chips**: single-select → **multi-select** (`Set<AccountType>`); "All" clears set; tapping active type deselects it; `networth.ts` functions updated to accept `AccountType[]`
- **Archive graph fix**: archived accounts were excluded from graph + net worth because `activeAccounts` was passed to `buildHomeSeries`/`currentNetWorth`; fixed to pass all `accounts` — archived history now correctly appears in graph with step-function carry-forward

---

## Verification Checklist

- [ ] Add investment + shared house (60%) + credit card; net worth = investment + (equity × 0.6) − CC
- [ ] Log entries at irregular dates; graph holds flat between entries (no interpolated values)
- [ ] Scrub graph; header updates; crosshair clears on release
- [ ] Graph y-axis fits actual data range; no gap below minimum value
- [ ] Archive account; hidden from list; historical graph data unchanged
- [ ] Toggle currency; symbol changes, numbers unchanged
- [ ] Kill + reopen app; all data persists
- [ ] Settings Appearance rows toggle theme live (System / Light / Dark)
- [ ] Settings Currency row shows `£ GBP`; tap opens sheet; selection updates immediately
- [ ] Settings Contact opens mail app; Privacy navigates to privacy screen; Rate App fires review dialog
- [ ] System dark/light toggle; theme follows (when Appearance = System)
- [ ] Import test CSV; summary shows correct counts + skipped rows
- [ ] Download CSV template; correct columns + example data
- [ ] Add account via onboarding; hasOnboarded set; lands on home
- [ ] Date picker in add/edit flows: tapping date opens native picker; future dates disabled
- [ ] Mixpanel events appear in dashboard (check is_dev = true in dev build)

---

## Deferred (v2)

- Cloud sync (Supabase)
- Screenshot OCR import (vision model extracts values from old app screenshots)
- Manual account reordering
