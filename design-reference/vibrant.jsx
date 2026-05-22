// vibrant.jsx — Worthi "Dusk" style: dark, saturated, big numbers, confident.
// Renders inside an IOSDevice frame. Fully clickable: onboarding → home →
// detail → add account → add entry → settings → archive.

// ─── theme tokens ────────────────────────────────────────────────────────────
const V_THEME = {
  dark: {
    bg: '#0B0B12',
    surface: '#15151D',
    surface2: '#1C1C26',
    border: 'rgba(255,255,255,0.08)',
    fg: '#FAFAF7',
    fg2: 'rgba(250,250,247,0.62)',
    fg3: 'rgba(250,250,247,0.38)',
    accent: '#FAFAF7',
    danger: '#F43F5E',
    success: '#10B981',
    sheetBg: '#15151D',
    overlay: 'rgba(0,0,0,0.55)',
  },
  light: {
    bg: '#F4F2EE',
    surface: '#FFFFFF',
    surface2: '#FBF9F5',
    border: 'rgba(0,0,0,0.07)',
    fg: '#0E0E14',
    fg2: 'rgba(14,14,20,0.62)',
    fg3: 'rgba(14,14,20,0.40)',
    accent: '#0E0E14',
    danger: '#E11D48',
    success: '#059669',
    sheetBg: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.35)',
  },
};

const V_FONT = '"Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const V_MONO = '"Geist Mono", "SF Mono", ui-monospace, Menlo, monospace';

// ─── lightweight icon set ────────────────────────────────────────────────────
const VI = {
  gear: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.7"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.7"/></svg>,
  back: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>,
  dots: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="18.5" r="1.6" fill="currentColor"/></svg>,
  pencil: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 4l4 4-11 11H5v-4L16 4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── shared chrome bits ──────────────────────────────────────────────────────
function VTopBar({ left, right, C }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      paddingTop: 64, paddingLeft: 22, paddingRight: 22, paddingBottom: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 20, pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto' }}>{left}</div>
      <div style={{ pointerEvents: 'auto', display: 'flex', gap: 6 }}>{right}</div>
    </div>
  );
}

function VIconButton({ children, onClick, C, dim }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 0, cursor: 'pointer',
      width: 36, height: 36, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dim ? 'transparent' : C.surface2,
      color: C.fg2,
    }}>{children}</button>
  );
}

function VAccountDot({ type, size = 10, ring = false }) {
  const t = ACCOUNT_TYPES[type];
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: t.vibrant,
      boxShadow: ring ? `0 0 0 3px ${t.vibrant}33` : undefined,
    }} />
  );
}

function VTypePill({ type, C, large = false }) {
  const t = ACCOUNT_TYPES[type];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: large ? '5px 11px' : '3px 9px',
      borderRadius: 999,
      background: `${t.vibrant}1F`,
      color: t.vibrant,
      fontSize: large ? 12 : 11, fontWeight: 600, letterSpacing: 0.2,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: t.vibrant }} />
      {t.label}
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────────
function VHome({ app, C, dark }) {
  const [range, setRange] = React.useState('6M');
  const [scrub, setScrub] = React.useState(null);

  const t0 = today().getTime();
  const r0 = rangeStart(range, app.activeAccounts);
  const series = sampleSeries(
    app.filter === 'all' ? app.activeAccounts : app.activeAccounts.filter(a => a.type === app.filter),
    r0, t0, 80
  );

  const headerValue = scrub ? scrub.value : (app.filter === 'all' ? app.netWorth : app.filteredNet);
  const headerSub = scrub
    ? fmtDate(new Date(scrub.ts))
    : 'Today, ' + fmtDateShort(today());

  // Delta over the visible range
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
  const deltaColor = delta >= 0 ? C.success : C.danger;

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: 50 }}>
      <VTopBar C={C}
        left={<div style={{ fontSize: 13, fontWeight: 600, color: C.fg2, letterSpacing: 0.4, textTransform: 'uppercase' }}>Worthi</div>}
        right={<>
          <VIconButton C={C} dim onClick={() => app.push({ name: 'settings' })}>{VI.gear}</VIconButton>
        </>}
      />

      {/* Net worth header */}
      <div style={{ padding: '108px 22px 8px' }}>
        <div style={{ fontSize: 12, color: C.fg3, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 }}>
          {app.filter === 'all' ? 'Net Worth' : ACCOUNT_TYPES[app.filter].label + ' Balance'}
        </div>
        <div style={{
          fontFamily: V_FONT, fontSize: 52, fontWeight: 600, letterSpacing: -1.6,
          color: C.fg, marginTop: 4, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05,
          whiteSpace: 'nowrap',
        }}>
          {fmtMoney(headerValue)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {!scrub && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 9px 3px 7px', borderRadius: 999,
              background: delta >= 0 ? 'rgba(16,185,129,0.13)' : 'rgba(244,63,94,0.13)',
              color: deltaColor, fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
            }}>
              <span>{delta >= 0 ? '▲' : '▼'}</span>
              {fmtMoney(Math.abs(delta), { compact: true })} · {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
            </div>
          )}
          <span style={{ fontSize: 12, color: C.fg3, fontWeight: 500, whiteSpace: 'nowrap' }}>{headerSub}</span>
        </div>
      </div>

      {/* Graph */}
      <div style={{ padding: '14px 8px 6px' }}>
        <LineGraph
          series={series}
          width={386} height={170}
          color={app.filter === 'all' ? '#7EB6FF' : ACCOUNT_TYPES[app.filter].vibrant}
          fillGradient
          dark={dark}
          showAxis={false}
          onScrub={setScrub}
          showZero={app.filter !== 'all' && ACCOUNT_TYPES[app.filter].sign === -1}
        />
      </div>

      {/* Range picker */}
      <div style={{ padding: '0 22px', display: 'flex', justifyContent: 'center' }}>
        <RangePicker value={range} onChange={setRange} dark={dark} style="vibrant" />
      </div>

      {/* Filter chips */}
      <div style={{
        padding: '20px 0 4px',
        display: 'flex', gap: 8, overflowX: 'auto',
        paddingLeft: 22, paddingRight: 22,
      }}>
        <VFilterChip label="All" count={app.activeAccounts.length}
          active={app.filter === 'all'} onClick={() => app.setFilter('all')} C={C} />
        {TYPE_ORDER.map(t => {
          const count = app.activeAccounts.filter(a => a.type === t).length;
          if (count === 0) return null;
          return <VFilterChip key={t} type={t} label={ACCOUNT_TYPES[t].short} count={count}
            active={app.filter === t} onClick={() => app.setFilter(t)} C={C} />;
        })}
      </div>

      {/* Account list */}
      <div style={{ padding: '14px 16px 12px' }}>
        {app.filteredAccounts.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center', color: C.fg3, fontSize: 14,
          }}>No accounts yet</div>
        ) : app.filteredAccounts.map(a => (
          <VAccountRow key={a.id} account={a} C={C} dark={dark}
            onClick={() => app.push({ name: 'detail', accountId: a.id })} />
        ))}
      </div>

      {/* FAB */}
      <button onClick={() => app.setSheet({ name: 'addAccountType' })}
        style={{
          position: 'absolute', right: 22, bottom: 46, zIndex: 30,
          width: 56, height: 56, borderRadius: 18,
          background: C.fg, color: C.bg, border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: dark
            ? '0 12px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 8px 28px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
        }}>{VI.plus}</button>
    </div>
  );
}

function VFilterChip({ type, label, count, active, onClick, C }) {
  const t = type ? ACCOUNT_TYPES[type] : null;
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 0, cursor: 'pointer',
      padding: '7px 13px', borderRadius: 999,
      background: active ? (t ? `${t.vibrant}26` : C.fg) : C.surface,
      color: active ? (t ? t.vibrant : C.bg) : C.fg2,
      fontSize: 13, fontWeight: 600, letterSpacing: 0.1,
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      fontFamily: 'inherit',
    }}>
      {t && <span style={{ width: 6, height: 6, borderRadius: 99, background: t.vibrant }} />}
      <span>{label}</span>
      <span style={{ opacity: 0.55, fontWeight: 500 }}>{count}</span>
    </button>
  );
}

function VAccountRow({ account, C, dark, onClick }) {
  const t = ACCOUNT_TYPES[account.type];
  const v = accountValue(account);
  // Compute a return % for investments/house
  let returnPct = null;
  if (account.type === 'investment') {
    const last = account.history[account.history.length - 1];
    if (last && last.deposited > 0) returnPct = ((last.value - last.deposited) / last.deposited) * 100;
  } else if (account.type === 'house') {
    const last = account.history[account.history.length - 1];
    if (last) {
      const equity = last.value - Math.abs(last.mortgage);
      if (account.originalDeposit > 0) returnPct = ((equity - account.originalDeposit) / account.originalDeposit) * 100;
    }
  }

  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 0, cursor: 'pointer', width: '100%',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 14px', borderRadius: 16,
      background: C.surface, marginBottom: 8, textAlign: 'left',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `linear-gradient(135deg, ${t.vibrant}33, ${t.vibrant}66)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: t.vibrant, fontSize: 18, fontWeight: 600,
      }}>{t.glyph}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: C.fg,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{account.name}</div>
        <div style={{ fontSize: 12, color: C.fg3, marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
          {t.label}
          {returnPct !== null && (
            <>
              <span>·</span>
              <span style={{ color: returnPct >= 0 ? C.success : C.danger, fontWeight: 600 }}>
                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <div style={{
        fontFamily: V_MONO, fontSize: 16, fontWeight: 600,
        color: v < 0 ? C.danger : C.fg, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>{fmtMoney(v)}</div>
    </button>
  );
}

// ─── ACCOUNT DETAIL ──────────────────────────────────────────────────────────
function VDetail({ app, C, dark, accountId }) {
  const account = app.accounts.find(a => a.id === accountId);
  const [range, setRange] = React.useState('6M');
  const [scrub, setScrub] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  if (!account) return null;
  const t = ACCOUNT_TYPES[account.type];
  const isHouse = account.type === 'house';
  const isInv = account.type === 'investment';
  const last = account.history[account.history.length - 1];

  const t0 = today().getTime();
  const r0 = rangeStart(range, [account]);
  const primary = sampleAccountSeries(account, r0, t0, 80,
    isHouse ? 'property' : isInv ? 'value' : 'value'
  );
  const secondary = isHouse
    ? sampleAccountSeries(account, r0, t0, 80, 'equity')
    : isInv
      ? sampleAccountSeries(account, r0, t0, 80, 'deposited')
      : null;

  const v = accountValue(account);
  const headerValue = scrub
    ? (isHouse ? scrub.value - Math.abs(interpField(account.history, scrub.ts, 'mortgage'))
              : scrub.value)
    : v;
  const headerSub = scrub ? fmtDate(new Date(scrub.ts)) : t.label;

  // Summary stats
  let summary = [];
  if (isInv) {
    const deposited = last?.deposited ?? 0;
    const ret = v - deposited;
    summary = [
      { l: 'Deposited', v: fmtMoney(deposited) },
      { l: 'Current Value', v: fmtMoney(v) },
      { l: 'Return', v: fmtMoney(ret, { signed: true }), color: ret >= 0 ? C.success : C.danger },
      { l: 'Return %', v: (ret / deposited * 100).toFixed(1) + '%', color: ret >= 0 ? C.success : C.danger },
    ];
  } else if (isHouse) {
    const equity = last.value - Math.abs(last.mortgage);
    const equityGain = equity - account.originalDeposit;
    summary = [
      { l: 'Purchase Price', v: fmtMoney(account.purchasePrice) },
      { l: 'Original Deposit', v: fmtMoney(account.originalDeposit) },
      { l: 'Current Value', v: fmtMoney(last.value) },
      { l: 'Mortgage', v: fmtMoney(-Math.abs(last.mortgage)) },
      { l: 'Equity', v: fmtMoney(equity), color: t.vibrant },
      { l: 'Equity Gain', v: fmtMoney(equityGain, { signed: true }), color: equityGain >= 0 ? C.success : C.danger },
    ];
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 50 }}>
      <VTopBar C={C}
        left={<VIconButton C={C} dim onClick={() => app.pop()}>{VI.back}</VIconButton>}
        right={<VIconButton C={C} dim onClick={() => setMenuOpen(o => !o)}>{VI.dots}</VIconButton>}
      />

      {/* Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 96, right: 22, zIndex: 30,
          background: C.surface, borderRadius: 12,
          boxShadow: '0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px ' + C.border,
          minWidth: 170, padding: 4,
        }}>
          <button onClick={() => { setMenuOpen(false); app.archiveAccount(account.id); app.pop(); }}
            style={{ ...vMenuItem(C) }}>Archive Account</button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '108px 22px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VTypePill type={account.type} C={C} large />
        </div>
        <div style={{ fontSize: 18, color: C.fg, marginTop: 14, fontWeight: 500 }}>{account.name}</div>
        <div style={{
          fontFamily: V_FONT, fontSize: 44, fontWeight: 600, letterSpacing: -1.4,
          color: headerValue < 0 ? C.danger : C.fg, marginTop: 2,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1.05,
          whiteSpace: 'nowrap',
        }}>{fmtMoney(headerValue)}</div>
        <div style={{ fontSize: 12, color: C.fg3, marginTop: 6 }}>{headerSub}</div>
      </div>

      {/* Graph (single or dual line) */}
      <div style={{ padding: '10px 8px 6px' }}>
        <LineGraph
          series={primary}
          series2={secondary}
          series2Style={isInv ? 'dashed' : 'dashed'}
          series2Color={isInv ? `${t.vibrant}AA` : `${t.vibrant}99`}
          width={386} height={150}
          color={t.vibrant}
          fillGradient
          dark={dark}
          showAxis={false}
          showZero={t.sign === -1}
          onScrub={setScrub}
        />
        {(isInv || isHouse) && (
          <div style={{ display: 'flex', gap: 16, padding: '4px 14px 0', fontSize: 11, color: C.fg3 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: t.vibrant }} />
              {isHouse ? 'Property value' : 'Current value'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 0, borderTop: `2px dashed ${t.vibrant}` }} />
              {isHouse ? 'Equity' : 'Deposited'}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '0 22px 6px', display: 'flex', justifyContent: 'center' }}>
        <RangePicker value={range} onChange={setRange} dark={dark} style="vibrant" />
      </div>

      {/* Summary stats */}
      {summary.length > 0 && (
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            background: C.surface, padding: 14, borderRadius: 16,
          }}>
            {summary.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{s.l}</div>
                <div style={{ fontFamily: V_MONO, fontSize: 15, color: s.color || C.fg, marginTop: 2, fontWeight: 600 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History header */}
      <div style={{
        padding: '20px 22px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, color: C.fg3, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>History</div>
        <button onClick={() => app.setSheet({ name: 'addEntry', accountId: account.id })}
          style={{
            appearance: 'none', border: `1px solid ${C.border}`, background: 'transparent',
            cursor: 'pointer', padding: '6px 12px', borderRadius: 999,
            color: C.fg, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}><span style={{fontSize:14, lineHeight:1}}>+</span> Add Entry</button>
      </div>

      {/* History list */}
      <div style={{ padding: '0 16px 12px' }}>
        {account.history.slice().reverse().map((e, idx) => {
          const realIdx = account.history.length - 1 - idx;
          return <VHistoryRow key={realIdx} entry={e} idx={realIdx} account={account} C={C} app={app} dark={dark} />;
        })}
      </div>
    </div>
  );
}

function vMenuItem(C) {
  return {
    appearance: 'none', border: 0, background: 'transparent',
    width: '100%', textAlign: 'left', padding: '9px 12px',
    borderRadius: 8, cursor: 'pointer', color: C.fg, fontSize: 13,
    fontFamily: 'inherit', fontWeight: 500,
  };
}

function VHistoryRow({ entry, idx, account, C, app, dark }) {
  const isHouse = account.type === 'house';
  const isInv = account.type === 'investment';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 12px', borderRadius: 14,
      background: C.surface, marginBottom: 6,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.fg, fontWeight: 500 }}>{fmtDate(entry.date)}</div>
        <div style={{ fontSize: 11, color: C.fg3, marginTop: 2 }}>
          {isHouse
            ? `Value ${fmtMoney(entry.value, { compact: true })} · Mortgage ${fmtMoney(-Math.abs(entry.mortgage), { compact: true })}`
            : isInv
              ? `Deposited ${fmtMoney(entry.deposited || 0, { compact: true })}`
              : `Balance`}
        </div>
      </div>
      <div style={{
        fontFamily: V_MONO, fontSize: 14, color: C.fg, fontWeight: 600, marginRight: 2,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {fmtMoney(isHouse ? entry.value - Math.abs(entry.mortgage) : entry.value)}
      </div>
      <button onClick={() => app.setSheet({ name: 'addEntry', accountId: account.id, editIndex: idx })}
        style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', color: C.fg3, padding: 4 }}>
        {VI.pencil}
      </button>
      <button onClick={() => {
        if (account.history.length > 1) app.deleteEntry(account.id, idx);
      }}
        style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', color: C.fg3, padding: 4 }}>
        {VI.trash}
      </button>
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function VOnboarding({ app, C, dark }) {
  const step = app.top.step ?? 0;
  const slides = [
    { title: 'Know your number.', sub: 'See your true net worth — not just your spending.' },
    { title: 'Every account, one place.', sub: 'Track investments, property, savings and debt together.' },
    { title: "Let's get started.", sub: 'Add your first account to begin.' },
  ];
  const slide = slides[step];

  return (
    <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '120px 32px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${ACCOUNT_TYPES.investment.vibrant}, ${ACCOUNT_TYPES.house.vibrant})`,
          marginBottom: 38,
        }} />
        <div style={{
          fontFamily: V_FONT, fontSize: 36, fontWeight: 600, letterSpacing: -1.2,
          color: C.fg, lineHeight: 1.08,
        }}>{slide.title}</div>
        <div style={{ fontSize: 17, color: C.fg2, marginTop: 14, lineHeight: 1.45, maxWidth: 300 }}>{slide.sub}</div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 38 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 99,
              background: i === step ? C.fg : C.fg3, transition: 'width 0.2s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '0 22px 50px' }}>
        <button onClick={() => {
          if (step < slides.length - 1) app.replaceTop({ name: 'onboarding', step: step + 1 });
          else { app.replaceTop({ name: 'home' }); app.setSheet({ name: 'addAccountType' }); }
        }} style={{
          width: '100%', height: 54, borderRadius: 16,
          background: C.fg, color: C.bg, border: 0, cursor: 'pointer',
          fontSize: 16, fontWeight: 600, fontFamily: 'inherit', letterSpacing: 0.2,
        }}>{step < slides.length - 1 ? 'Continue' : 'Add first account'}</button>
        {step < slides.length - 1 && (
          <button onClick={() => app.replaceTop({ name: 'home' })} style={{
            width: '100%', marginTop: 8, height: 40, background: 'transparent',
            border: 0, cursor: 'pointer', color: C.fg3, fontSize: 14, fontWeight: 500,
            fontFamily: 'inherit',
          }}>Skip</button>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function VSettings({ app, C, dark }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 50 }}>
      <VTopBar C={C}
        left={<VIconButton C={C} dim onClick={() => app.pop()}>{VI.back}</VIconButton>}
        right={null} />
      <div style={{ padding: '108px 22px 14px' }}>
        <div style={{
          fontFamily: V_FONT, fontSize: 36, fontWeight: 600, letterSpacing: -1, color: C.fg,
        }}>Settings</div>
      </div>

      <div style={{ padding: '8px 16px' }}>
        <div style={{ fontSize: 11, color: C.fg3, padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Currency</div>
        <div style={{ background: C.surface, borderRadius: 16, padding: 4 }}>
          {[['£', 'GBP', 'British Pound'], ['$', 'USD', 'US Dollar'], ['€', 'EUR', 'Euro']].map(([sym, code, name], i) => (
            <div key={code} style={{
              padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < 2 ? `0.5px solid ${C.border}` : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, background: C.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: V_MONO, fontSize: 17, color: C.fg, fontWeight: 600,
              }}>{sym}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: C.fg, fontWeight: 500 }}>{name}</div>
                <div style={{ fontSize: 12, color: C.fg3 }}>{code}</div>
              </div>
              {code === 'GBP' && <span style={{ color: C.success }}>{VI.check}</span>}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.fg3, padding: '22px 12px 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Archived Accounts</div>
        <div style={{ background: C.surface, borderRadius: 16, padding: 4 }}>
          {app.accounts.filter(a => a.archived).length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: C.fg3 }}>
              No archived accounts
            </div>
          ) : app.accounts.filter(a => a.archived).map((a, i, arr) => {
            const t = ACCOUNT_TYPES[a.type];
            return (
              <div key={a.id} style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < arr.length - 1 ? `0.5px solid ${C.border}` : 'none',
              }}>
                <VAccountDot type={a.type} size={10} />
                <div style={{ flex: 1, fontSize: 14, color: C.fg }}>{a.name}</div>
                <button onClick={() => app.unarchiveAccount(a.id)}
                  style={{
                    appearance: 'none', border: `1px solid ${C.border}`, background: 'transparent',
                    cursor: 'pointer', padding: '5px 10px', borderRadius: 99,
                    color: C.fg2, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  }}>Unarchive</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VHome, VDetail, VOnboarding, VSettings, V_THEME, V_FONT, V_MONO, VI, vMenuItem });
