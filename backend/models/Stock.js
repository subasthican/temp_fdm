import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const stockSchema = new mongoose.Schema(
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
    // Running on-hand balance. The StockMovement ledger is the source of
    // truth; this is the fast-read total kept in step with it.
    quantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// One stock row per product per store.
stockSchema.index({ productId: 1, storeId: 1 }, { unique: true });

// Schema-only model (style guide §7) — no hooks, no methods.
stockSchema.plugin(mongoosePaginate);

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;
