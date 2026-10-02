import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import {
  SALE_STATUS,
  SALE_SOURCE,
  PAYMENT_METHODS,
  SELL_TYPES,
} from "../config/constants.js";

// Line prices, names, tax, and the batch used are snapshotted onto the
// sale so receipts, returns, and history stay exact regardless of later
// catalog or batch edits.
const saleLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    barcode: { type: String },
    sellType: {
      type: String,
      enum: Object.values(SELL_TYPES),
      default: SELL_TYPES.EACH,
    },
    quantity: { type: Number, required: true },
    weight: { type: Number },
    unitPrice: { type: Number, required: true },
    lineDiscount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    batchNo: { type: String, default: null },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
    },
    amount: { type: Number, required: true },
    ref: { type: String },
  },
  { _id: false },
);

const saleSchema = new mongoose.Schema(
  {
    // Client-generated UUID — the idempotency key. The server upserts on
    // it so a retried (or offline-then-synced) sale never double-posts.
    clientSaleId: {
      type: String,
      required: true,
      unique: true,
    },
    // <registerPrefix>-<counter>, unique.
    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    registerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
      required: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SALE_STATUS),
      default: SALE_STATUS.COMPLETED,
    },
    source: {
      type: String,
      enum: Object.values(SALE_SOURCE),
      default: SALE_SOURCE.ONLINE,
    },
    lines: [saleLineSchema],
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    feeTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    payments: [paymentSchema],
    changeGiven: { type: Number, default: 0 },
    soldAt: { type: Date, default: Date.now },
    syncedAt: { type: Date },
  },
  { timestamps: true },
);

// Schema-only model (style guide §7) — no hooks, no methods.
saleSchema.plugin(mongoosePaginate);

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
