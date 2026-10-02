import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import { MOVEMENT_TYPES } from "../config/constants.js";

// Append-only ledger — one row per stock change. Never updated or
// deleted; the running Stock balance is derived from these.
const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(MOVEMENT_TYPES),
      required: true,
    },
    // Signed: positive adds stock (receive/return/transfer_in), negative
    // removes it (sale/wastage/transfer_out); adjustment can be either.
    quantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    // Source document (e.g. a sale or goods-receipt) that caused this.
    refType: {
      type: String,
      trim: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

stockMovementSchema.index({ storeId: 1, productId: 1, createdAt: -1 });

// Schema-only model (style guide §7) — no hooks, no methods.
stockMovementSchema.plugin(mongoosePaginate);

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);

export default StockMovement;
