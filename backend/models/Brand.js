import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
brandSchema.plugin(mongoosePaginate);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
