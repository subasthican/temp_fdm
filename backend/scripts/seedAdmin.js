// Creates the first admin user. Run once after setting up .env:
//   npm run seed:admin
import mongoose from "mongoose";

import config from "../config/env.js";
import User from "../models/User.js";
import { USER_ROLES } from "../config/constants.js";
import { hashPassword } from "../helpers/auth/hashPassword.js";

const seedAdmin = async () => {
  try {
    await mongoose.connect(config.mongodbUri);

    const username = process.env.SEED_ADMIN_USERNAME || "admin";
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
    const fullName = process.env.SEED_ADMIN_FULLNAME || "System Admin";

    const existing = await User.findOne({ username });

    if (existing) {
      console.log(`Admin "${username}" already exists — nothing to do.`);
    } else {
      // Models are schema-only — every write path hashes explicitly (§7).
      await User.create({
        username,
        password: await hashPassword(password),
        fullName,
        role: USER_ROLES.ADMIN,
      });

      console.log(`Admin "${username}" created.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
