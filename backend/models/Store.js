import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      trim: true,
      default: "Rs.",
    },
    taxProfile: {
      isInclusive: {
        type: Boolean,
        default: true,
      },
    },
    receipt: {
      header: { type: String, trim: true, default: "" },
      footer: { type: String, trim: true, default: "" },
      logoUrl: { type: String, trim: true, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Schema-only model (style guide §7) — no hooks, no methods.
storeSchema.plugin(mongoosePaginate);

const Store = mongoose.model("Store", storeSchema);

export default Store;
