import { useEffect, useMemo, useState, useId } from 'react';
import config from '../../catalyst-config.json';
import tenants from '../../models/tenants.json';
import checklist from '../../models/checklist.json';
import signatures from '../../models/signatures.json';
import appSrc from '../../client/src/App.jsx?raw';
import pySrc from '../../functions/ocr/main.py?raw';
import {
  parseForms, parseClientState, parseEndpoint, parseMockOcr, ocrIsMock, submitIsTodo, parseSubmitAlert,
  contract, wizard, initialWizard, requiredForms, progress,
} from './source.js';

// Everything below is derived from the files imported above at build time; nothing is typed in.
const REPO = 'https://github.com/JesunAhmadUshno/SecureStep';
const blob = (p) => `${REPO}/blob/main/${p}`;
const MODELS = { tenants, checklist, signatures };
const MODEL_FILES = { [tenants.model]: 'models/tenants.json', [checklist.model]: 'models/checklist.json', [signatures.model]: 'models/signatures.json' };
const FORMS = parseForms(appSrc);
const MOCK = parseMockOcr(pySrc);
const STATE_KEYS = parseClientState(appSrc);
const ENDPOINT = parseEndpoint(appSrc);
const IS_MOCK = ocrIsMock(pySrc);
const SUBMIT_TODO = submitIsTodo(appSrc);
const SUBMIT_ALERT = parseSubmitAlert(appSrc);
const CONTRACT = contract({ app: appSrc, py: pySrc, models: MODELS });
const FN = config.functions[0];
const SIG_COUNT = Object.keys(signatures.fields).filter((k) => /^wr_\d+$/.test(k)).length;
const ALL_FORMS = [...FORMS.A, ...FORMS.B];
const col = (form) => form.toLowerCase().replace('-', '_');

const SECTIONS = [['top', 'Overview', '◎'], ['wizard', 'Wizard', '▶'], ['arch', 'Architecture', '⇄'], ['models', 'Models', '▦'], ['contract', 'Contract', '✓'], ['routing', 'Forms', '✎'], ['status', 'Status', '!']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">SecureStep</a>
      <a className="m" href={blob('catalyst-config.json')}>Config</a>
      <a className="m" href={blob('client/src/App.jsx')}>Client</a>
      <a className="m" href={blob('functions/ocr/main.py')}>Function</a>
      <span className="spacer" />
      <span className="status"><i /> Prototype · OCR {IS_MOCK ? 'mocked' : 'wired'}</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

export default function App() {
  useReveal();
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Wizard />
      <Architecture />
      <Models />
      <Contract />
      <Routing />
      <Status />
      <Dock />
      <footer>
        Every number on this page is parsed from <code>catalyst-config.json</code>, <code>models/*.json</code>, <code>client/src/App.jsx</code> and <code>functions/ocr/main.py</code> at build time, and a build-time check re-derives them and runs the Python handler. The wizard is a replay in your browser; no file leaves your device.
      </footer>
    </div>
  );
}

function Hero() {
  const tenantGap = CONTRACT.find((c) => c.id === 'ocr-tenants');
  return (
    <header className="card hero window" id="top" data-title="SecureStep — README">
      <div className="head">
        <p className="eyebrow">Engineering prototype · Zoho Catalyst · project “{config.project_name}”</p>
        <span className={`pill ${IS_MOCK ? 'warn' : 'good'}`}>● OCR {IS_MOCK ? 'is a mock' : 'wired'}</span>
      </div>
      <h1>A tenant onboarding <em>prototype</em>: scan an ID, pick a client type, sign {FORMS.A.length} of {ALL_FORMS.length} WR forms.</h1>
      <p className="sub">
        SecureStep pairs a React wizard with one Python serverless function and {config.datastore.models.length} datastore models.
        The ID-reading step returns a fixed sample record today, and the Submit button saves nothing yet.
        This page replays the real flow, draws the architecture from the config, and checks whether the pieces actually agree on their data.
      </p>
      <div className="actions">
        <a className="btn primary" href="#wizard">Replay the wizard</a>
        <a className="btn ghost" href="#contract">See the contract check</a>
        <span className="hint">Status read from source: <span className="pill info">{config.functions.length} function</span> <span className="pill info">{config.datastore.models.length} models</span> <span className="pill info">{SIG_COUNT} signature fields</span></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{config.functions.length}</div><div className="cap">Serverless function: <code>{FN.name}</code>, {FN.runtime}</div></div>
        <div className="tile"><div className="num">{config.datastore.models.length}</div><div className="cap">Datastore models: {config.datastore.models.join(', ')}</div></div>
        <div className="tile"><div className="num">{FORMS.A.length}+{FORMS.B.length}</div><div className="cap">WR forms per client type A / B, {SIG_COUNT} signature columns</div></div>
        <div className="tile"><div className="num">{tenantGap.left + tenantGap.right}</div><div className="cap">Fields that don’t line up between OCR output and the Tenants model</div></div>
      </div>
    </header>
  );
}

const STEP_NAMES = ['Upload ID', 'Details + client type', 'Sign required forms'];

function Wizard() {
  const [s, setS] = useState(initialWizard);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const act = (a) => { setSubmitted(false); setS((x) => wizard(x, a)); };
  const runOcr = () => { setBusy(true); setTimeout(() => { setBusy(false); act({ type: 'ocr', data: MOCK }); }, 450); };
  const prog = progress(s, FORMS);
  const req = requiredForms(s, FORMS);
  return (
    <section id="wizard" className="card window reveal" data-title="onboarding-wizard.app — replay">
      <div className="head">
        <div>
          <p className="eyebrow">Replay · runs in your browser</p>
          <h2>The three-step flow from App.jsx, step by step.</h2>
          <p className="sub">
            This re-runs the wizard’s state machine with the same steps, client types and form lists as <a href={blob('client/src/App.jsx')}>App.jsx</a>.
            The OCR step returns the mock record hard-coded in <a href={blob('functions/ocr/main.py')}>main.py</a>: no real ID is read and nothing is uploaded.
          </p>
        </div>
        <span className="pill warn">Mock OCR output</span>
      </div>
      <ol className="steps" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 18 }} aria-label="Wizard progress">
        {STEP_NAMES.map((n, i) => (
          <li key={n} aria-current={s.step === i ? 'step' : undefined}>
            <span className="n" style={s.step === i ? { background: 'var(--primary)', color: '#fff' } : s.step > i ? { background: 'var(--good-bg)', color: 'var(--good)' } : undefined}>{s.step > i ? '✓' : i + 1}</span>
            <div><b>{n}</b><div className="hint">step {i} in App.jsx</div></div>
          </li>
        ))}
      </ol>
      <div className="tile" style={{ minHeight: 180 }}>
        {s.step === 0 && (
          <div>
            <h3>Upload ID for OCR</h3>
            <p className="hint">The real client posts the image to <code>{ENDPOINT.method} {ENDPOINT.url}</code>. Here the button calls the mock directly, so you never pick a file.</p>
            <button className="btn primary" onClick={runOcr} disabled={busy}>{busy ? 'Running mock OCR…' : 'Run mock OCR (no file is read)'}</button>
          </div>
        )}
        {s.step === 1 && (
          <div>
            <h3>Auto-filled details <span className="pill warn" style={{ marginLeft: 8 }}>from mock_perform_ocr()</span></h3>
            <table style={{ margin: '8px 0 14px' }}><tbody>
              {STATE_KEYS.map((k) => <tr key={k}><th className="mono">{k}</th><td>{s.ocr[k]}</td></tr>)}
            </tbody></table>
            <div className="actions" style={{ marginTop: 0 }}>
              <span className="hint">Select client type:</span>
              <button className="btn primary" onClick={() => act({ type: 'type', value: 'A' })}>Client type A</button>
              <button className="btn ghost" onClick={() => act({ type: 'type', value: 'B' })}>Client type B</button>
            </div>
          </div>
        )}
        {s.step === 2 && (
          <div>
            <div className="head" style={{ marginBottom: 8 }}>
              <h3>Required forms for client type {s.clientType}</h3>
              <span className={`pill ${prog.complete ? 'good' : 'info'}`}>{prog.done} / {prog.total} signed</span>
            </div>
            <div className="track" style={{ marginBottom: 14 }} role="progressbar" aria-label="Signatures completed" aria-valuemin={0} aria-valuemax={prog.total} aria-valuenow={prog.done}>
              <div className="fill" style={{ width: `${(prog.done / prog.total) * 100}%`, background: prog.complete ? 'var(--good)' : 'var(--primary)' }} />
            </div>
            <div className="controls" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {req.map((f) => <SigInput key={f} form={f} value={s.sigs[f] || ''} onChange={(v) => act({ type: 'sign', form: f, value: v })} />)}
            </div>
            <div className="actions">
              <button className="btn primary" onClick={() => setSubmitted(true)}>Submit</button>
              <button className="btn ghost" onClick={() => act({ type: 'reset' })}>Start over</button>
            </div>
            {submitted && (
              <p className="tip" aria-live="polite">
                App.jsx would now show <code>alert('{SUBMIT_ALERT}')</code>{SUBMIT_TODO ? ' and save nothing: handleSubmit is still a TODO.' : '.'}
                {' '}It also accepts the submit with {prog.done} of {prog.total} signatures; the completeness check above is this replay’s, not the app’s.
              </p>
            )}
          </div>
        )}
      </div>
      {s.step === 1 && <p className="hint" style={{ marginTop: 10 }}><button className="btn ghost" onClick={() => act({ type: 'reset' })}>Start over</button></p>}
    </section>
  );
}

function SigInput({ form, value, onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{form} <span className="mono">→ {col(form)}</span></label>
      <input id={id} type="text" value={value} placeholder="Type a name" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Architecture() {
  const [hover, setHover] = useState(null);
  const W = 960, H = 290;
  const models = config.datastore.models;
  const nodes = [
    { id: 'client', x: 20, y: 110, w: 210, h: 80, title: 'React client', lines: [`path ${config.client.path}`, 'App.jsx wizard'], detail: `Vite + React app in ${config.client.path}. Posts the ID image to ${ENDPOINT.url}.` },
    { id: 'fn', x: 380, y: 95, w: 230, h: 110, title: `function “${FN.name}”`, lines: [`runtime ${FN.runtime}`, `handler ${FN.handler}`, `trigger ${FN.triggers.join(', ')}`], detail: `functions/ocr/main.py: returns 400 without a body, otherwise ${IS_MOCK ? 'the mock record (the Zia OCR SDK import falls back to mock_perform_ocr)' : 'the OCR result'}.` },
    ...models.map((m, i) => ({ id: m, x: 760, y: 20 + i * 92, w: 180, h: 72, title: m, lines: [`${Object.keys(MODELS[m.toLowerCase()].fields).length} fields`], detail: `${MODEL_FILES[m]}: ${Object.keys(MODELS[m.toLowerCase()].fields).join(', ')}.` })),
  ];
  const n = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const hl = (id) => (hover && hover.id !== id ? 0.4 : 1);
  return (
    <section id="arch" className="card window reveal" data-title="catalyst-config.json — architecture">
      <p className="eyebrow">Architecture</p>
      <h2>One client, one function, three tables, and nothing yet writes to the tables.</h2>
      <p className="sub">
        Every label is read from <a href={blob('catalyst-config.json')}>catalyst-config.json</a> and the source files. Solid arrows exist in code today; dashed arrows are what the datastore models imply but no code does yet.
      </p>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Architecture: client posts to ${ENDPOINT.url}, the ${FN.runtime} function ${FN.name}, and ${models.length} datastore models`} onMouseLeave={() => setHover(null)} style={{ marginTop: 12 }}>
        <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)" /></marker></defs>
        <line x1={n.client.x + n.client.w} y1={140} x2={n.fn.x} y2={140} stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arr)" />
        <text x={(n.client.x + n.client.w + n.fn.x) / 2} y={130} textAnchor="middle" style={{ fill: 'var(--primary)' }}>{ENDPOINT.method} {ENDPOINT.url}</text>
        <line x1={n.fn.x} y1={168} x2={n.client.x + n.client.w} y2={168} stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arr)" />
        <text x={(n.client.x + n.client.w + n.fn.x) / 2} y={186} textAnchor="middle">JSON: {Object.keys(MOCK).join(', ')}</text>
        {models.map((m) => (
          <line key={m} x1={n.fn.x + n.fn.w} y1={150} x2={n[m].x - 4} y2={n[m].y + n[m].h / 2} stroke="var(--warn)" strokeWidth="1.5" strokeDasharray="5 5" opacity={hl(m)} markerEnd="url(#arr)" />
        ))}
        <text x={n.fn.x + n.fn.w / 2} y={n.fn.y + n.fn.h + 30} textAnchor="middle" style={{ fill: 'var(--warn)' }}>save to datastore: not wired</text>
        <text x={n.fn.x + n.fn.w / 2} y={n.fn.y + n.fn.h + 46} textAnchor="middle" style={{ fill: 'var(--warn)' }}>(handleSubmit is a TODO)</text>
        {nodes.map((x) => (
          <g key={x.id} onMouseEnter={() => setHover(x)} onFocus={() => setHover(x)} tabIndex={0} opacity={hl(x.id)} style={{ cursor: 'default' }}>
            <rect x={x.x} y={x.y} width={x.w} height={x.h} rx="14" fill="var(--surface-strong)" stroke={hover?.id === x.id ? 'var(--primary)' : 'var(--border)'} strokeWidth="1.5" />
            <text x={x.x + 14} y={x.y + 24} style={{ fill: 'var(--text)', fontSize: 14, fontWeight: 700 }}>{x.title}</text>
            {x.lines.map((l, i) => <text key={l} x={x.x + 14} y={x.y + 44 + i * 18} className="mono">{l}</text>)}
          </g>
        ))}
      </svg>
      <div className="tip" aria-live="polite">{hover ? hover.detail : 'Hover or tab to a box to see where it comes from.'}</div>
    </section>
  );
}

function Models() {
  const [pick, setPick] = useState(config.datastore.models[0]);
  const m = MODELS[pick.toLowerCase()];
  const ocrKeys = Object.keys(MOCK).map((k) => k.toLowerCase());
  const usedBy = (field) => {
    if (pick === signatures.model && /^wr_\d+$/.test(field)) return { t: `signed in step 2 (${field.toUpperCase().replace('_', '-')})`, ok: true };
    if (pick === tenants.model && ocrKeys.includes(field)) return { t: 'filled by OCR output', ok: true };
    if (field === 'tenant_id') return { t: 'key; no code generates one yet', ok: null };
    return { t: 'nothing in the client collects this', ok: false };
  };
  const fields = Object.entries(m.fields);
  return (
    <section id="models" className="card window reveal" data-title="models/ — data model explorer">
      <div className="head">
        <div>
          <p className="eyebrow">Data models</p>
          <h2>What each table expects, and who fills it.</h2>
          <p className="sub">Fields and types are imported from <a href={blob(MODEL_FILES[pick])}>{MODEL_FILES[pick]}</a>; the “filled by” column is computed from App.jsx and main.py.</p>
        </div>
        <div className="seg" role="group" aria-label="Choose a model">
          {config.datastore.models.map((k) => <button key={k} aria-pressed={pick === k} onClick={() => setPick(k)}>{k} · {Object.keys(MODELS[k.toLowerCase()].fields).length}</button>)}
        </div>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 420 }}>
        <table>
          <thead><tr><th>Field</th><th>Type</th><th>Filled by</th></tr></thead>
          <tbody>
            {fields.map(([k, t]) => { const u = usedBy(k); return (
              <tr key={k}><td className="mono">{k}</td><td className="mono">{t}</td><td className={u.ok === null ? '' : u.ok ? 'ok' : 'no'}>{u.t}</td></tr>
            ); })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const STATUS_PILL = { match: ['good', 'match'], mapped: ['info', null], left: ['bad', 'left only'], right: ['warn', 'right only'] };

function Contract() {
  const [id, setId] = useState(CONTRACT[1].id);
  const c = CONTRACT.find((x) => x.id === id);
  return (
    <section id="contract" className="card window reveal" data-title="contract-check.js — live">
      <div className="head">
        <div>
          <p className="eyebrow">Live data-contract check</p>
          <h2>Do the function, the client and the tables agree on field names?</h2>
          <p className="sub">
            Computed in your browser from the imported source: key lists are diffed exactly, then after a normalisation (lowercase, WR-N → wr_N).
            The same code runs in the build’s known-answer check, so the page and the check can’t disagree.
          </p>
        </div>
      </div>
      <div className="seg" role="group" aria-label="Choose a comparison" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        {CONTRACT.map((x) => <button key={x.id} aria-pressed={id === x.id} onClick={() => setId(x.id)}>{x.title}</button>)}
      </div>
      <div className="tiles" style={{ marginTop: 0 }}>
        <div className="tile"><div className="num">{c.match}</div><div className="cap">exact matches</div></div>
        <div className="tile"><div className="num">{c.mapped}</div><div className="cap">match after normalising ({c.mappedLabel})</div></div>
        <div className="tile"><div className="num" style={{ color: c.left ? 'var(--bad)' : undefined }}>{c.left}</div><div className="cap">only in {c.leftLabel}</div></div>
        <div className="tile"><div className="num" style={{ color: c.right ? 'var(--warn)' : undefined }}>{c.right}</div><div className="cap">only in {c.rightLabel}</div></div>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 360, marginTop: 14 }}>
        <table>
          <thead><tr><th>{c.leftLabel}</th><th>{c.rightLabel}</th><th>Result</th></tr></thead>
          <tbody>
            {c.rows.map((r, i) => { const [cls, txt] = STATUS_PILL[r.status]; return (
              <tr key={i}><td className="mono">{r.left ?? '—'}</td><td className="mono">{r.right ?? '—'}</td><td><span className={`pill ${cls}`}>{txt ?? c.mappedLabel}</span></td></tr>
            ); })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function useNarrow() {
  const q = '(max-width: 700px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => setNarrow(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return narrow;
}

function Routing() {
  const [type, setType] = useState('A');
  const [hover, setHover] = useState(null);
  const sel = FORMS[type];
  const narrow = useNarrow();
  const cols = narrow ? 6 : 11, W = narrow ? 600 : 960, cw = (W - 20) / cols, H = Math.ceil(ALL_FORMS.length / cols) * 74 + 24;
  return (
    <section id="routing" className="card window reveal" data-title="form-routing — A/B explorer">
      <div className="head">
        <div>
          <p className="eyebrow">Form routing</p>
          <h2>Each client type signs a disjoint half of the {ALL_FORMS.length} WR forms.</h2>
          <p className="sub">
            Lists parsed from <code>FORMS_A</code> and <code>FORMS_B</code> in <a href={blob('client/src/App.jsx')}>App.jsx</a>; columns from <a href={blob('models/signatures.json')}>signatures.json</a>.
            Type A gets {FORMS.A[0]} to {FORMS.A.at(-1)}, type B gets {FORMS.B[0]} to {FORMS.B.at(-1)}. Either way, half the Signatures columns stay empty for every tenant.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Client type">
          {['A', 'B'].map((k) => <button key={k} aria-pressed={type === k} onClick={() => setType(k)}>Client type {k} · {FORMS[k].length}</button>)}
        </div>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ALL_FORMS.length} WR forms, ${sel.length} required for client type ${type}`} onMouseLeave={() => setHover(null)}>
        {ALL_FORMS.map((f, i) => {
          const on = sel.includes(f), x = 10 + (i % cols) * cw, y = Math.floor(i / cols) * 74;
          const has = col(f) in signatures.fields;
          return (
            <g key={f} onMouseEnter={() => setHover(f)}>
              <rect x={x + 3} y={y} width={cw - 6} height={64} rx="12" fill={on ? 'var(--primary)' : 'var(--surface-strong)'} stroke={hover === f ? 'var(--primary)' : 'var(--border)'} strokeWidth="1.5" />
              <text x={x + cw / 2} y={y + 28} textAnchor="middle" style={{ fill: on ? '#fff' : 'var(--text)', fontSize: 14, fontWeight: 700 }}>{f}</text>
              <text x={x + cw / 2} y={y + 48} textAnchor="middle" className="mono" style={{ fill: on ? '#fff' : has ? 'var(--muted)' : 'var(--bad)' }}>{has ? col(f) : 'no column'}</text>
            </g>
          );
        })}
        <text x={10} y={H - 4}>filled: required for type {type}</text>
        <text x={W - 10} y={H - 4} textAnchor="end">{SIG_COUNT} wr_N columns in Signatures</text>
      </svg>
      <div className="tip" aria-live="polite">{hover ? `${hover} → Signatures.${col(hover)} · ${FORMS.A.includes(hover) ? 'client type A' : 'client type B'}` : 'Hover a form to see its datastore column.'}</div>
    </section>
  );
}

function Status() {
  const items = [
    { t: 'OCR is a mock', d: `main.py tries to import a Zia OCR SDK module that does not exist and falls back to mock_perform_ocr, which always returns the same sample record (${MOCK.Name}, ${MOCK.DOB}). No OCR accuracy can be measured until the real API is wired.`, s: IS_MOCK ? 'warn' : 'good' },
    { t: 'Submit saves nothing', d: `handleSubmit shows “${SUBMIT_ALERT}” and has a TODO to send data to the backend. The end-to-end flow is unproven.`, s: SUBMIT_TODO ? 'bad' : 'good' },
    { t: 'Data contract gaps', d: `Address comes back from OCR but Tenants has no address field; Tenants asks for fields nothing collects; the Checklist table is never written. See the contract check above.`, s: 'bad' },
    { t: 'Privacy and security not yet addressed', d: 'The product would handle ID images and signatures, but there is no auth, no server-side check of upload type or size, signatures are free text, and no retention or consent policy is written down.', s: 'bad' },
    { t: 'No deployment, no measured results', d: 'No live product URL is recorded. This page is a dashboard of the source, not the product.', s: 'warn' },
    { t: 'Client build fails', d: 'Running npm ci && npm run build in client/ stops because PostCSS cannot find tailwindcss: Tailwind 4 is installed at the repo root, while the client uses Tailwind 3 style config.', s: 'bad' },
    { t: 'Tests', d: 'A stdlib unittest smoke test covers the OCR handler (400 on empty body, 200 + the three keys otherwise). The client has no tests; the contract check here runs on every site build.', s: 'info' },
  ];
  return (
    <section id="status" className="card window reveal" data-title="STATUS.md — honest status">
      <p className="eyebrow">Limitations and roadmap</p>
      <h2>What works, what is mocked, and what is missing.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        {items.map((c) => (
          <div className="tile" key={c.t}>
            <div className="head" style={{ marginBottom: 6 }}><h3>{c.t}</h3><span className={`pill ${c.s}`}>{{ warn: 'Caveat', bad: 'Gap', good: 'Done', info: 'Partial' }[c.s]}</span></div>
            <p className="hint" style={{ margin: 0, fontSize: 13 }}>{c.d}</p>
          </div>
        ))}
      </div>
      <div className="docs" style={{ marginTop: 20 }}>
        {[['README.md', 'README', 'What is in the repo'], ['docs/research-review.md', 'Research review', 'Graded gaps and what each needs'], ['functions/ocr/test_main.py', 'Handler tests', 'python3 -m unittest']].map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}
