# POS System — Feature Specification

Full feature set for the multi-store, offline-capable grocery /
supermarket POS. Read alongside the
[System Overview](./pos-system-overview.md) and
[Data Models](./pos-data-models.md). Phasing is in the
[Roadmap](./pos-roadmap.md); every "must / should / later" tag below maps
to a phase there.

Legend: **[MVP]** ship first · **[P2]** phase two · **[P3]** phase three.

---

## 1. Authentication & staff

- **[MVP]** Username + password login, JWT access + rotating refresh
  token (per backend guide §6).
- **[MVP]** Roles `ADMIN` / `MANAGER` / `CASHIER` with route-level
  authorization.
- **[MVP]** Cashier **PIN unlock** — a fast numeric PIN to resume a
  locked terminal without a full re-login between customers.
- **[MVP]** Manager **override PIN** — required to approve price
  overrides, voids, refunds, and no-sale drawer opens.
- **[P2]** Staff management (create/disable users, assign roles, assign
  to stores).
- **[P3]** Audit log of every sensitive action (who, what, when, store).

## 2. Store & terminal setup (multi-store)

- **[MVP]** Store master (name, code, address, tax profile, receipt
  header/footer, currency).
- **[MVP]** Register/terminal master per store (register code → receipt
  prefix for offline-safe numbering).
- **[MVP]** Terminal binds to one **store + register** at login; this
  scopes all sales, stock, and cash sessions.
- **[P3]** Store-to-store **stock transfers** with an auditable transfer
  document (send → receive → stock adjusts on both sides).
- **[P3]** Consolidated multi-store reporting and per-store drill-down.

## 3. Product catalog

- **[MVP]** Product master: name, **SKU**, **barcode(s)** (multiple
  barcodes per product), category, brand, image, unit of measure,
  tax class, active flag.
- **[MVP]** **Per-store pricing** — sell price and cost tracked per
  store; global default with per-store overrides.
- **[MVP]** **Sell by unit vs by weight** — flag products as *each* or
  *weighed* (price-per-kg). Weighed items compute line price from weight.
- **[MVP]** **Weight-embedded barcodes** — parse scale-printed EAN-13
  labels that encode PLU + weight (or price) so produce/deli scans
  resolve to the right product and amount automatically.
- **[MVP]** **PLU / quick codes** for non-barcoded produce.
- **[P2]** Categories & brands management, category tree.
- **[P2]** **Multi-pack / units** — sell the same item as each, pack,
  or case with a unit conversion factor.
- **[P2]** **Barcode label printing** (shelf and item labels).
- **[P3]** Product variants (size/flavour) and bundles/combos.
- **[P3]** Age-restricted flag (prompts cashier for age verification,
  e.g. alcohol).

## 4. Inventory & stock

- **[MVP]** Per-store **stock on hand** per product.
- **[MVP]** **Stock adjustments** (damage, wastage, count correction)
  with reason codes — every change is a logged movement.
- **[MVP]** **Low-stock / reorder alerts** (per-store reorder level).
- **[MVP]** Automatic stock decrement on sale, increment on return.
- **[MVP]** **Batch tracking with batch-wise MRP** — for `BATCH`-priced
  (MRP-printed) products, each batch carries its own `cost`, `expiryDate`
  and **`sellPrice` (MRP)**. Billing resolves price + stock from the
  **FEFO** batch (earliest expiry first). Promoted to MVP because the
  sell price *comes from* the batch — checkout cannot price these items
  without it. `PRODUCT`-priced items (loose/weighed) keep a single
  per-store price and don't need batches to sell.
- **[P2]** Near-expiry / expired reports and FEFO wastage tracking.
- **[P2]** Goods received from purchase orders creates batches and
  increments stock (§6). *(In MVP, batches are created via a simplified
  stock-in / opening-stock entry until purchasing lands.)*
- **[P2]** **Stock take / physical count** workflow (freeze, count,
  variance report, post adjustments).
- **[P3]** Stock transfers between stores (§2).
- **[P3]** Full stock **movement ledger** (every in/out with source
  document) per store.

## 5. The checkout / sale (POS terminal) — the core

- **[MVP]** **Scan or search** to add items; quantity edit; weighed
  items accept weight (keyed or from an integrated scale).
- **[MVP]** **Quick keys** grid for common non-barcoded items (produce,
  bakery).
- **[MVP]** **Batch-wise pricing at the till** — for `BATCH`-priced
  products, the scan auto-selects the FEFO batch and rings up its MRP;
  the cashier can override the batch. A quantity spanning multiple
  batches **splits into separate priced lines**. Each line snapshots the
  batch + price used.
- **[MVP]** **Line and cart discounts** (amount or %), manager-PIN gated
  above a threshold.
- **[MVP]** **Tax** applied per tax class (inclusive/exclusive per store
  profile).
- **[MVP]** **Split & multi-tender payments** — cash, card, wallet/QR;
  compute **change** for cash; part-cash-part-card.
- **[MVP]** **Hold / park & recall** a sale (serve the next customer,
  resume later).
- **[MVP]** **Void line / void sale** (manager-PIN gated), with reason.
- **[MVP]** **Receipt** — print (thermal), reprint, and optional
  email/no-print.
- **[MVP]** **Fully offline-capable** — completes and prints from local
  cache + outbox with no internet (see overview §5).
- **[P2]** **Returns / refunds** — lookup original sale, select lines,
  refund to original tender, restock (manager-PIN gated).
- **[P2]** **Bag / carrier charge** and other configurable sale-level
  fees.
- **[P2]** Attach a **customer / loyalty** account to the sale.
- **[P3]** Suspend to loyalty account, layaway, and price checker mode.
- **[P3]** Customer-facing display / second screen.

## 6. Purchasing & suppliers

- **[P2]** Supplier master (per backend/frontend suppliers reference
  implementation).
- **[P2]** **Purchase orders** — draft → send → receive.
- **[P2]** **Goods receipt** against a PO updates cost and increments
  per-store stock (and batch/expiry where tracked).
- **[P2]** Supplier returns / debit notes.
- **[P3]** Purchase reporting, supplier price history, reorder
  suggestions from reorder levels.

## 7. Customers & loyalty

- **[P2]** Customer master (name, phone, email, optional address).
- **[P2]** Purchase history per customer.
- **[P3]** **Loyalty points** — earn on spend, redeem as tender.
- **[P3]** **Store credit / wallet** and gift cards.
- **[P3]** **Member pricing** — special prices for loyalty members
  (ties into promotions §8).

## 8. Promotions & pricing

- **[P3]** Time-boxed **promotional prices** (markdowns).
- **[P3]** **Buy-X-get-Y** and **mix-and-match** ("3 for Rs. 500").
- **[P3]** **Quantity break** pricing.
- **[P3]** **Member-only** prices and coupons.
- Promotions are evaluated on the cart; results are cached locally so
  they still apply offline.

## 9. Cash management & shifts

- **[MVP]** **Register shift / session** — open with a starting float,
  close with a counted amount.
- **[MVP]** **Cash movements** — pay-in / pay-out (petty cash) and
  **no-sale** drawer open (manager-PIN gated), each logged with reason.
- **[MVP]** **Shift reconciliation** — expected vs counted per tender,
  variance recorded.
- **[MVP]** **X report** (mid-shift snapshot) and **Z report**
  (end-of-shift close-out).
- **[P2]** End-of-day store banking / cash-up across registers.

## 10. Reporting & dashboard

- **[MVP]** Dashboard: today's sales, transaction count, average basket,
  by-tender split (scoped to the cashier's store).
- **[MVP]** **Sales reports** — by date range, by store, by cashier, by
  register, by payment method.
- **[MVP]** **Product sales / best-sellers** and **category sales**.
- **[MVP]** **Profit** report (sell price − cost).
- **[P2]** **Inventory reports** — stock valuation, low stock, wastage,
  near-expiry.
- **[P2]** **Z-report / shift history** and cash variance report.
- **[P2]** **Tax report** for filing.
- **[P3]** Multi-store consolidated dashboards, exports (CSV/PDF),
  scheduled reports.

## 11. Hardware integration

- **[MVP]** **Barcode scanner** — works as keyboard-wedge input into the
  checkout screen (no special driver needed).
- **[MVP]** **Thermal receipt printer** — print via browser print or a
  local print bridge; receipt template configurable per store.
- **[P3]** **Cash drawer** — kick open on cash payment / no-sale (via the
  receipt printer's drawer port).
- **[P3]** **Weighing scale** integration for weighed items.
- **[P3]** **Customer display** and **card terminal** integration.
- Hardware config is a Zustand store (per frontend guide §9); the app
  degrades gracefully when a device is absent.

## 12. Settings & configuration

- **[MVP]** Tax classes & rates, currency, rounding rules.
- **[MVP]** Receipt template (header, footer, logo) per store.
- **[MVP]** Payment methods enabled per store.
- **[P2]** Reason-code lists (void, refund, adjustment, wastage).
- **[P3]** Feature toggles (loyalty, promotions, batch tracking) per
  store.

---

## Feature-to-phase summary

| Phase | Theme | Modules |
|---|---|---|
| **MVP** | A working, offline-capable single-till checkout | Auth & PIN, store/register setup, catalog (incl. weighed items + weight-embedded barcodes + PLU), stock on hand + adjustments + low-stock, checkout (scan, discounts, split payments, hold, void, receipt, **offline**), shifts & X/Z reports, core reports, scanner + receipt printer |
| **P2** | Back-office depth & returns | Staff management, suppliers & purchase orders + goods receipt, batch/expiry + stock take, returns/refunds, customers, inventory/tax reports, label printing, multi-pack units |
| **P3** | Scale-up & richness | Multi-store transfers + consolidated reporting, promotions, loyalty/store credit/gift cards, audit log, cash drawer + scale + customer display, variants/bundles, exports |
