import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import { SELL_TYPES, PRICING_MODES } from "../config/constants.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Multiple barcodes per product (pack variants, re-barcoded stock).
    // Indexed for instant scan lookup; unique across all products.
    barcodes: {
      type: [String],
      index: true,
      default: [],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    sellType: {
      type: String,
      enum: Object.values(SELL_TYPES),
      default: SELL_TYPES.EACH,
    },
    // Where the sell price comes from — see PRICING_MODES.
    pricingMode: {
      type: String,
      enum: Object.values(PRICING_MODES),
      default: PRICING_MODES.PRODUCT,
    },
    baseUnit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    // Nullable — an unset tax class means the product is tax-exempt (MRP
    // is tax-inclusive, so tax is only ever a receipt breakdown).
    taxClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxClass",
      default: null,
    },
    isAgeRestricted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Soft delete — hidden from every query but retained for history.
    // Distinct from isActive (a reversible enable/disable toggle).
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Schema-only model (style guide §7) — no hooks, no methods.
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model("Product", productSchema);

export default Product;
