import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const batchSchema = new mongoose.Schema(
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
    batchNo: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Batch-wise MRP — for BATCH-priced products this is the price rung
    // up at the till (resolved FEFO). Ignored for PRODUCT-priced items.
    sellPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Remaining quantity in this batch (drops as it is sold FEFO).
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// FEFO queries hit (product, store, expiry) constantly.
batchSchema.index({ productId: 1, storeId: 1, expiryDate: 1 });

// Schema-only model (style guide §7) — no hooks, no methods.
batchSchema.plugin(mongoosePaginate);

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
