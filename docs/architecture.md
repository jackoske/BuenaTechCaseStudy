# Architecture Review — Honest Criticisms & Production Improvements

**Buena Property Management Case Study**
What we built, what's wrong with it, and what we'd actually do at scale.

---

## 1. The Constraint We're Working Under

The case study requires: *"Node and React ... NestJS, Node.js, PostgreSQL, Optional: OpenAI API."*

This means we're building within Buena's existing stack. The criticisms below are not arguments to throw it away — they're an honest assessment of where the seams are and how a production system would evolve. Showing you understand the tradeoffs is more valuable than pretending everything is perfect.

---

## 2. Criticism: Node.js Is the Wrong Tool for PDF Extraction

### The Problem

PDF processing is **CPU-bound work**. Parsing text from PDFs, running OCR on scanned documents, executing regex over large German legal texts, orchestrating LLM calls — none of this plays to Node's strengths. Node.js is built for I/O-bound concurrency (handling many HTTP requests, database queries, file reads). When you throw CPU-heavy work at it, the single-threaded event loop blocks and everything else queues behind it.

### Where It Hurts Specifically

| Operation | Node.js Reality | Python Alternative |
|-----------|----------------|-------------------|
| PDF text extraction | `pdf-parse` — thin wrapper around `pdf.js`, limited error handling, chokes on some PDFs | `pdfplumber` — mature, handles edge cases, built for structured extraction |
| OCR | `tesseract.js` — WASM port, noticeably slower than native, limited language model support | `pytesseract` — native bindings, faster, better `tesseract-data-deu` support |
| Regex parsing | Fine in both, but Python's `re` module with named groups is more ergonomic for complex patterns | Same |
| LLM SDK parity | OpenAI/Gemini SDKs are equivalent | Equivalent |
| ML ecosystem | Second-class citizen — limited libraries for NLP, entity extraction, embeddings | First-class — spaCy, transformers, sentence-transformers, NLTK all available |

### The Impact

For a case study with one 14-unit PDF, this doesn't matter. For a production system processing hundreds of Teilungserklärungen daily, Node becomes a bottleneck. A single large PDF with OCR could block the event loop for 5-10 seconds, during which no other API requests are served.

### What Production Looks Like

Extract the PDF processing into a **dedicated Python microservice**:

```
┌──────────────┐       HTTP/Queue       ┌──────────────────┐
│   NestJS     │ ────────────────────▶  │  Python Worker   │
│   API        │                        │                  │
│              │  ◀──── JSON result ──  │  pdfplumber      │
│  Routing     │                        │  pytesseract     │
│  Auth        │                        │  LLM calls       │
│  CRUD        │                        │  Regex parsing   │
│  Validation  │                        │                  │
└──────┬───────┘                        └──────────────────┘
       │
┌──────▼───────┐
│  PostgreSQL  │
└──────────────┘
```

NestJS keeps doing what it's good at (HTTP routing, auth, validation, CRUD). Python does what it's good at (document processing). A clean HTTP boundary or Redis queue connects them.

---

## 3. Criticism: Synchronous Extraction Blocks the User

### The Problem

The current design has the frontend `POST /api/extraction/upload`, wait for the full pipeline to complete, then receive the result. For a simple PDF with regex parsing, this is sub-second. But add OCR + LLM fallback and you're looking at 10-30 seconds of a spinning loader with no feedback beyond the animated progress UI.

### Why This Is Bad

- User has no idea if it's working or stuck
- HTTP timeout risks for large documents
- If the user closes the tab, the work is lost
- Backend can't handle concurrent extractions efficiently (event loop blocking)

### What Production Looks Like

**Async job queue with polling or WebSockets:**

```
Frontend                    NestJS API                  Worker (BullMQ)
   │                           │                           │
   ├─ POST /upload ──────────▶ │                           │
   │                           ├─ enqueue job ───────────▶ │
   │  ◀── { jobId: "abc123" } ─┤                           │
   │                           │                           ├─ extract text
   │                           │                           ├─ parse structure
   ├─ GET /jobs/abc123 ──────▶ │                           ├─ check confidence
   │  ◀── { status: "parsing", │                           │
   │        step: 2/4 } ───────┤                           │
   │                           │                           ├─ LLM fallback
   ├─ GET /jobs/abc123 ──────▶ │  ◀── result ─────────────┤
   │  ◀── { status: "done",   │                           │
   │        data: {...} } ─────┤                           │
```

**Stack:** BullMQ + Redis for the job queue. The NestJS API enqueues a job and immediately returns a job ID. The frontend polls (or uses SSE/WebSocket) for progress updates. The worker processes in the background without blocking the API.

This also enables **retry logic** — if OCR fails, the job can be retried automatically without the user re-uploading.

---

## 4. Criticism: Monolithic Architecture Couples Unrelated Concerns

### The Problem

The current NestJS app handles both CRUD operations (fast, I/O-bound, database-heavy) and PDF extraction (slow, CPU-bound, external-service-heavy) in the same process. These have completely different performance profiles, scaling requirements, and failure modes.

### Why This Matters at Scale

- A spike in PDF uploads degrades CRUD API response times
- You can't scale extraction independently of CRUD
- A bug in the extraction pipeline (e.g., tesseract.js crash) takes down the entire API
- Deployment of extraction changes requires redeploying the whole backend

### What Production Looks Like

```
                        ┌─────────────────────┐
                        │   Next.js Frontend   │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   API Gateway        │
                        │   NestJS             │
                        │   Auth, routing,     │
                        │   rate limiting       │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
          ┌─────────▼────┐ ┌──────▼──────┐ ┌────▼──────────┐
          │ Property     │ │ Extraction  │ │ Document      │
          │ Service      │ │ Service     │ │ Storage       │
          │              │ │             │ │               │
          │ CRUD         │ │ PDF parsing │ │ S3 / MinIO    │
          │ Validation   │ │ OCR         │ │               │
          │ Biz logic    │ │ LLM calls   │ │ PDF archive   │
          │              │ │ Confidence  │ │ Audit trail   │
          │ Node.js      │ │ Python      │ │               │
          └──────┬───────┘ └──────┬──────┘ └───────────────┘
                 │                │
          ┌──────▼───────┐ ┌─────▼───────┐
          │ PostgreSQL   │ │ Redis       │
          │ Job queue   │
          └──────────────┘ └─────────────┘
```

Each service scales independently. The extraction service can be horizontally scaled (more workers) during batch imports. The property service stays fast and responsive regardless.

---

## 5. Criticism: The Extraction Pipeline Has No Observability

### The Problem

The cascading pipeline (regex → Gemini → Ollama) is clever, but in production you need to know: which method succeeded? How often does regex fail? What's the average confidence per method? Which documents cause fallbacks? Without metrics, you're flying blind.

### What Production Looks Like

- **Structured logging** per extraction: document hash, method attempted, method succeeded, confidence score, duration, field-level confidence breakdown
- **Metrics** (Prometheus/Grafana): extraction success rate by method, average confidence, fallback frequency, processing time percentiles
- **Alerting**: if regex success rate drops below 80%, something changed in the document format
- **A/B testing**: run two extraction methods in parallel, compare results, pick the better one

```typescript
// What logging should look like
logger.info('extraction.complete', {
  documentHash: 'sha256:abc...',
  methodsAttempted: ['regex', 'gemini'],
  methodSucceeded: 'gemini',
  confidence: 0.87,
  fieldsExtracted: 42,
  fieldsMissing: 3,
  durationMs: 2340,
});
```

---

## 6. Criticism: No Versioning or Audit Trail for Properties

### The Problem

The current model overwrites data on update. In property management, you need to know who changed what, when, and why. A property manager accidentally deletes 10 units? No way to recover. An accountant disputes a co-ownership share? No history to reference.

### What Production Looks Like

- **Soft delete** instead of hard delete (add `deletedAt` nullable timestamp)
- **Event sourcing** or at minimum an **audit log table** that records every mutation
- **Prisma middleware** that auto-logs changes:

```prisma
model AuditLog {
  id         Int      @id @default(autoincrement())
  entityType String   // "Property", "Building", "Unit"
  entityId   Int
  action     String   // "create", "update", "delete"
  changes    Json     // { field: { old: x, new: y } }
  userId     String   // who did it
  timestamp  DateTime @default(now())
}
```

---

## 7. Criticism: The Database Schema Doesn't Handle Real-World Complexity

### The Problem

The current schema is clean and works for the case study, but real property management has complexities we're ignoring:

| Missing Concern | Why It Matters |
|----------------|---------------|
| Multi-tenancy | Buena manages properties for many different owners — data isolation is critical |
| Temporal data | Co-ownership shares change over time (sales, inheritance). Current schema only stores current state |
| Document linking | The Teilungserklärung that created the property should be permanently linked to it |
| Unit hierarchy | Some units have sub-units (e.g., apartment + assigned cellar + assigned parking). Current model is flat |
| Address normalization | Same street spelled differently ("Urbanstraße" vs "Urbanstrasse" vs "Urbanstr.") creates duplicates |

### What Production Looks Like

```prisma
// Temporal co-ownership tracking
model OwnershipShare {
  id         Int      @id @default(autoincrement())
  unitId     Int
  unit       Unit     @relation(fields: [unitId], references: [id])
  share      String   // "110.0/1000"
  validFrom  DateTime
  validTo    DateTime?
  ownerId    Int
  owner      Owner    @relation(fields: [ownerId], references: [id])
}

// Document linkage
model Document {
  id          Int      @id @default(autoincrement())
  propertyId  Int
  property    Property @relation(fields: [propertyId], references: [id])
  type        String   // "teilungserklaerung", "mietvertrag", etc.
  storagePath String   // S3 key
  uploadedAt  DateTime @default(now())
  extractedAt DateTime?
}
```

---

## 8. Criticism: Frontend State Management Will Get Messy

### The Problem

Zustand is great for simple state, but the wizard state is not simple. It's a nested, multi-step form with dynamic arrays (buildings, units), cross-step dependencies (units reference buildings), validation that spans steps, and confidence metadata per field. As this grows, a flat Zustand store becomes hard to reason about.

### Signals This Will Hurt

- Adding a unit to a building that was deleted in Step 2 (stale reference)
- Undo/redo for bulk operations (user accidentally deletes 20 units)
- Syncing confidence badges when the user edits an extracted field
- Persisting wizard state across page refreshes (Zustand middleware, but with nested objects it gets fragile)

### What Production Looks Like

- **Zustand with Immer middleware** (immutable updates on nested state without the spread-operator hell)
- **Explicit actions** instead of raw set calls (e.g., `addUnit`, `removeBuilding`, `updateUnitField` that handle cross-step consistency)
- Or for maximum robustness: **XState** for the wizard flow (state machine ensures you can't get into impossible states like "Step 3 with no buildings")

---

## 9. Summary: What We Ship vs. What We Know

| Aspect | What We Ship | What We'd Build in Production |
|--------|-------------|-------------------------------|
| Architecture | NestJS monolith | Microservices (API + Extraction Worker + Storage) |
| Extraction runtime | Node.js (pdf-parse) | Python (pdfplumber + pytesseract) |
| Job processing | Synchronous (blocking request) | Async job queue (BullMQ + Redis) |
| Auth | Single shared password gate | Per-user accounts with RBAC |
| Rate limiting | Global + per-endpoint throttle ✓ | Per-user quotas + cost circuit breaker |
| Deployment | Docker + docker-compose ✓ | Kubernetes or managed container service |
| Audit trail | None | Event-sourced audit log |
| Observability | Console logs | Structured logging + Prometheus metrics |
| State management | Zustand (flat store) | Zustand + Immer or XState |
| Multi-tenancy | None (single-tenant) | Row-level security or schema-per-tenant |
| File storage | In-memory / temp files | S3/MinIO with permanent archive |
| OCR | Not implemented | Tesseract / vision model for scanned PDFs |

The case study demonstrates we can build the thing. This document demonstrates we know how to build it *right*.
