# SecureStep: research and engineering review

SecureStep is a product prototype, not a study, so the research rubric is
read through an engineering lens: what claim does the repo make, what
evidence backs it, and what would it take to prove the rest. Grades: A
(strong), B (adequate), C (weak), D (missing). Reviewed 7 Nov 2026 on
branch `site/live-dashboard`.

## Summary

| Criterion | Grade | One-line reason |
| :--- | :--- | :--- |
| Question / product goal | B | Clear goal (onboard a tenant: ID, client type, WR signatures), no written requirements |
| Hypotheses / acceptance criteria | D | No stated success criteria for OCR accuracy, completion rate or time to onboard |
| Method / architecture | C | Sensible Catalyst layout, but the client-to-datastore path does not exist |
| Baselines | D | No comparison to manual entry or another OCR provider |
| Measurement and uncertainty | D | Nothing measured; OCR is a fixed mock, so no accuracy can exist yet |
| Reproducibility | C | Handler tests and the dashboard build reproduce; the client build fails |
| Threats to validity / risks | C | Now listed (here and on the dashboard); privacy not addressed in code |
| Related work | D | No note on Zoho Zia OCR limits or existing tenant-onboarding tools |
| Limitations | B | README "Status, honestly" and the dashboard state the gaps plainly |
| Engineering rigor (tests, contracts, security) | C | Smoke tests and a build-time contract check now exist; no client tests, no auth |

## What was fixed in this pass (cheap gaps)

- **Handler could not be imported.** `functions/ocr/main.py` imported a
  module that does not exist before defining its mock, so it crashed on
  import. It now falls back to the mock on `ImportError` (commit 3d33fe4).
- **No tests.** `functions/ocr/test_main.py` (stdlib `unittest`) checks 400
  on an empty body, 200 with Name, DOB and Address otherwise, and that the
  mock is in use without the SDK.
- **No contract check.** `site/src/contract.check.mjs` runs inside
  `npm run build`. It parses `App.jsx`, `main.py`, `catalyst-config.json` and
  `models/*.json`, runs the Python handler, and asserts the known answers:
  1 function, 3 models matching the model files, forms 11 + 11 covering
  WR-1..WR-22 exactly, WR-N mapping one-to-one onto `wr_1..wr_22`, the parsed
  mock equal to the handler's real output, and the contract gaps below. The
  dashboard calls the same functions (`site/src/source.js`), so the page and
  the check cannot drift apart. Parsers throw if the source changes shape.
- **Dead code.** The unused `FormData` in `App.jsx` was removed (07e5953).
- **Stale README.** The committed `node_modules` paragraph was replaced with
  the current status, test command and dashboard link.
- **Form lists.** The site reads `FORMS_A` / `FORMS_B` straight from
  `App.jsx` at build time instead of copying them.

## Findings the contract check reports

- OCR returns `Address`; the Tenants model has no address field.
- Tenants lists `nationality`, `shoe_size`, `next_of_kin`; nothing collects them.
- OCR keys `Name` / `DOB` match Tenants `name` / `dob` only after lowercasing.
- The Checklist model (`uc_statement`, `photo_id`, `ni_proof`, `tenant_id`)
  is never referenced by the client.
- No code generates a `tenant_id`, which every model uses as its key.

## Remaining gaps and exactly what each needs

1. **Client build fails.** Verified for this review: `cd client && npm ci &&
   npm run build` stops with "Loading PostCSS Plugin failed: Cannot find
   module 'tailwindcss'". Tailwind 4 sits in the root `package.json`, while
   the client uses Tailwind 3 style config (`@tailwind` directives, the
   `tailwindcss` PostCSS plugin). Needs: a decision on Tailwind 3 vs 4, then
   either `@tailwindcss/postcss` in `client/` or pinning `tailwindcss@3` there.
   Cost: minutes, no compute. Left alone here because it changes the product.
2. **OCR is a mock, so accuracy is unmeasured.** Needs: Zoho Zia OCR API
   access on a Catalyst project, plus a labelled test set of ID images with
   consent (for example 50 to 100 synthetic or specimen IDs with known
   fields). Then report field-level exact-match accuracy per field with a
   Wilson 95% interval. Paid API calls, so it waits for the Owner.
3. **Submit persists nothing.** Needs: a second Catalyst function (or a
   datastore SDK call) that writes Tenants, Checklist and Signatures rows
   keyed by a generated `tenant_id`, and an integration test against a
   Catalyst dev environment. Needs a Catalyst account; no GPU.
4. **Data contract decisions.** Needs an Owner decision: add `address` to
   Tenants or drop it from OCR; decide whether `nationality`, `shoe_size`,
   `next_of_kin` are collected in the wizard or removed; add the Checklist
   step to the client. Once decided, the build check's expected values change
   in one place.
5. **No acceptance criteria or baseline.** Needs: written targets (for
   example field accuracy, completion rate, median minutes to onboard) and a
   baseline from the current manual process. Requires real usage data from
   the housing provider; none is in the repo.
6. **Security and privacy.** Needs: authentication on the function,
   server-side checks of upload type and size, a decision on whether typed
   names count as signatures (or a proper e-signature provider), and a
   written retention and consent policy for ID images. Design work, no compute.
7. **Client tests.** Needs: a test runner in `client/` (Vitest with React
   Testing Library) covering the three steps, error path and submit. Blocked
   on gap 1.
8. **Related work.** Needs: a short note on Zia OCR's supported document
   types and limits, and on existing tenant-onboarding products, to justify
   building this. Reading only.

## Threats to the dashboard's own claims

- The wizard on the dashboard is a replay of the `App.jsx` state machine,
  not the product. It is labelled as such, uses only the mock record, and
  never reads or uploads a file.
- The source parsers are regular expressions over `App.jsx` and `main.py`.
  If those files change shape the build fails rather than showing a wrong
  number, but a change that keeps the shape and alters meaning would need
  the check updated by hand.
