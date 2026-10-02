// Fixed domain values. Environment-driven values live in config/env.js.

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  CASHIER: "cashier",
});

export const BACK_OFFICE_ROLES = Object.freeze([
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
]);

export const PAYMENT_METHODS = Object.freeze({
  CASH: "cash",
  CARD: "card",
  WALLET: "wallet",
});

export const SALE_STATUS = Object.freeze({
  COMPLETED: "completed",
  VOIDED: "voided",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
});

export const SALE_SOURCE = Object.freeze({
  ONLINE: "online",
  OFFLINE_SYNCED: "offline_synced",
});

export const RECEIPT_CONFIG = Object.freeze({
  // Zero-padded counter width: S01-000001
  SEQ_DIGITS: 6,
});

export const SELL_TYPES = Object.freeze({
  EACH: "each",
  WEIGHED: "weighed",
});

export const PRICING_MODES = Object.freeze({
  // Sell price comes from the FEFO batch's MRP (packaged / MRP-printed).
  BATCH: "batch",
  // Sell price comes from ProductStorePrice (loose / weighed / non-MRP).
  PRODUCT: "product",
});

export const BARCODE_FORMATS = Object.freeze({
  EAN13: "ean13",
  CODE128: "code128",
});

export const BARCODE_CONFIG = Object.freeze({
  // GS1 reserves prefixes 20–29 for in-store / restricted-circulation
  // codes — safe for store-generated barcodes that never leave the shop.
  INSTORE_PREFIX: "20",
  EAN13_LENGTH: 13,
});

export const MOVEMENT_TYPES = Object.freeze({
  RECEIVE: "receive",
  SALE: "sale",
  RETURN: "return",
  ADJUSTMENT: "adjustment",
  WASTAGE: "wastage",
  TRANSFER_OUT: "transfer_out",
  TRANSFER_IN: "transfer_in",
});

export const ADJUSTMENT_REASONS = Object.freeze({
  DAMAGE: "damage",
  WASTAGE: "wastage",
  COUNT_CORRECTION: "count_correction",
  EXPIRY: "expiry",
  THEFT: "theft",
  OTHER: "other",
});

export const BATCH_CONFIG = Object.freeze({
  // Auto batch no when none is supplied: <SKU>-B<seq>, e.g. SUG1KG-B003.
  INFIX: "-B",
  SEQ_DIGITS: 3,
});

export const AUTH_CONFIG = Object.freeze({
  SALT_ROUNDS: 10,
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

export const RATE_LIMIT = Object.freeze({
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 1000,
});
