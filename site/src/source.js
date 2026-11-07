// Parsers and checks over the repo's own source files. Shared by the page (App.jsx) and the
// build-time known-answer check (contract.check.mjs), so both always agree.
// Every parser throws when the source changes shape, so the build fails loudly instead of
// showing a wrong count.

function need(m, what) {
  if (!m) throw new Error(`Could not find ${what}; the source changed shape, update site/src/source.js`);
  return m;
}

const strings = (s) => [...s.matchAll(/"([^"]+)"|'([^']+)'/g)].map((x) => x[1] ?? x[2]);

/** FORMS_A / FORMS_B arrays from client/src/App.jsx. */
export function parseForms(app) {
  const get = (name) => {
    const items = strings(need(app.match(new RegExp(`const ${name}\\s*=\\s*\\[([^\\]]*)\\]`)), `${name} in client/src/App.jsx`)[1]);
    if (!items.length) throw new Error(`${name} is empty in client/src/App.jsx`);
    return items;
  };
  return { A: get('FORMS_A'), B: get('FORMS_B') };
}

/** Keys of the initial ocrData state in client/src/App.jsx. */
export function parseClientState(app) {
  const body = need(app.match(/\[ocrData,\s*setOcrData\]\s*=\s*useState\(\{([^}]*)\}\)/), 'ocrData useState in client/src/App.jsx')[1];
  return [...body.matchAll(/(\w+)\s*:/g)].map((x) => x[1]);
}

/** The URL and method the client posts the ID image to. */
export function parseEndpoint(app) {
  const m = need(app.match(/fetch\('([^']+)',\s*\{\s*method:\s*'(\w+)'/), 'fetch call in client/src/App.jsx');
  return { url: m[1], method: m[2] };
}

/** The dict returned by mock_perform_ocr in functions/ocr/main.py. */
export function parseMockOcr(py) {
  const body = need(py.match(/def mock_perform_ocr\([^)]*\):[\s\S]*?return\s*\{([\s\S]*?)\}/), 'mock_perform_ocr in functions/ocr/main.py')[1];
  return Object.fromEntries([...body.matchAll(/'(\w+)':\s*'([^']*)'/g)].map((x) => [x[1], x[2]]));
}

/** True while main.py falls back to the mock when the Zia SDK import fails. */
export const ocrIsMock = (py) => /except ImportError:[\s\S]*?perform_ocr\s*=\s*mock_perform_ocr/.test(py);

/** True when handleSubmit still only alerts (no fetch, no datastore write). */
export function submitIsTodo(app) {
  const body = need(app.match(/const handleSubmit = \(\) => \{([\s\S]*?)\n\s*\};/), 'handleSubmit in client/src/App.jsx')[1];
  return /TODO/.test(body) && !/fetch\(/.test(body);
}

// Compare two key lists. 'match' = identical, 'mapped' = equal after norm(), 'left'/'right' = only on that side.
export function compare(left, right, norm = (k) => k) {
  const used = new Set();
  const rows = left.map((l) => {
    const exact = right.find((r) => r === l && !used.has(r));
    const r = exact ?? right.find((x) => !used.has(x) && norm(x) === norm(l));
    if (r == null) return { left: l, right: null, status: 'left' };
    used.add(r);
    return { left: l, right: r, status: exact ? 'match' : 'mapped' };
  });
  for (const r of right) if (!used.has(r)) rows.push({ left: null, right: r, status: 'right' });
  const count = (s) => rows.filter((x) => x.status === s).length;
  return { rows, match: count('match'), mapped: count('mapped'), left: count('left'), right: count('right') };
}

/** The four data-contract comparisons shown on the page. */
export function contract({ app, py, models }) {
  const ocr = Object.keys(parseMockOcr(py));
  const state = parseClientState(app);
  const forms = parseForms(app);
  const f = (m) => Object.keys(m.fields);
  const lower = (k) => k.toLowerCase();
  const checklist = f(models.checklist);
  return [
    { id: 'ocr-state', title: 'OCR output vs client state', leftLabel: 'main.py return keys', rightLabel: 'App.jsx ocrData keys', mappedLabel: 'renamed',
      ...compare(ocr, state) },
    { id: 'ocr-tenants', title: 'OCR output vs Tenants model', leftLabel: 'main.py return keys', rightLabel: 'models/tenants.json fields', mappedLabel: 'casing differs',
      ...compare(ocr, f(models.tenants), lower) },
    { id: 'forms-signatures', title: 'Signed forms vs Signatures model', leftLabel: 'App.jsx FORMS_A + FORMS_B', rightLabel: 'models/signatures.json fields', mappedLabel: 'WR-N → wr_N',
      ...compare([...forms.A, ...forms.B], f(models.signatures), (k) => lower(k).replace('-', '_')) },
    { id: 'checklist-client', title: 'Checklist model vs client', leftLabel: 'models/checklist.json fields', rightLabel: 'referenced in App.jsx', mappedLabel: 'referenced',
      ...compare(checklist, checklist.filter((k) => app.includes(k))) },
  ];
}

// Replay of the App.jsx state machine: step 0 upload, 1 details + client type, 2 signatures.
export const initialWizard = { step: 0, ocr: null, clientType: '', sigs: {} };
export function wizard(s, a) {
  switch (a.type) {
    case 'ocr': return { ...s, step: 1, ocr: a.data };
    case 'type': return { ...s, step: 2, clientType: a.value };
    case 'sign': return { ...s, sigs: { ...s.sigs, [a.form]: a.value } };
    case 'reset': return initialWizard;
    default: return s;
  }
}
export const requiredForms = (s, forms) => (s.clientType === 'A' ? forms.A : s.clientType === 'B' ? forms.B : []);
export function progress(s, forms) {
  const req = requiredForms(s, forms);
  const done = req.filter((f) => (s.sigs[f] || '').trim()).length;
  return { done, total: req.length, complete: req.length > 0 && done === req.length };
}

/** The message handleSubmit shows instead of saving. */
export const parseSubmitAlert = (app) => need(app.match(/const handleSubmit = \(\) => \{\s*alert\('([^']+)'\)/), 'handleSubmit alert in client/src/App.jsx')[1];
