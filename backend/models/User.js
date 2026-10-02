import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import { USER_ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    stores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Soft delete — hidden from every read, can never log in again, but
    // retained for audit trails and sale references. Distinct from
    // isActive (a reversible enable/disable toggle).
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Schema-only model (style guide §7) — password hashing happens in the
// services via helpers/auth/hashPassword.js, never here.
userSchema.plugin(mongoosePaginate);

const User = mongoose.model("User", userSchema);

export default User;
