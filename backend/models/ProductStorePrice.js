import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const productStorePriceSchema = new mongoose.Schema(
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
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    // The till price for PRODUCT-priced items; a default/fallback for
    // BATCH-priced items (batch MRP wins at billing).
    sellPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// One price row per product per store.
productStorePriceSchema.index({ productId: 1, storeId: 1 }, { unique: true });

// Schema-only model (style guide §7) — no hooks, no methods.
productStorePriceSchema.plugin(mongoosePaginate);

const ProductStorePrice = mongoose.model(
  "ProductStorePrice",
  productStorePriceSchema,
);

export default ProductStorePrice;
