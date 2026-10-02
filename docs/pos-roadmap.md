# POS System — Delivery Roadmap

Phased build plan for the grocery POS. Each phase is shippable on its
own. Detail for every feature is in the
[Feature Specification](./pos-features.md); models are in
[Data Models](./pos-data-models.md).

The build order within a phase always follows the layering in the code
style guides: **model → validation → service → controller → route**
(backend), then **service → queryKeys → hooks → page/components**
(frontend).

---

## Phase 0 — Foundations (1 sprint)

Set up the skeleton both guides assume so every later feature drops in
cleanly.

- Backend: Express app, `config/env.js`, `config/constants.js`
  (`USER_ROLES`, payment methods, etc.), `constants/errorCodes.js`,
  `utils/apiError.js`, `utils/handleServiceError.js`, `utils/pagination.js`,
  `middlewares/` (`protect`, `authorize`, `validateRequest`,
  error handler), global `apiRateLimiter`.
- Frontend: Vite app, Tailwind wired to `colors.js`, UI kit
  (`Button`, `Input`, `Card`, `PageHeader`, `DataTable`, `Modal`,
  `EmptyState`, `LoadingState`, `confirmDialog` + host), `api.js`,
  `useApiQuery`/`useApiMutation`, `queryKeys.js`, `ROUTES`/`ROLES`,
  `MainLayout` + `POSLayout`.
- Auth module end to end (login, refresh, me) as the reference
  implementation.

**Exit:** a user can log in, land in the right layout for their role, and
the two style guides are demonstrably followed.

## Phase 1 — MVP: an offline-capable till (2–3 sprints)

The smallest thing that runs a real checkout in a store.

1. **Store & register setup** — Store, Register, terminal binding at
   login.
2. **Catalog** — Product (SKU, barcodes, sellType each/weighed, PLU,
   weight-embedded barcode parsing), per-store price/cost, tax classes.
3. **Inventory basics** — per-store Stock, StockMovement ledger, stock
   adjustments with reasons, low-stock alerts.
4. **Checkout** — scan/search, weighed items, quick keys, line/cart
   discounts (PIN-gated), tax, split/multi-tender payments, change, hold
   & recall, void (PIN-gated), receipt print/reprint.
5. **Offline engine** — IndexedDB catalog cache, sale outbox,
   `useOfflineSync` flush, `clientSaleId` idempotency, offline-safe
   receipt numbering, connectivity indicator.
6. **Cash & shifts** — CashSession open/close, pay-in/out, no-sale,
   reconciliation, X/Z reports.
7. **Core reports** — today dashboard, sales by date/cashier/tender,
   best-sellers, basic profit.
8. **Hardware (basic)** — keyboard-wedge scanner, thermal receipt print.

**Exit:** a cashier can complete sales all day, online and offline, close
their shift, and an owner can see the day's numbers.

## Phase 2 — Back-office depth & returns (2–3 sprints)

- **Staff management** (users, roles, store assignment).
- **Suppliers & purchasing** — Supplier, PurchaseOrder, GoodsReceipt →
  stock in.
- **Batch & expiry** tracking + FEFO + near-expiry reports.
- **Stock take** (count → variance → post).
- **Returns / refunds** against original sale (PIN-gated, restock).
- **Customers** master + purchase history; attach to sale.
- **Multi-pack units**, **barcode label printing**, **bag/carrier fee**.
- **Reports** — inventory valuation, low stock, wastage, tax, shift
  history.

**Exit:** the store runs its full buy-sell-count cycle and handles
returns from the back office.

## Phase 3 — Scale-up & richness (ongoing)

- **Multi-store transfers** + consolidated / per-store reporting.
- **Promotions engine** (price, %, BXGY, mix-and-match, qty break,
  member price) with offline evaluation.
- **Loyalty** points, **store credit**, **gift cards**, member pricing.
- **Audit log** across all sensitive actions.
- **Hardware** — cash drawer kick, scale integration, customer display,
  card terminal.
- **Variants / bundles**, exports (CSV/PDF), scheduled reports.

**Exit:** a multi-branch chain runs on it with loyalty, promotions, and
full auditability.

---

## Cross-cutting, every phase

- **Follow the style guides** — no feature merges without the
  route→controller→service→model layering (backend) and the
  page→hook→service data flow with required loading/empty/error states
  (frontend).
- **Test the offline path** — any feature that touches the sale must be
  verified offline as well as online.
- **Multi-store from the start** — stamp `storeId` on every operational
  record now, even while running a single store.
- **Lint clean** — `npm run lint` passes on the frontend; Prettier
  defaults on the backend.

## Suggested first build order (concrete next steps)

1. Scaffold `backend/` and `frontend/` folders per the style-guide
   directory layouts.
2. Build Phase 0 foundations + auth (the reference module).
3. Store/Register + Product catalog + per-store price.
4. Stock + movements.
5. The checkout screen (online first), then wrap it in the offline
   outbox.
6. Shifts + X/Z, then core reports.
