import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const taxClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Percentage, e.g. 15 for 15%.
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    // Whether prices under this class are quoted tax-inclusive by default
    // (a store-level default can still override at checkout).
    isInclusiveDefault: {
      type: Boolean,
      default: true,
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
taxClassSchema.plugin(mongoosePaginate);

const TaxClass = mongoose.model("TaxClass", taxClassSchema);

export default TaxClass;
