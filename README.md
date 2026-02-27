# Buena Property Management — Case Study

A full-stack property management prototype built as a technical case study for [Buena](https://buena.com). The core idea: import a German *Teilungserklärung* (declaration of division) PDF and have the system extract properties, buildings, and units automatically — with manual entry as a fallback.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, Zustand |
| Backend | NestJS 11, Prisma 7, PostgreSQL |
| Extraction | Regex parser → Gemini fallback → Ollama (optional local AI) |
| Styling | Buena brand palette — dark mode default, light/dark toggle |
| Deployment | Docker + docker-compose, Dockge UI |

---

## Running locally

**Prerequisites:** Node 20+, PostgreSQL running, (optional) Ollama for local AI.

```bash
# 1. Install dependencies
make install

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit DATABASE_URL — set your local Postgres credentials
# Optionally add GEMINI_API_KEY for AI extraction

# 3. Set up the database
make db-migrate
make seed          # optional sample data

# 4. Start both servers
make dev           # backend :3001 + frontend :3000
```

Backend: `http://localhost:3001/api`
Frontend: `http://localhost:3000`

> **Auth in local dev:** Password protection is disabled when `AUTH_SECRET` is not set — the app opens directly. Auth only activates in production when the env vars are configured.

### Test PDFs

Sample PDFs for testing extraction are in `test_pdfs/` (regenerate any time with `python3 generate_test_pdfs.py`):

| File | Type | Expected result |
|---|---|---|
| `*_text.pdf` | Native text | Regex extracts at ~0.93+ confidence |
| `*_scanned.pdf` | Image only | "Scanned PDF" warning, manual entry prompt |

The original `test_declaration of division.pdf` in the root is the reference document the regex parser was tuned against.

---

## Features built

### PDF extraction pipeline
- Upload a *Teilungserklärung* PDF via drag & drop
- **Client-side PDF type detection** — detects text vs. scanned PDF immediately on file select, shows a badge and recommends the appropriate parser
- **Parser selector** — choose Auto, Regex, Gemini, Ollama, or OpenAI
- **Auto fallback chain:** regex → Gemini → Ollama
- **Regex parser** — tuned for German Teilungserklärung structure with OCR tolerance (handles `{` for `(`, `Emgang` for `Eingang`, `1.,000` for `1.000` etc.)
- **Duplicate detection** — exact match on property number, fuzzy match on name using Levenshtein distance
- Field confidence badges on every extracted field in the wizard

### Property wizard (3 steps)
- **Step 1** — General info: name, number, management type (WEG/MV), property manager, accountant
- **Step 2** — Buildings: address, construction year, floors; add/remove buildings
- **Step 3** — Units: bulk table with inline editing, bulk-add dialog, clone row, move units between buildings

### Property detail page
- Summary cards: property manager, accountant, buildings, total units
- Per-building unit tables with inline edit (click pencil → edit in place)
- Inline edit for property header and building info
- Delete property with confirmation dialog

### Dashboard / properties list
- Search by name, number, or manager — live filter with match count
- Click any row to navigate to the property detail (client-side routing)
- Manager and accountant stacked in one readable column

### UI / branding
- Dark mode by default, persisted in `localStorage`, toggled via sun/moon button in sidebar
- Buena brand colours: warm stone darks (`#0c0a09`, `#1c1917`) + green primary (`#0d7835`)
- Favicon and sidebar icon sourced from buena.com

---

## AI extraction setup

| Parser | Key needed | Notes |
|---|---|---|
| Regex | None | Default, works well for native-text PDFs |
| Gemini | `GEMINI_API_KEY` in `backend/.env` | Primary AI fallback |
| Ollama | `OLLAMA_BASE_URL` (default `http://localhost:11434`) | Free local AI, no key needed — run `ollama run llama3.2` |
| OpenAI | `OPENAI_API_KEY` | Wired up but untested — no key available |

Scanned / image-only PDFs return a clear error — AI text parsers require extractable text. OCR support is not implemented (see roadmap).

---

## Roadmap — what would come next in a real product

### High priority
- [ ] **OCR for scanned PDFs** — integrate Tesseract or send pages as images to a vision model (GPT-4o Vision / Gemini Vision) so scanned documents work end-to-end
- [ ] **Real-time property number uniqueness check** — validate on the frontend before submit rather than showing a backend conflict error
- [ ] **Unit assignment to buildings from extraction** — currently units are distributed proportionally; ideally the regex/AI parser identifies which building each unit belongs to from the document structure

### Medium priority
- [ ] **Pagination** on the properties list for large portfolios
- [x] **Sorting** — click column headers to sort by name, type, unit count etc.
- [ ] **CSV / PDF export** for reporting
- [ ] **Audit log / edit history** — track who changed what and when

### Nice to have
- [ ] **Bulk operations** — select multiple properties and delete/export together
- [ ] **Undo** for inline edits on the property detail page
- [ ] **Unit floor plan upload** — attach images or PDFs to individual units
- [ ] **Tenant / lease tracking** — link units to tenants with lease start/end dates

---

## Out of scope for this demo

The following are real product concerns but were intentionally skipped to keep the scope manageable:

- **Authentication & authorisation** — single shared password gate only; no user accounts, no role-based access (admin vs. read-only manager)
- **Multi-tenancy** — single-tenant data model; no concept of organisations or teams
- **Tests** — no unit or e2e tests written (NestJS and Next.js test scaffolding is present but unused)
- **Accessibility** — basic semantic HTML only; no full WCAG audit
- **Internationalisation** — UI is English-only; data is German-centric (field names, document format)
- **Error monitoring** — no Sentry / logging service integration

---

## Project structure

```
buena-property-management/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── extraction/       # PDF upload, parser pipeline
│   │   │   └── parsers/      # regex, openai, gemini, ollama
│   │   ├── properties/       # CRUD for properties, buildings, units
│   │   └── prisma/           # DB service
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
└── frontend/                 # Next.js app
    └── src/
        ├── app/              # Routes (App Router)
        ├── components/
        │   ├── Dashboard/
        │   ├── Extraction/   # Upload page, duplicate comparison
        │   ├── PropertyDetail/
        │   ├── PropertyWizard/
        │   └── ui/           # shadcn components
        ├── hooks/            # usePropertyWizard (Zustand)
        ├── lib/              # axios API client
        └── types/            # shared TypeScript types
```
