# Development Log

Daily record of what was built, decided, and changed. Newest entry
first. Format: **Done / Decisions / Verified / Next**.

---

## 2026-07-08 (cont.)

### Decision — barcode generation + printable labels (Phase 1.2c)
- **Two barcode kinds:** manufacturer codes are stored/scanned (not
  generated); store-generated codes are for items with no printed
  barcode (loose/repacked/in-house).
- **Symbology — both, chosen per product:** in-store **EAN-13**
  (prefix + checksum, retail-standard) or **Code128** (encodes SKU).
- **Price on label** (respects batch-MRP model): PRODUCT-priced items
  print the **per-store sell price**; BATCH-priced items print
  barcode-only for now — real price+MRP labels come with the
  batch-receiving flow (1.3).
- **How:** barcode value minted/assigned on the backend into
  `product.barcodes[]`; rendering + printable label sheet done
  client-side (jsbarcode → SVG + print-only CSS). Barcode-label printing
  thereby moves from P2 into Phase 1.2c.

### Done — Staff / user management (Phase 2.1)
- **Backend**: `isDeleted` added to User (excluded from login, refresh,
  and `protect`). `userService`: createUser (hash via helper, username
  unique, validate stores exist), getUsers (list, exclude password/
  refreshToken + isDeleted, populate stores), getUserById, updateUser
  (whitelist fullName/role/email/phone/stores/isActive; guard
  self-deactivate), resetPassword (hash + clear refreshToken),
  softDeleteUser (guard self-delete + last-active-admin). `shapeUser`
  helper (never leaks password/refreshToken). Validations, controller,
  routes — **admin only**, registered in index.js.
- **Frontend**: `userService`; **UsersPage** (admin) — list w/ search +
  role filter, `UserFormModal` (username/password on create, fullName,
  role, store multi-select chips, email/phone), `ResetPasswordModal`,
  Dropdown actions (Edit, Reset password, Activate/Deactivate, Delete)
  with self-account guards. Route + nav (admin only).

### Verified
- API lifecycle: create (with store) → login → deactivate (login
  blocked) → reset password (login w/ new pw) → soft delete (gone from
  list, cannot login); self-delete + last-admin guards fire; store
  assignment persists + populates (Main Branch/MB).
- UI: Staff page lists users with roles/stores/status; created
  "cashier02" via the modal (confirmed in API list). Lint clean; no
  console errors; servers killed after.
- Note: the DB had been reset (stores/products cleared) — re-created a
  Main Branch store during testing; unrelated to this module.

### Done — inventory snapshot on dashboard
- Added a **current stock** block to the dashboard: total units, stock
  value (qty × per-store cost), low-stock count (≤ reorder level), and
  SKU count. Computed in `reportService` via a `Stock` aggregation with
  `$lookup` to ProductStorePrice (cost/reorder) + Products (excludes
  soft-deleted). Snapshot is store-scoped but **not** date-ranged.
- Frontend: "Current inventory" tiles row on DashboardPage.

### Verified
- API: `stock` = { totalUnits 282, stockValue 18,040, lowStock 1, skus 3 }.
  UI: inventory tiles render alongside sales stats; no console errors;
  lint clean; servers killed after.

### Done — Reports & Dashboard (Phase 1.7)
- **Backend**: `reportService.getDashboard({storeId?, from?, to?})` — one
  `$facet` aggregation over completed sales returns summary (revenue,
  salesCount, itemsSold, avg basket), tender split, top products (qty +
  revenue), and daily sales series. Validation, controller,
  `POST /api/reports/dashboard` (admin+manager), registered in index.js.
  - **Fix**: cash tender nets `changeGiven` so tender totals reflect money
    kept, not money handled (cash 15,575 → 10,325 = revenue).
- **Frontend**: `reportService` + query keys; rebuilt **DashboardPage** —
  store + date-range (Today/7d/30d/All) filters, stat tiles, payment-method
  split, best-sellers table, daily sales bars. Theme-token styled.

### Verified
- API: dashboard returns revenue 10,325 / 10 sales / 84 items / avg
  1,032.50; cash tender = revenue after change fix; best-sellers ranked.
- UI: dashboard renders all blocks with live data (screenshot), no console
  errors. Lint clean; servers killed after.

### Done — deactivate vs soft delete (two distinct concepts)
- Split the single "deactivate" into two:
  - **Deactivate** (`isActive:false`) — reversible enable/disable, via
    `PATCH /:id {isActive}`. Admin + manager.
  - **Soft delete** (`isDeleted:true`) — hidden from all lists, checkout
    lookup and ref-assignment, row retained. `DELETE /:id`, admin only.
- **Backend**: added `isDeleted` to Product/Category/Brand/TaxClass;
  every list query excludes `isDeleted`; product lookup + `assertRefsExist`
  exclude deleted; renamed `deactivateX` service/controller → `softDeleteX`
  (sets isDeleted). Followed style guide (whitelisted updates, envelopes).
- **Frontend**: services `deactivateX` → `softDeleteX`; each catalog
  dropdown now has **Activate/Deactivate** (admin+manager, via updateX)
  + **Delete** (admin only, confirmDialog). Applied to Products,
  Categories/Brands/TaxClasses panels.

### Verified
- API: deactivate (PATCH isActive:false) → stays in list, inactive;
  soft delete (DELETE) → "…deleted", vanishes from list. UI: admin sees
  Edit/Deactivate/Delete; Deactivate fired `PATCH …/brands/… → 200` +
  list refetch (network-confirmed). Lint clean; servers killed after.

### Done — soft delete is admin-only (catalog)
- All catalog resources already soft-delete (deactivate → isActive=false).
  Restricted the DELETE (deactivate) routes to **ADMIN only** for
  products, categories, brands, tax classes (`authorize(USER_ROLES.ADMIN)`).
  Managers keep create/edit; stores/registers were already admin-only.
- Frontend: the "Deactivate" action in the Dropdown is now gated on
  `isAdmin` (via useAuthStore + ROLES) in ProductsPage, Categories/
  Brands/TaxClasses panels — hidden for managers so they don't hit a 403.

### Verified
- Created a `manager` test user. Manager deactivate brand → **403**,
  category → **403**; manager create brand → **201** (still allowed);
  admin deactivate → **200**. Frontend lint clean; routes syntax OK.

### Done — auto-generate batch numbers
- Receiving stock with no batch no now auto-generates a readable one:
  `<SKU>-B<seq>` (e.g. `SUG1KG-B004`), sequence = per-product batch count
  + 1. An explicit supplier/lot number is still kept when provided.
- Style guide followed: `helpers/inventory/generateBatchNo.js` (one
  helper/file §8), `BATCH_CONFIG` in `config/constants.js` (no magic
  values §9). `assertProductAndStore` now returns `{ product, store }`
  so `receiveStock` reuses the product (no extra query).
- Frontend: batch-no field now hints "Leave blank to auto-generate".

### Verified
- No batchNo → `SUG1KG-B004`; next → `SUG1KG-B005`; explicit `LOT-XYZ`
  kept. Syntax-checked; behaviour confirmed via curl.

### Refactor — extract inline service helpers (style guide §8)
- Moved every module-level helper out of the services into
  `helpers/<domain>/`, one function per file:
  - `helpers/products/`: `shapeProduct`, `assertUniqueSkuAndBarcodes`,
    `assertRefsExist`
  - `helpers/inventory/`: `applyStockDelta`, `assertProductAndStore`
  - `helpers/sales/`: `shapeSale`
- Services now import them; unused model imports (Category/Brand/
  TaxClass in productService, Product/Store in inventoryService) removed.
- Behaviour unchanged — verified via curl: product list (shapeProduct),
  stock list, sale lookup, and duplicate-SKU 409 all identical.

### Done — Receipt printing (Phase 1.4c)
- **Backend**: `getSaleById` enriched into a full receipt payload —
  populates store (name/address/phone/receipt header+footer), register
  (code), cashier (fullName), plus lines, totals, payments, change.
- **Frontend**: `Receipt.jsx` (80mm thermal-style: store header, receipt
  no, date, register, cashier, line items w/ batch, totals, payment,
  change, footer); `ReceiptModal` fetches getSaleById, previews and
  prints via print-only CSS (`.print-receipt`). "Receipt" button added to
  the PaymentModal success view (also the reprint path via getSaleById).
- Checkout (Phase 1.4) is now complete: scan → FEFO/batch pricing →
  auto-split → payment → sale → **printable receipt**.

### Verified
- API: getSaleById returns store/register/cashier + lines/totals/change.
- UI: sold Milk 1L → **S01-000008** → Receipt button → receipt rendered
  with Main Branch header, address, receipt no, date, REG01, cashier,
  line item, Subtotal/Total Rs.95, Cash Rs.95, "Thank you!" footer. Lint
  clean; no console errors.

### Next
- **Phase 1.5** offline (IndexedDB outbox around completeSale;
  clientSaleId already idempotent) — or **1.6** cash management & shifts.

### Done — Cart auto-split across batches (FEFO overflow)
- **Scenario** (user's): Batch A has 8, Batch B has 50; customer buys 10
  → the till must auto-charge 8 @ A's MRP + 2 @ B's MRP, no manual math.
- **Cart** (`useCartStore`) reworked: keeps `batchInfo` per product;
  `addUnits` allocates FEFO with rollover; `setLineQuantity` rolls
  overflow beyond a batch into the next FEFO batch(es); everything caps
  at total available stock (out-of-stock → toast, never silent oversell);
  `changeLineBatch` lets a line's batch be overridden.
- **POSPage**: batch items auto-allocate on scan/add (no prompt); each
  line has an editable **quantity input** (typing 10 triggers the split)
  and a **"change" batch** override (reuses BatchPickerModal). Product-
  priced items stay a single line.
- Default is now auto-FEFO-split; the standalone pick-on-add prompt from
  the previous step is replaced by the per-line override (kept the
  capability, smoother default).

### Verified
- Test product: Batch A 8 @ Rs.100, Batch B 50 @ Rs.105. UI: scan → type
  qty **10** → split into **8 × 100 (A) + 2 × 105 (B)** = Rs. 1,010 →
  completed **S01-000005** → **Batch A 8→0, Batch B 50→48**, on-hand
  58→48. Lint clean; no console errors.

### Done — Scan + select batch price at checkout
- **Decision** (user's): rather than pure FEFO auto-pricing or per-item
  batch labels, the cashier **scans the product barcode then picks the
  batch/price** — matches the pack's printed MRP, no relabelling.
- **Backend**: `saleService.lookupItem` now returns **all in-stock
  batches** (FEFO order) for batch-priced products — each with
  id/batchNo/expiry/sellPrice/available — plus a default unitPrice.
- **Frontend**: `BatchPickerModal` + POS resolve logic that prompts
  **only when there's a real choice**:
  - product-priced, single batch, or multiple batches at one price →
    add straight away (FEFO), no prompt;
  - multiple batches at **different** MRPs → show the picker
    (FEFO highlighted) and add the chosen batch's price.
- Backend `completeSale` already records the chosen `batchId`, so no
  change was needed there.

### Verified
- Lookup returns 3 Sugar batches (110/115/510). UI: scan Sugar → picker
  appeared → chose the **non-FEFO Rs. 115** batch → cart line priced 115,
  tagged B-2026-08 → completed **S01-000004** at 115 → **batch B-2026-08
  decremented 50→49**, FEFO batch B-2026-07 untouched at 95. Lint clean;
  no console errors.

### Done — Payment + complete-sale (Phase 1.4b)
- **Backend**: `Sale` model (embedded snapshotted lines + payments,
  totals, changeGiven, `source`), `clientSaleId` unique + `receiptNo`
  unique; `receiptCounter` on Register (atomic `$inc`); `formatReceiptNo`
  helper (`S01-000001`). `saleService.completeSale`:
  - **Idempotent** on `clientSaleId` (replay returns the original sale).
  - **Authoritative pricing** — re-resolves each line's price from its
    named batch / per-store price; never trusts client amounts.
  - Decrements batch + store stock, writes SALE ledger movements,
    validates payments cover the total, computes change. Atomic
    per-register receipt number. `getSaleById` for reprint.
  - `SALE_STATUS` / `SALE_SOURCE` / `RECEIPT_CONFIG` constants;
    validation, controller, routes (`POST /api/sales`, `GET /:id`).
- **Frontend**: `saleService.completeSale/getSaleById`; **PaymentModal**
  (split tenders cash/card/wallet, paid/remaining/change, `crypto.randomUUID`
  clientSaleId, success view with receipt no + change). Charge button in
  POSPage opens it; on completion the cart clears and refocuses the scanner.

### Verified
- API: sale of 3× Sugar @110 = 330, cash 500 → receipt **S01-000001**,
  change 170; stock 140→137; batch decremented; SALE movement logged.
  **Idempotency replay** of the same clientSaleId returned the same
  receipt with no double-post (stock stayed 137).
- UI: scanned 2× Sugar (220) → Charge → cash 500 → change **280** →
  **S01-000002** success view → New sale cleared the cart; stock 137→135;
  both SALE movements in the ledger. Lint clean; no console errors.

### Next
- **Phase 1.4c** — receipt printing (thermal-style layout, reprint from
  getSaleById) — then **Phase 1.5** offline (wrap completeSale in the
  IndexedDB outbox; clientSaleId already makes it safe).

### Done — Checkout cart + FEFO pricing (Phase 1.4a)
- **Backend**: `saleService.lookupItem({ storeId, barcode|productId })`
  resolves a scanned/searched item into a sellable line — PRODUCT-priced
  from `ProductStorePrice`, BATCH-priced from the **FEFO batch**
  (earliest expiry with stock) returning its MRP + batchId + available
  qty, plus on-hand. Validation (`.or(barcode, productId)`), controller,
  `POST /api/sales/lookup`, registered in `routes/index.js`.
- **Frontend**: `useCartStore` (Zustand — lines keyed by product+batch so
  batch items at different MRPs stay separate; add/inc/dec/remove/clear +
  totals); `saleService.lookupItem`; rebuilt **POSPage** checkout — scan
  box (autofocus, Enter to add), "add by name" search, cart lines
  (name, price, batch/expiry, qty ±, line total, remove), totals panel,
  and a Charge button placeholder (payment = 1.4b). Uses register binding.

### Verified
- API: batch item → FEFO batch B-2026-07 @ MRP 110; product item →
  per-store 95; unknown barcode → 404.
- UI (bound to Main Branch/REG01): scanned Sugar → line at Rs. 110 with
  batch B-2026-07/exp shown; re-scan merged to qty 2 (Rs. 220); added
  Milk by name at Rs. 95 → total Rs. 315; decrement → 205; remove →
  110. Lint clean; no console errors.

### Next
- **Phase 1.4b** — payment (cash/card/split + change) and complete-sale:
  Sale model, authoritative batch/stock decrement, receipt number
  (register prefix + counter), SALE movement; designed offline-ready
  (clientSaleId) for 1.5.

### Done — Inventory basics (Phase 1.3)
- **Backend**: `Stock` (per product+store, unique), `Batch`
  (batchNo/expiry/cost/**sellPrice MRP**/qty, FEFO-indexed),
  `StockMovement` (append-only ledger) models; `MOVEMENT_TYPES` +
  `ADJUSTMENT_REASONS` constants. `inventoryService`:
  - **`receiveStock`** — the single stock-in path (create batch → bump
    Stock → log movement); goods-receipt (P2) will reuse it.
  - `adjustStock` (signed delta + reason, optional batch), `getStock`
    (per-store, low-stock flag from reorder level), `getBatches` (FEFO),
    `getMovements` (ledger). Validations, controller, routes in
    `routes/index.js` (`/api/inventory/*`).
- **Frontend**: `inventoryService` + query keys; **InventoryPage**
  (store selector, search, low-stock highlight, Receive + Adjust);
  `ReceiveStockModal` (product/store/batch/expiry/qty/cost/MRP),
  `AdjustStockModal` (add/remove + reason). Product detail gains a
  **Batches-in-stock** card (FEFO). Route + nav.

### Verified
- API: received two batches of Sugar 1kg (100 @MRP110, 50 @MRP115) →
  on-hand 150; adjust −8 (damage) → 142; stock list low-stock flag;
  batches in FEFO order; movement ledger attributes each change.
- UI: Inventory page shows Sugar 1kg 142; adjusted −2 in the modal →
  140 with list refresh; product detail Batches card lists both batches
  FEFO with MRP. Lint clean; no console errors.
- **Batch-priced products are now stocked & priced** (Sugar has 2
  batches at different MRPs) — ready to sell once checkout (1.4) exists.

### Next
- **Phase 1.4** — the checkout screen: scan → FEFO batch price → cart →
  payment → receipt, decrementing stock/batches.

### Done — Product detail view
- **ProductDetailPage** at `/products/:id` (Admin/Manager): back link,
  header with Edit / Pricing / Barcode actions, a details grid (image,
  category, brand, tax, pricing mode, sell type, base unit, age
  restricted, status), a Barcodes card rendering every barcode as SVG,
  and a per-store pricing table. Reuses the edit/pricing/barcode modals.
- **ProductsPage**: rows now navigate to the detail view on click;
  action buttons `stopPropagation` so they open their modal without
  navigating.

### Verified
- Clicked "Sugar 1kg" row → detail page shows all fields, 4 barcodes
  rendered, price table (Main Branch 95/110/20); action buttons on the
  list open modals without navigating. Lint clean; no console errors.

### Done — Barcode generation + printable labels (Phase 1.2c)
- **Backend**: `BARCODE_FORMATS` / `BARCODE_CONFIG` constants;
  `helpers/barcode/generateEan13.js` (in-store prefix + valid EAN-13
  checksum); `POST /api/products/:id/barcode { format }` mints an EAN-13
  or assigns the SKU as Code128 into `product.barcodes[]`, with
  cross-catalog uniqueness. Validation + service section + controller +
  route.
- **Frontend**: `jsbarcode` dependency; `Barcode.jsx` (renders value as
  SVG, auto-detects EAN-13 vs Code128); `BarcodeModal` in Products —
  generate (choose format), pick a barcode, choose store for price,
  quantity, live label preview, and a print-only label sheet
  (`@media print` isolates `.print-labels`). Barcode action wired into
  the Products table.
- **Price on label** honours the batch-MRP model: PRODUCT-priced items
  print the selected store's sell price; BATCH-priced items print
  barcode-only with a note.

### Verified
- API: EAN-13 minted with valid checksum (`2058867544333`), Code128
  from SKU, bad format → 400, cross-product barcode uniqueness.
- UI: generated barcodes on "Sugar 1kg" (batch → barcode-only + note)
  and confirmed "Milk 1L" (product → label shows "Rs. 95.00"); print
  sheet renders 12 labels each with name + barcode SVG + price. Lint
  clean; no console errors.
- **Bug fixed mid-verify:** `productService.getProductById` returned the
  envelope's `{ product }` wrapper; modals read `.barcodes`/`.prices`
  one level too shallow. Now returns the product directly — also fixes
  the pricing modal pre-fill.

### Next
- **Phase 1.3** — Inventory: Stock, StockMovement, and the shared
  `receiveStock` (batch entry) that makes BATCH items sellable.

### Done — Products + per-store pricing (Phase 1.2b)
- **Backend**: `PRICING_MODES` constant (`batch` | `product`); `Product`
  model (sku unique, `barcodes[]` indexed, category/brand/taxClass
  optional refs, `sellType`, `pricingMode`, nullable tax) +
  `ProductStorePrice` model (unique product+store). Validations,
  `productService` (SKU + barcode uniqueness across catalog, ref-exists
  checks, per-store price upsert via findOneAndUpdate), controller,
  routes registered in `routes/index.js`.
  - Endpoints: `POST /products`, `POST /products/list`,
    `GET /products/:id` (incl. prices), `PATCH /products/:id`,
    `DELETE /products/:id` (soft), `POST /products/:id/prices` (upsert).
    Writes Admin+Manager; lists all roles.
- **Frontend**: `productService` + query keys; **ProductsPage** (search
  by name/SKU/barcode, category + brand filters, DataTable with
  pricing-mode badge), `ProductFormModal` (all fields incl. pricingMode
  + optional tax with Exempt default), `ProductPricesModal` (per-store
  cost / sell / reorder upsert, batch-pricing note). Route + nav.

### Verified
- API: create product, duplicate barcode → 409, per-store price upsert,
  product-with-prices (store populated, tax null = exempt).
- UI: Products page renders seeded "Sugar 1kg" (Batch MRP badge);
  created "Milk 1L" via modal → list refreshed; set its Main Branch
  price (cost 80 / sell 95 / reorder 30) in the pricing modal →
  confirmed persisted via API. Lint clean; no console errors.

### Next
- **Phase 1.3** — Inventory basics: per-store Stock, StockMovement
  ledger, and the shared `receiveStock` service (batch entry) that
  goods-receipt will reuse in Phase 2.

### Done — Catalog masters (Phase 1.2a)
- **Backend**: `Category` (self-parent, nullable), `Brand`, `TaxClass`
  (rate %, inclusive default) — schema-only models, validations,
  services (envelope, whitelisted updates, soft-deactivate), controllers,
  routes registered in `routes/index.js`.
  - Endpoints per master: `POST /`, `POST /list`, `PATCH /:id`,
    `DELETE /:id` (soft). Writes Admin+Manager; lists all roles.
  - Category guards: parent-exists check, no self-parent.
- **Frontend**: `categoryService` / `brandService` / `taxClassService`
  + query keys; **CatalogPage** — one tabbed area (Categories / Brands /
  Tax classes), each a CRUD panel (list, create/edit modal, deactivate
  via confirmDialog) reusing the StoresPage pattern. Nav item added
  (Admin+Manager).

### Verified
- API: create category/brand/tax-class, list, validation (missing rate
  → 400).
- UI: Catalog page, all three tabs render seeded data; created "Nestlé"
  brand through the modal → toast + list refreshed; lint clean; no
  console errors.

### Decision — tax is an optional product field
- Tax is **not added at the till** (MRP is tax-inclusive). The TaxClass
  master stays, but `Product.taxClassId` is **nullable**, defaulting to
  an **"Exempt (0%)"** class.
- A set class only drives the **receipt tax breakdown / reports**
  (reverse-calculated from the gross MRP); unset = exempt, no tax line.
- Seed one "Exempt (0%)" tax class as the default.

### Next
- **Phase 1.2b** — Product model (`pricingMode`, nullable `taxClassId`)
  + per-store price.

---

## 2026-07-08

### Design decision — batch-wise MRP pricing
- Chose **batch-wise MRP**: for MRP-printed packaged goods, the sell
  price lives on the **batch**, not the product. Reflects Rs. /
  printed-MRP markets where MRP changes between batches.
- Products gain `pricingMode` (`BATCH | PRODUCT`):
  - `BATCH` — price from FEFO batch's MRP; can't sell without a batch.
  - `PRODUCT` — loose/weighed items keep one per-store price.
- **Consequence:** batch tracking moves from Phase 2 into **Phase 1**
  (checkout can't price BATCH items without batches). MVP will create
  batches via a simplified stock-in until purchasing (P2) lands.
- Checkout rules recorded: FEFO auto-select + manual override; a
  quantity spanning batches **splits into separate priced lines**; sale
  lines snapshot `batchId` + price used (for exact receipts/returns).
- Docs updated: `pos-data-models.md` (Product, ProductStorePrice,
  Batch, SaleLine), `pos-features.md` (§4 inventory, §5 checkout).

### Done
- **Store & Register module (Phase 1.1)** — complete, end to end:
  - Backend: `Store` + `Register` models (schema-only), Joi validations,
    services, controllers, routes registered in `routes/index.js`.
  - Unique store `code`; globally unique register `receiptPrefix`
    (seeds offline receipt numbering); compound unique (store, code).
  - Writes admin-only; list endpoints open to all roles (cashiers need
    them to bind a terminal). Soft-deactivate only — no hard deletes.
  - Frontend: `storeService` / `registerService`, query-key factories,
    **StoresPage** (the reference CRUD page: debounced search, DataTable,
    create/edit modal, registers-per-store modal, confirmDialog).
  - **Terminal binding**: `useRegisterStore` (persisted), register-select
    screen, `/pos` redirects when unbound, binding shown in POS header
    ("Main Branch · REG01", click to switch).
- Login page visual redesign (brand panel, password input component).
- Root `package.json` scripts — `npm run dev` runs API + web together
  (concurrently); `dev:backend` / `dev:frontend` individually.
- Switched database to **MongoDB Atlas** (`POS` db on `possystem`
  cluster); admin re-seeded.
- Pushed feature branch `dev/prritheeve/Store-&-Register` (commit
  `94ee360`).

### Decisions
- **Route registry rule** — every route module mounts in
  `routes/index.js`, never in `app.js` (style guide §3 updated).
- **Lean models rule** — models are schema-only; password hashing moved
  from a `pre("save")` hook to explicit service calls via
  `helpers/auth/hashPassword.js` / `comparePassword.js`, salt rounds in
  `AUTH_CONFIG` (style guide §6–§7 updated).
- **Workflow rule** — no git commit/push without explicit permission.
- Batch/expiry stock tracking stays in Phase 2 (Phase 1 = simple
  quantity per product per store).

### Verified
- API: store/register CRUD, duplicate receipt-prefix → 409, role gates.
- UI walkthrough: login → Stores page → registers modal → POS binding
  flow; lint clean; no console errors.

### Known issues / follow-ups
- ⚠️ `backend/.env` (Atlas credentials + JWT secrets) is committed on
  the public repo — rotation + untracking pending user decision.
- Feature branch not yet merged to `main`.

---

## 2026-07-07

### Done
- **Documentation set** (`docs/`): system overview, feature
  specification (MVP/P2/P3 tagged), data models (~25 collections),
  delivery roadmap, backend + frontend code style guides.
- **Phase 0 scaffold — backend**: Express ESM app; config
  (`env.js`, `constants.js`), error codes, `ApiError` +
  `handleServiceError` + pagination utils; middlewares (`protect`,
  `authorize`, `validateRequest`, error handler, global rate limiter);
  **auth module** as the reference implementation (login, rotating
  refresh tokens, logout, profile, change password); admin seed script.
- **Phase 0 scaffold — frontend**: Vite + React; Tailwind wired to
  `colors.js`; 15-component UI kit; `useApiQuery` / `useApiMutation`;
  axios instance with transparent 401 → refresh → retry; Zustand auth
  store; `MainLayout` (role-filtered sidebar) + `POSLayout`; login /
  dashboard / POS placeholder pages.
- Repo initialized, initial commit + push to
  `github.com/thisidnotforsale/temp`.

### Decisions
- Scope: grocery/supermarket vertical, full system, online + offline,
  multi-store ready from day one.
- Offline strategy: IndexedDB catalog cache + sale outbox,
  `clientSaleId` idempotency, per-register receipt prefixes; catalog
  edits online-only; stock eventually consistent offline.
- List endpoints: `POST /<resource>/list` with body criteria +
  mongoose-paginate-v2.

### Verified
- Backend booted against local MongoDB, then Atlas; login/refresh/me
  flows via curl; frontend login → dashboard in real browser; lint +
  production build clean.

---
