// vibrant-sheets.jsx — Bottom sheets for Vibrant style: Add Account, Add Entry.

function VSheet({ children, C, dark, onClose, height = 'auto' }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: C.overlay, zIndex: 40,
        backdropFilter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41,
        background: C.sheetBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '88%', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.4)',
        animation: 'vsheetIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 99, background: C.fg3,
          margin: '8px auto 4px', opacity: 0.4,
        }} />
        {children}
      </div>
      <style>{`@keyframes vsheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </>
  );
}

// Step machine for Add Account
function VAddAccountSheet({ app, C, dark }) {
  const sheet = app.sheet;
  const [step, setStep] = React.useState(sheet.step || 0);
  const [draft, setDraft] = React.useState(sheet.draft || {
    type: null, name: '', purchasePrice: '', originalDeposit: '',
    value: '', deposited: '', mortgage: '',
  });
  const t = draft.type ? ACCOUNT_TYPES[draft.type] : null;

  function commit() {
    const today_ = today();
    const entry = { date: today_, value: parseFloat(draft.value) * (t.sign === -1 ? -1 : 1) || 0 };
    if (draft.type === 'investment') entry.deposited = parseFloat(draft.deposited) || 0;
    if (draft.type === 'house') {
      entry.value = parseFloat(draft.value) || 0; // property value
      entry.mortgage = -Math.abs(parseFloat(draft.mortgage) || 0);
    }
    const account = {
      id: newId(), name: draft.name || (t.label + ' Account'), type: draft.type, archived: false,
      history: [entry],
    };
    if (draft.type === 'house') {
      account.purchasePrice = parseFloat(draft.purchasePrice) || 0;
      account.originalDeposit = parseFloat(draft.originalDeposit) || 0;
    }
    app.addAccount(account);
    app.setSheet(null);
  }

  return (
    <VSheet C={C} dark={dark} onClose={() => app.setSheet(null)}>
      <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : app.setSheet(null)}
          style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', color: C.fg2, fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }}>
          {step > 0 ? 'Back' : 'Cancel'}
        </button>
        <div style={{ fontSize: 14, color: C.fg, fontWeight: 600 }}>
          {step === 0 ? 'New Account' : step === 1 ? 'Details' : 'First Entry'}
        </div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ overflowY: 'auto', padding: '0 22px 30px', flex: 1 }}>
        {step === 0 && (
          <>
            <div style={{
              fontFamily: V_FONT, fontSize: 24, fontWeight: 600, color: C.fg, letterSpacing: -0.5,
              marginBottom: 4,
            }}>Pick a type</div>
            <div style={{ fontSize: 13, color: C.fg3, marginBottom: 20 }}>
              Each type tracks its values differently.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TYPE_ORDER.map(key => {
                const tt = ACCOUNT_TYPES[key];
                const active = draft.type === key;
                return (
                  <button key={key} onClick={() => { setDraft({ ...draft, type: key }); setTimeout(() => setStep(1), 120); }}
                    style={{
                      appearance: 'none', cursor: 'pointer', textAlign: 'left',
                      padding: 14, borderRadius: 14,
                      background: active ? `${tt.vibrant}26` : C.surface2,
                      border: active ? `1px solid ${tt.vibrant}` : `1px solid transparent`,
                      color: C.fg, fontFamily: 'inherit',
                    }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: `linear-gradient(135deg, ${tt.vibrant}40, ${tt.vibrant})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12,
                    }}>{tt.glyph}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.fg }}>{tt.label}</div>
                    <div style={{ fontSize: 11, color: C.fg3, marginTop: 2, lineHeight: 1.35 }}>
                      {{
                        current: 'Balance you can spend.',
                        credit: 'Owed on credit cards.',
                        investment: 'Tracks deposits + return.',
                        loan: 'Owed on a loan.',
                        pension: 'Retirement value.',
                        house: 'Property + mortgage.',
                      }[key]}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <VTypePill type={draft.type} C={C} large />
            <div style={{
              fontFamily: V_FONT, fontSize: 24, fontWeight: 600, color: C.fg, letterSpacing: -0.5,
              marginTop: 12, marginBottom: 16,
            }}>Account details</div>
            <VField C={C} label="Account name" value={draft.name}
              placeholder={t.label + ' Account'} onChange={v => setDraft({ ...draft, name: v })} />
            {draft.type === 'house' && (
              <>
                <VField C={C} label="Purchase price" value={draft.purchasePrice}
                  prefix="£" numeric onChange={v => setDraft({ ...draft, purchasePrice: v })} />
                <VField C={C} label="Original deposit" value={draft.originalDeposit}
                  prefix="£" numeric onChange={v => setDraft({ ...draft, originalDeposit: v })} />
              </>
            )}
            <button onClick={() => setStep(2)} disabled={!draft.name}
              style={primaryBtn(C, !draft.name)}>Continue</button>
          </>
        )}

        {step === 2 && (
          <>
            <VTypePill type={draft.type} C={C} large />
            <div style={{
              fontFamily: V_FONT, fontSize: 24, fontWeight: 600, color: C.fg, letterSpacing: -0.5,
              marginTop: 12, marginBottom: 4,
            }}>First entry</div>
            <div style={{ fontSize: 13, color: C.fg3, marginBottom: 16 }}>
              {fmtDate(today())} · You can change this later.
            </div>
            {draft.type === 'house' ? (
              <>
                <VField C={C} label="Current property value" value={draft.value} prefix="£" numeric
                  onChange={v => setDraft({ ...draft, value: v })} />
                <VField C={C} label="Current mortgage balance" value={draft.mortgage} prefix="£" numeric
                  onChange={v => setDraft({ ...draft, mortgage: v })} />
              </>
            ) : draft.type === 'investment' ? (
              <>
                <VField C={C} label="Deposited" value={draft.deposited} prefix="£" numeric
                  onChange={v => setDraft({ ...draft, deposited: v })} />
                <VField C={C} label="Current value" value={draft.value} prefix="£" numeric
                  onChange={v => setDraft({ ...draft, value: v })} />
              </>
            ) : (
              <VField C={C} label={t.sign === -1 ? 'Amount owed' : 'Current balance'}
                value={draft.value} prefix="£" numeric
                onChange={v => setDraft({ ...draft, value: v })} />
            )}
            <button onClick={commit} disabled={!draft.value}
              style={primaryBtn(C, !draft.value)}>Create account</button>
          </>
        )}
      </div>
    </VSheet>
  );
}

function primaryBtn(C, disabled) {
  return {
    width: '100%', height: 52, borderRadius: 14, marginTop: 18,
    background: disabled ? C.surface2 : C.fg, color: disabled ? C.fg3 : C.bg,
    border: 0, cursor: disabled ? 'default' : 'pointer',
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit', letterSpacing: 0.2,
  };
}

function VField({ C, label, value, onChange, placeholder, prefix, numeric, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.fg3, fontWeight: 600, letterSpacing: 0.3, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', background: C.surface2,
        borderRadius: 12, padding: '0 14px', height: 50,
      }}>
        {prefix && <span style={{ color: C.fg3, fontSize: 17, fontFamily: V_MONO, marginRight: 8 }}>{prefix}</span>}
        <input type={numeric ? 'number' : type} inputMode={numeric ? 'decimal' : undefined}
          value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 'none',
            color: C.fg, fontFamily: numeric ? V_MONO : 'inherit',
            fontSize: 17, fontWeight: 500,
          }} />
      </div>
    </div>
  );
}

// Add Entry sheet
function VAddEntrySheet({ app, C, dark }) {
  const sheet = app.sheet;
  const account = app.accounts.find(a => a.id === sheet.accountId);
  const isEdit = sheet.editIndex !== undefined;
  const existing = isEdit ? account.history[sheet.editIndex] : null;
  const [draft, setDraft] = React.useState(() => {
    const isHouse = account.type === 'house';
    const isInv = account.type === 'investment';
    if (existing) {
      return {
        date: existing.date.toISOString().slice(0, 10),
        value: String(isHouse ? existing.value : Math.abs(existing.value)),
        mortgage: isHouse ? String(Math.abs(existing.mortgage)) : '',
        deposited: isInv ? String(existing.deposited || 0) : '',
      };
    }
    return { date: today().toISOString().slice(0, 10), value: '', mortgage: '', deposited: '' };
  });
  const t = ACCOUNT_TYPES[account.type];

  function save() {
    const date = new Date(draft.date);
    const v = parseFloat(draft.value) || 0;
    let entry;
    if (account.type === 'house') {
      entry = { date, value: v, mortgage: -Math.abs(parseFloat(draft.mortgage) || 0) };
    } else if (account.type === 'investment') {
      entry = { date, value: v, deposited: parseFloat(draft.deposited) || 0 };
    } else {
      entry = { date, value: t.sign === -1 ? -Math.abs(v) : v };
    }
    if (isEdit) {
      app.updateAccount(account.id, a => ({
        ...a, history: a.history.map((h, i) => i === sheet.editIndex ? entry : h).sort((x, y) => x.date - y.date),
      }));
    } else {
      app.addEntry(account.id, entry);
    }
    app.setSheet(null);
  }

  return (
    <VSheet C={C} dark={dark} onClose={() => app.setSheet(null)}>
      <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => app.setSheet(null)}
          style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', color: C.fg2, fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }}>Cancel</button>
        <div style={{ fontSize: 14, color: C.fg, fontWeight: 600 }}>{isEdit ? 'Edit entry' : 'New entry'}</div>
        <button onClick={save} disabled={!draft.value}
          style={{ appearance: 'none', border: 0, background: 'transparent', cursor: draft.value ? 'pointer' : 'default', color: draft.value ? C.fg : C.fg3, fontSize: 14, fontFamily: 'inherit', fontWeight: 600 }}>Save</button>
      </div>
      <div style={{ padding: '8px 22px 28px' }}>
        <VTypePill type={account.type} C={C} large />
        <div style={{
          fontFamily: V_FONT, fontSize: 22, fontWeight: 600, color: C.fg, letterSpacing: -0.5,
          marginTop: 10, marginBottom: 16,
        }}>{account.name}</div>

        <VField C={C} label="Date" value={draft.date} type="date"
          onChange={v => setDraft({ ...draft, date: v })} />

        {account.type === 'house' ? (
          <>
            <VField C={C} label="Property value" value={draft.value} prefix="£" numeric
              onChange={v => setDraft({ ...draft, value: v })} />
            <VField C={C} label="Mortgage balance" value={draft.mortgage} prefix="£" numeric
              onChange={v => setDraft({ ...draft, mortgage: v })} />
          </>
        ) : account.type === 'investment' ? (
          <>
            <VField C={C} label="Deposited" value={draft.deposited} prefix="£" numeric
              onChange={v => setDraft({ ...draft, deposited: v })} />
            <VField C={C} label="Current value" value={draft.value} prefix="£" numeric
              onChange={v => setDraft({ ...draft, value: v })} />
          </>
        ) : (
          <VField C={C} label={t.sign === -1 ? 'Amount owed' : 'Balance'} value={draft.value} prefix="£" numeric
            onChange={v => setDraft({ ...draft, value: v })} />
        )}
      </div>
    </VSheet>
  );
}

Object.assign(window, { VSheet, VAddAccountSheet, VAddEntrySheet, VField, primaryBtn });
