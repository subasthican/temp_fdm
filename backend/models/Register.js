import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const registerSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    // Offline-safe receipt numbering key: receipts are
    // `<receiptPrefix>-<local counter>`, so the prefix must be globally
    // unique or two tills could mint the same receipt number.
    receiptPrefix: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Monotonic per-register sequence for offline-safe receipt numbers.
    // Atomically $inc'd when a sale completes.
    receiptCounter: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// A register code repeats across stores (every branch has a REG01),
// but never within one store.
registerSchema.index({ storeId: 1, code: 1 }, { unique: true });

// Schema-only model (style guide §7) — no hooks, no methods.
registerSchema.plugin(mongoosePaginate);

const Register = mongoose.model("Register", registerSchema);

export default Register;
