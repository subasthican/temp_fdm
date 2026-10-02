# Feature Phases — Status Board

Phase-wise feature list for the grocery POS, with live build status.
Legend: **✅ done** · **🔜 remaining** · **❌ dropped**.

Detailed specs: [pos-features.md](./pos-features.md). Daily record:
[dev-log.md](./dev-log.md).

---

## Phase 0 — Foundations ✅

* 0.1 Backend skeleton — Express (ESM), config/constants/env, error handling, middlewares, global rate limiter
* 0.2 Auth — login, JWT + rotating refresh, roles (Admin/Manager/Cashier)
* 0.3 Frontend skeleton — UI kit, React Query hooks, Zustand, layouts, routing
* 0.4 Infra — MongoDB Atlas, seed admin, `npm run dev`

## Phase 1 — MVP: a working till

* 1.1 Stores & Registers ✅ — multi-store, per-register receipt prefix, terminal binding (store + register at login)
* 1.2 Catalog ✅
  * 1.2a Categories, Brands, Tax classes ✅
  * 1.2b Products + per-store pricing ✅ (`pricingMode` batch/product, tax optional)
  * 1.2c Barcode generation (EAN-13 / Code128) + printable labels ✅
  * 1.2d Product detail view ✅
* 1.3 Inventory ✅ — per-store stock, movement ledger, receive stock → batches (auto batch-no), adjustments, low-stock, FEFO
* 1.4 Checkout ✅ — the core
  * 1.4a Cart + scan/search + FEFO price resolution ✅
  * 1.4b Payment (split tender) + complete-sale + receipt number + stock/batch decrement + idempotency ✅
  * 1.4c Receipt printing (80mm) + reprint ✅
  * 1.4d Batch picker (scan → choose batch / MRP) ✅
  * 1.4e Cart auto-split across batches (FEFO overflow, 8 + 2) ✅
* 1.5 Offline mode 🔜 — IndexedDB catalog cache + sale outbox + sync engine + connectivity indicator (`clientSaleId` already idempotent)
* 1.6 Shifts & cash ❌ — dropped
* 1.7 Reports & Dashboard ✅ — revenue / sales / items / avg basket, tender split, best sellers, daily sales, current inventory snapshot
* 1.x Cross-cutting ✅ — deactivate vs soft delete (admin-only delete), role gating, Postman collection + environment

## Phase 2 — Back-office depth 🔜

* 2.1 Staff / user management — create users, assign roles + stores, activate/deactivate
* 2.2 Suppliers & purchasing — PO → goods receipt (creates batches, reuses `receiveStock`)
* 2.3 Batch & expiry reports — near-expiry, expired, FEFO wastage
* 2.4 Stock take — physical count → variance → post adjustments
* 2.5 Returns / refunds — against original sale, restock the batch, PIN-gated
* 2.6 Customers + purchase history (attach to sale)
* 2.7 Multi-pack units, bag / carrier fee
* 2.8 Reports — inventory valuation, tax, wastage

## Phase 3 — Scale-up 🔜

* 3.1 Multi-store stock transfers + consolidated reporting
* 3.2 Promotions — price, %, buy-X-get-Y, mix-and-match, qty break, member price
* 3.3 Loyalty points, store credit, gift cards
* 3.4 Audit log (all sensitive actions)
* 3.5 Hardware — cash drawer, weighing scale, customer display, card terminal
* 3.6 Variants / bundles, exports (CSV / PDF), scheduled reports

---

## Status summary

| Phase | State |
|---|---|
| Phase 0 — Foundations | ✅ complete |
| Phase 1 — MVP till | ✅ mostly (only **1.5 offline** left; 1.6 dropped) |
| Phase 2 — Back-office depth | 🔜 not started |
| Phase 3 — Scale-up | 🔜 not started |

**Next candidates:** 1.5 Offline · Phase 2 (Returns, Purchasing, Staff).
