// app.jsx — Root: design canvas with two iPhone prototypes (Vibrant + Minimal)
// plus a Tweaks panel for dark mode + populated/empty toggle.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "populated": true
}/*EDITMODE-END*/;

function VibrantApp({ dark, populated }) {
  const app = useApp(populated);
  const C = dark ? V_THEME.dark : V_THEME.light;
  const top = app.top;

  // Cancel any open sheet when navigating screens
  React.useEffect(() => { app.setSheet(null); }, [top.name, top.accountId]);

  let screen;
  if (top.name === 'home') screen = <VHome app={app} C={C} dark={dark} />;
  else if (top.name === 'detail') screen = <VDetail app={app} C={C} dark={dark} accountId={top.accountId} />;
  else if (top.name === 'onboarding') screen = <VOnboarding app={app} C={C} dark={dark} />;
  else if (top.name === 'settings') screen = <VSettings app={app} C={C} dark={dark} />;

  let sheet = null;
  if (app.sheet?.name === 'addAccountType') sheet = <VAddAccountSheet app={app} C={C} dark={dark} />;
  else if (app.sheet?.name === 'addEntry') sheet = <VAddEntrySheet app={app} C={C} dark={dark} />;

  return (
    <IOSDevice dark={dark} width={402} height={874}>
      <div style={{
        height: '100%', width: '100%', position: 'relative',
        background: C.bg, color: C.fg, fontFamily: V_FONT,
        overflow: 'hidden',
      }}>
        {screen}
        {sheet}
      </div>
    </IOSDevice>
  );
}

function MinimalApp({ dark, populated }) {
  const app = useApp(populated);
  const C = dark ? M_THEME.dark : M_THEME.light;
  const top = app.top;

  React.useEffect(() => { app.setSheet(null); }, [top.name, top.accountId]);

  let screen;
  if (top.name === 'home') screen = <MHome app={app} C={C} dark={dark} />;
  else if (top.name === 'detail') screen = <MDetail app={app} C={C} dark={dark} accountId={top.accountId} />;
  else if (top.name === 'onboarding') screen = <MOnboarding app={app} C={C} dark={dark} />;
  else if (top.name === 'settings') screen = <MSettings app={app} C={C} dark={dark} />;

  let sheet = null;
  if (app.sheet?.name === 'addAccountType') sheet = <MAddAccountSheet app={app} C={C} dark={dark} />;
  else if (app.sheet?.name === 'addEntry') sheet = <MAddEntrySheet app={app} C={C} dark={dark} />;

  return (
    <IOSDevice dark={dark} width={402} height={874}>
      <div style={{
        height: '100%', width: '100%', position: 'relative',
        background: C.bg, color: C.fg, fontFamily: M_SANS,
        overflow: 'hidden',
      }}>
        {screen}
        {sheet}
      </div>
    </IOSDevice>
  );
}

function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dark = t.dark;
  const populated = t.populated;
  // remount apps when populated changes (state reset)
  const key = `${populated}`;

  return (
    <>
      <DesignCanvas>
        <DCSection id="prototypes" title="Worthi · Two style directions" subtitle="iOS · fully clickable · same data, same flows">
          <DCArtboard id="vibrant" label="A · Dusk — premium / vibrant" width={420} height={892}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <VibrantApp key={key} dark={dark} populated={populated} />
            </div>
          </DCArtboard>
          <DCArtboard id="minimal" label="B · Linen — minimal warm" width={420} height={892}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <MinimalApp key={key} dark={dark} populated={populated} />
            </div>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={dark} onChange={v => setTweak('dark', v)} />
        <TweakSection label="State" />
        <TweakToggle label="Populated with seed data" value={populated} onChange={v => setTweak('populated', v)} />
        <div style={{ fontSize: 10.5, color: 'rgba(41,38,27,0.55)', lineHeight: 1.5, marginTop: 6 }}>
          When off, both prototypes start at onboarding with no accounts. Use the + buttons to add accounts via the bottom-sheet flow.
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
