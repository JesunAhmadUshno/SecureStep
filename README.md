# SecureStep (SecureSteps Pro)

SecureStep is a tenant verification app that runs on Zoho Catalyst. It
pairs a React client with one Python serverless function and three
data models: tenants, a document checklist, and signatures.

## Start here

1. Read `catalyst-config.json` first. It names the project
   (SecureSteps Pro), the one function (`ocr`, Python 3.9, API
   trigger), the client folder, and the three data models.
2. Run the client:

   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Read `functions/ocr/main.py` before you wire anything. The OCR
   call is a mock today. The Status section below says exactly what
   that means.

## What is in the repo

| Part | Path | What the files show |
| :--- | :--- | :--- |
| Client | `client/` | React 19 with Vite and Tailwind. Entry point: `client/src/App.jsx` |
| Function | `functions/ocr/main.py` | Python 3.9 handler. Takes an image in the event body. Returns Name, DOB, and Address fields |
| Model | `models/tenants.json` | Tenant fields: name, dob, nationality, shoe_size, next_of_kin |
| Model | `models/checklist.json` | Per-tenant checks, all boolean: uc_statement, photo_id, ni_proof |
| Model | `models/signatures.json` | Per-tenant signature fields: wr_1, wr_2, and on |
| Build | `package.json` (root) | One build script: build the client. Tailwind and PostCSS sit here |

## Status, honestly

- **The OCR function is a scaffold.** The Zoho Zia OCR call is mocked
  in the code and returns sample data. The code says so in its own
  comments: placeholder import, mock implementation, a TODO to
  integrate the real Zia OCR API. Wiring the real API is the next
  step.
- **No live deployment URL is recorded in this repo.**
- **The tree carries a committed `node_modules` folder.** It holds
  1,160 of the 1,183 files in this repo. The real project is 23
  files. The removal step is written up in the project notes and
  runs at the next push.

## Stack

- Client: React 19, Vite (rolldown-vite), Tailwind CSS 4
- Function: Python 3.9 on Zoho Catalyst, API trigger
- Data: Catalyst datastore models, defined as JSON in `models/`
