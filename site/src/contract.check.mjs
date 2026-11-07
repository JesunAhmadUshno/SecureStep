// Known-answer self-check, run by "npm run build": node src/contract.check.mjs
// Reads the same repo files the page imports and asserts what the page will show.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseForms, parseClientState, parseEndpoint, parseMockOcr, ocrIsMock, submitIsTodo,
  parseSubmitAlert, contract, wizard, initialWizard, progress, requiredForms,
} from './source.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (p) => readFileSync(root + p, 'utf8');
const json = (p) => JSON.parse(read(p));
const app = read('client/src/App.jsx');
const py = read('functions/ocr/main.py');
const config = json('catalyst-config.json');
const models = { tenants: json('models/tenants.json'), checklist: json('models/checklist.json'), signatures: json('models/signatures.json') };

// Config: one function, three models, and every configured model has a models/*.json file.
assert.equal(config.functions.length, 1);
assert.deepEqual(config.datastore.models, [models.tenants.model, models.checklist.model, models.signatures.model]);
assert.deepEqual(parseEndpoint(app), { url: `/functions/${config.functions[0].name}`, method: 'POST' });

// Forms: 11 + 11, disjoint, together exactly WR-1..WR-22.
const forms = parseForms(app);
assert.equal(forms.A.length, 11);
assert.equal(forms.B.length, 11);
assert.deepEqual([...forms.A, ...forms.B], Array.from({ length: 22 }, (_, i) => `WR-${i + 1}`));

// The parsed mock equals what the real Python handler returns.
const mock = parseMockOcr(py);
assert.ok(ocrIsMock(py), 'main.py no longer falls back to the mock; relabel the wizard');
const live = JSON.parse(execFileSync('python3', ['-c',
  'import json,sys; sys.path.insert(0, "functions/ocr"); import main; r = main.handler({"body": "x"}, None); assert r["statusCode"] == 200; print(r["body"])'],
  { cwd: root, encoding: 'utf8' }));
assert.deepEqual(mock, live);
assert.deepEqual(parseClientState(app), ['Name', 'DOB', 'Address']);
assert.ok(submitIsTodo(app));
assert.equal(parseSubmitAlert(app), 'Onboarding Complete!');

// Contract findings the page reports.
const c = Object.fromEntries(contract({ app, py, models }).map((p) => [p.id, p]));
assert.deepEqual([c['ocr-state'].match, c['ocr-state'].left, c['ocr-state'].right], [3, 0, 0]);
const t = c['ocr-tenants'];
assert.deepEqual(t.rows.filter((r) => r.status === 'mapped').map((r) => `${r.left}>${r.right}`), ['Name>name', 'DOB>dob']);
assert.deepEqual(t.rows.filter((r) => r.status === 'left').map((r) => r.left), ['Address']);
assert.deepEqual(t.rows.filter((r) => r.status === 'right').map((r) => r.right), ['nationality', 'shoe_size', 'next_of_kin']);
const s = c['forms-signatures'];
assert.equal(s.mapped, 22);
assert.equal(s.left, 0);
assert.deepEqual(s.rows.filter((r) => r.status === 'right').map((r) => r.right), ['tenant_id']);
assert.ok(s.rows.filter((r) => r.status === 'mapped').every((r) => r.right === r.left.toLowerCase().replace('-', '_')));
assert.deepEqual([c['checklist-client'].match, c['checklist-client'].left], [0, 4]);

// Wizard replay: the App.jsx flow, and the completion count App.jsx itself never checks.
let w = wizard(initialWizard, { type: 'ocr', data: mock });
assert.equal(w.step, 1);
w = wizard(w, { type: 'type', value: 'B' });
assert.deepEqual([w.step, requiredForms(w, forms)[0]], [2, 'WR-12']);
w = wizard(w, { type: 'sign', form: 'WR-12', value: 'J. Doe' });
w = wizard(w, { type: 'sign', form: 'WR-13', value: '   ' });
assert.deepEqual(progress(w, forms), { done: 1, total: 11, complete: false });
for (const f of forms.B) w = wizard(w, { type: 'sign', form: f, value: 'x' });
assert.ok(progress(w, forms).complete);
assert.deepEqual(wizard(w, { type: 'reset' }), initialWizard);

console.log('contract ok', { forms: `${forms.A.length}+${forms.B.length}`, signatureFields: s.mapped, ocrKeysMissingFromTenants: t.left, checklistUnwritten: c['checklist-client'].left });
