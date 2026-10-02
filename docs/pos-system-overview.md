# POS System — Overview & Architecture

A multi-store, offline-capable **grocery / supermarket** Point of Sale
system built on the MERN stack. This document is the entry point; the
detail lives in:

- [Feature Specification](./pos-features.md) — every module, in full.
- [Data Models](./pos-data-models.md) — MongoDB collections and fields.
- [Delivery Roadmap](./pos-roadmap.md) — phased build plan.
- Code conventions: [Backend](./backend-code-style-guide.md) ·
  [Frontend](./frontend-code-style-guide.md).

---

## 1. Product vision

A supermarket needs a till that is **fast**, **never stops** (works with
or without internet), and gives the owner **one back office** across all
branches. The system has two faces:

- **POS terminal** (`POSLayout`) — the cashier's checkout screen. Fast
  scanning, weighed items, quick keys, split payments, receipts. Must
  keep selling when the internet drops.
- **Back office** (`MainLayout`) — catalog, inventory, purchasing,
  customers, promotions, staff, and reporting for owners and managers,
  across one or many stores.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Database | MongoDB + Mongoose | `mongoose-paginate-v2` for all list endpoints (backend guide §11). |
| API | Node.js + Express (ESM) | Layered route → controller → service → model (backend guide §1). |
| Auth | JWT access + rotating refresh tokens | Roles: `ADMIN`, `MANAGER`, `CASHIER`. |
| Frontend | React + Vite | UI kit + React Query + Zustand (frontend guide). |
| Server state | React Query (`useApiQuery` / `useApiMutation`) | Never mirrored into Zustand. |
| Client state | Zustand stores | Cart, auth session, active register/store, hardware config, offline queue. |
| Styling | Tailwind, tokens from `colors.js` | No hex in components. |
| Offline | IndexedDB (via a local cache + outbox) | See §5. |

## 3. Roles & access

| Role | Can do |
|---|---|
| `CASHIER` | Operate the POS terminal, open/close their own register shift, take payments, print receipts, look up prices/stock. No pricing or catalog edits. |
| `MANAGER` | Everything a cashier can, plus catalog, inventory, purchasing, promotions, customers, per-store reports, approve returns/voids/price overrides. |
| `ADMIN` | Everything, plus multi-store setup, user management, tax/payment configuration, global reports, and system settings. |

`BACK_OFFICE_ROLES = [ADMIN, MANAGER]` gate the `MainLayout` routes.
Roles come from `USER_ROLES` in `config/constants.js` (backend) and
`ROLES` in `constants/app.js` (frontend) — never retyped inline.

## 4. Multi-store model

Built **multi-store ready** from day one, even if launched with a single
branch, to avoid a painful migration later.

- A central **Store** collection; every store has its own registers,
  stock, and staff assignments.
- **Catalog is global** (one product master). **Price and stock are
  per-store** — a product can cost differently and stock differently at
  each branch.
- `storeId` is stamped on inventory, stock movements, sales, registers,
  purchase orders, and cash sessions.
- A user is assigned to one or more stores; the POS terminal is bound to
  exactly one store + register at login.
- **Stock transfers** move quantity between stores with an auditable
  document.
- Reporting can scope to one store or roll up across all stores (Admin).

## 5. Offline-first strategy

The till must complete sales with no internet and reconcile when it
returns. This is the most architecturally sensitive part of the system.

**What is cached locally (read path)**
- Product catalog, per-store prices, tax rates, promotions, and quick
  keys are cached in IndexedDB and refreshed while online. The checkout
  screen reads from this cache, so scanning never waits on the network.

**What is queued locally (write path — the "outbox")**
- A completed sale is written to a local **outbox** in IndexedDB and the
  receipt prints immediately. A background **sync engine** flushes the
  outbox to the API when connectivity returns (surfaced through the
  `useOfflineSync` hook named in the frontend guide).

**Correctness rules**
- **Idempotency** — every sale carries a client-generated `clientSaleId`
  (UUID). The server upserts on it, so a retried sync never double-posts.
- **Offline-safe numbering** — receipt numbers are composed from a
  per-register prefix plus a local monotonic counter
  (e.g. `S02-000148`), unique without server coordination. The server
  trusts the register's number.
- **Stock is eventually consistent** — on-hand stock offline is a cached
  estimate; the server is the source of truth and applies movements in
  sync order. Oversell is possible offline and surfaced as a reconciled
  discrepancy, not a hard block.
- **Conflict handling** — sales are append-only events, so they don't
  conflict. Catalog/price edits are online-only (back office), so the
  terminal only ever *reads* stale catalog data, never writes it.

**Connectivity UX** — a persistent status indicator shows Online /
Offline / Syncing with a pending-count badge; nothing about the sale
flow changes visually between modes.

## 6. High-level architecture

```text
 ┌─────────────────────────── Frontend (React + Vite) ───────────────────────────┐
 │  POSLayout (cashier)                         MainLayout (back office)          │
 │    Checkout · Payments · Receipt               Catalog · Inventory · Reports   │
 │        │                                             │                          │
 │  Zustand: cart, register, hardware, offline outbox   React Query (server state) │
 │        │                     │                        │                          │
 │  IndexedDB cache + outbox ── useOfflineSync ──── services/ (axios, api.js) ──────┼──▶ API
 └────────────────────────────────────────────────────────────────────────────────┘
                                                          │
 ┌───────────────────────────────── Backend (Express, ESM) ───────────────────────┐
 │  routes → validateRequest(Joi) → controllers → services → Mongoose models       │
 │  auth · products · inventory · sales · purchasing · customers · promotions ·     │
 │  registers/shifts · stores · reports · settings                                  │
 └──────────────────────────────────────────────────────────────────────────────────┘
                                                          │
                                                     MongoDB
```

## 7. Non-functional requirements

- **Speed** — add-to-cart from a barcode scan must feel instant (reads
  from local cache). Checkout screen never blocks on the network.
- **Reliability** — no sale is ever lost; the outbox survives page
  reloads and crashes (persisted in IndexedDB).
- **Auditability** — every stock movement, price override, void, refund,
  and cash-drawer event is logged with actor, timestamp, and store.
- **Security** — role-gated endpoints, refresh-token rotation, sensitive
  fields `select: false`, price-override and void require manager PIN.
- **Data integrity** — money handled in integer minor units where
  practical; sale totals recomputed and verified server-side, never
  trusted from the client.
