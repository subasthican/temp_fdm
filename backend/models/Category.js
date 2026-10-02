import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Nullable self-reference — top-level categories have no parent.
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
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
categorySchema.plugin(mongoosePaginate);

const Category = mongoose.model("Category", categorySchema);

export default Category;
