import bcrypt from "bcryptjs";

import { AUTH_CONFIG } from "../../config/constants.js";

// Models are schema-only (style guide §7), so nothing hashes
// automatically — every service path that writes a password/PIN must
// call this explicitly. Extracted so all write paths hash identically.
export const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(AUTH_CONFIG.SALT_ROUNDS);

  return bcrypt.hash(plain, salt);
};

export default hashPassword;
