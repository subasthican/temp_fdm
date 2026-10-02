# POS System — Data Models

MongoDB collections for the grocery POS. Field lists are the significant
fields, not exhaustive schemas — implement each with a Mongoose model
following [backend §7](./backend-code-style-guide.md) (schema + hooks +
instance methods only; `mongoose-paginate-v2` plugin on any collection
with a list endpoint).

Conventions used below:
- `ref` → ObjectId reference to another collection.
- Money is stored as a number in the store's currency; totals are
  recomputed server-side, never trusted from the client.
- Multi-store fields (`storeId`) appear on every operational collection.
- Timestamps (`createdAt` / `updatedAt`) are assumed on every model.

---

## Identity & structure

### User
`username` (unique) · `passwordHash` (`select:false`) · `fullName` ·
`role` (`ADMIN|MANAGER|CASHIER`) · `pinHash` (`select:false`, cashier
unlock) · `stores` (`[ref Store]`) · `refreshToken` (`select:false`) ·
`isActive`.
Hooks: hash password & PIN on save. Methods: `comparePassword`,
`comparePin`.

### Store
`name` · `code` (unique) · `address` · `phone` · `currency` ·
`taxProfile` (inclusive/exclusive, default tax class) ·
`receipt` (`{ header, footer, logoUrl }`) · `isActive`.

### Register
`storeId` (`ref Store`) · `code` (unique per store) · `name` ·
`receiptPrefix` (for offline-safe numbering) · `isActive`.

---

## Catalog

### Category
`name` · `parent` (`ref Category`, nullable) · `isActive`.

### Brand
`name` · `isActive`.

### Product  *(global master)*
`name` · `sku` (unique) · `barcodes` (`[string]`, indexed) ·
`categoryId` (`ref`) · `brandId` (`ref`) · `imageUrl` ·
`sellType` (`EACH|WEIGHED`) · `baseUnit` (e.g. `pcs`, `kg`) ·
`pricingMode` (`BATCH|PRODUCT`) · `taxClassId` (`ref TaxClass`,
**nullable** — defaults to the Exempt/0% class) · `isAgeRestricted` ·
`isActive`.

> **Tax is an optional product field.** MRP is tax-inclusive, so tax is
> never *added* at the till — a set `taxClassId` only drives the receipt
> tax breakdown and reports (reverse-calculated from the gross price).
> Items with no class (loose veg, rice, etc.) are exempt: no tax line.
> Seed one **"Exempt (0%)"** tax class as the default.
Sub-docs / related:
- `units` (`[{ name, factor, barcode }]`) — multi-pack (each/pack/case).
- Weight-embedded barcode config read from settings, matched by prefix.

> **`pricingMode` decides where the sell price comes from:**
> - `BATCH` — MRP-printed packaged goods. The sell price lives on the
>   **batch** (each batch has its own MRP). Billing resolves the price
>   from the FEFO batch. Cannot be sold without an in-stock batch.
> - `PRODUCT` — loose / weighed / non-MRP items. The sell price lives on
>   **ProductStorePrice** (one shelf price per store). Batches (if any)
>   track only cost + expiry.

### ProductStorePrice  *(per-store price & cost)*
`productId` (`ref`) · `storeId` (`ref`) · `cost` · `sellPrice` ·
`reorderLevel`. Unique on (`productId`,`storeId`).
- For `PRODUCT`-priced items, `sellPrice` is the price rung up at the
  till. For `BATCH`-priced items, it is only a fallback/default used
  when seeding a new batch; the batch MRP wins at billing.

### TaxClass
`name` · `rate` (%) · `isInclusiveDefault`.

---

## Inventory

### Stock  *(per-store on-hand)*
`productId` (`ref`) · `storeId` (`ref`) · `quantity`.
Unique on (`productId`,`storeId`). Source of truth is the movement
ledger; this is the running balance.

### StockMovement  *(append-only ledger)*
`productId` · `storeId` · `type`
(`SALE|RETURN|ADJUSTMENT|PURCHASE|TRANSFER_OUT|TRANSFER_IN|WASTAGE`) ·
`quantity` (signed) · `reason` · `refType` · `refId`
(source document) · `batchId` (nullable) · `actorId` · `createdAt`.

### Batch  *(per-store stock lot)*
`productId` · `storeId` · `batchNo` · `expiryDate` · `quantity` ·
`cost` · `sellPrice` (MRP — the price rung up for `BATCH`-priced
products) · `isActive`. Drives FEFO deduction, batch-wise pricing, and
near-expiry reports.
- For `BATCH`-priced products, billing resolves the sell price from the
  FEFO batch (earliest `expiryDate` with stock), records `batchId` +
  the price used on the sale line, and deducts from that batch. A single
  scanned quantity may span multiple batches → the line **splits** into
  one sale line per batch/price.
- `sellPrice` is unused (or mirrors ProductStorePrice) for
  `PRODUCT`-priced items.

### StockTransfer  *(multi-store, P3)*
`fromStoreId` · `toStoreId` · `status`
(`DRAFT|SENT|RECEIVED|CANCELLED`) · `lines`
(`[{ productId, quantity }]`) · `sentBy` · `receivedBy`.

---

## Sales

### Sale  *(one completed transaction)*
`clientSaleId` (UUID, **unique** — idempotency for offline sync) ·
`receiptNo` (`<registerPrefix>-<counter>`, unique) · `storeId` ·
`registerId` · `cashierId` · `customerId` (nullable) ·
`status` (`COMPLETED|VOIDED|REFUNDED|PARTIALLY_REFUNDED`) ·
`source` (`ONLINE|OFFLINE_SYNCED`) ·
`lines` (`[SaleLine]`) ·
`subtotal` · `discountTotal` · `taxTotal` · `feeTotal`
(bag/carrier) · `grandTotal` ·
`payments` (`[{ method, amount, ref }]`) · `changeGiven` ·
`soldAt` (device time) · `syncedAt`.

**SaleLine** (embedded): `productId` · `name` (snapshot) · `barcode` ·
`sellType` · `quantity` · `weight` (weighed items) · `unitPrice`
(snapshot) · `lineDiscount` · `taxRate` · `lineTotal` · `batchId`
(nullable — set for `BATCH`-priced lines) · `batchNo` (snapshot) ·
`promotionId` (nullable).

> Line prices, names, tax, **and the batch/MRP used** are **snapshotted**
> onto the sale so receipts, returns, and history are exact and immune to
> later catalog or batch edits. One scanned item can produce multiple
> sale lines when its quantity spans batches at different MRPs.

### Return  *(P2)*
`originalSaleId` (`ref`) · `receiptNo` · `storeId` · `registerId` ·
`cashierId` · `approvedBy` · `lines`
(`[{ saleLineId, productId, quantity, refundAmount, restock }]`) ·
`refundPayments` (`[{ method, amount }]`) · `reason`.

### HeldSale  *(parked cart, may live client-side only)*
`storeId` · `registerId` · `cashierId` · `label` · `cart` (snapshot) ·
`heldAt`.

---

## Purchasing (P2)

### Supplier
`name` · `code` · `contactName` · `phone` · `email` · `address` ·
`isActive`.

### PurchaseOrder
`storeId` · `supplierId` · `status`
(`DRAFT|SENT|PARTIAL|RECEIVED|CANCELLED`) · `lines`
(`[{ productId, quantity, unitCost }]`) · `expectedTotal` · `createdBy`.

### GoodsReceipt
`purchaseOrderId` (`ref`) · `storeId` · `supplierId` · `lines`
(`[{ productId, quantity, unitCost, batchNo, expiryDate }]`) ·
`receivedBy`. Posting increments `Stock`/`Batch` and writes
`StockMovement(type=PURCHASE)`.

---

## Customers & loyalty (P2–P3)

### Customer
`name` · `phone` (unique) · `email` · `address` ·
`loyaltyPoints` · `storeCredit` · `isActive`.

### GiftCard  *(P3)*
`code` (unique) · `balance` · `isActive`.

---

## Promotions (P3)

### Promotion
`name` · `type` (`PRICE|PERCENT|BXGY|MIX_MATCH|QTY_BREAK|MEMBER_PRICE`) ·
`scope` (`[storeId]`) · `startAt` · `endAt` · `rules` (type-specific
config) · `isActive`. Cached to the terminal for offline evaluation.

---

## Cash management

### CashSession  *(register shift)*
`storeId` · `registerId` · `cashierId` · `status` (`OPEN|CLOSED`) ·
`openingFloat` · `openedAt` · `closingCounted`
(`[{ method, amount }]`) · `expected` (`[{ method, amount }]`) ·
`variance` · `closedAt`.

### CashMovement
`cashSessionId` (`ref`) · `type` (`PAY_IN|PAY_OUT|NO_SALE`) · `amount` ·
`reason` · `actorId`.

---

## Configuration & audit

### Setting  *(key–value, some per-store)*
`storeId` (nullable = global) · `key` · `value`. Holds tax defaults,
rounding rules, enabled payment methods, reason-code lists, feature
toggles, and the weight-embedded-barcode format.

### AuditLog  *(P3)*
`actorId` · `action` · `entityType` · `entityId` · `storeId` ·
`meta` · `createdAt`.

---

## Indexing notes

- `Product.barcodes`, `Product.sku` — indexed for instant scan lookup.
- `Sale.clientSaleId` — unique index (offline idempotency).
- `Sale.receiptNo` — unique index.
- `Stock` and `ProductStorePrice` — compound unique on
  (`productId`,`storeId`).
- `StockMovement` — compound index on (`storeId`,`productId`,`createdAt`)
  for ledger queries.
- List collections register `mongoose-paginate-v2` (backend guide §11).
