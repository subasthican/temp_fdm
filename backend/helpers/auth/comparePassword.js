import bcrypt from "bcryptjs";

// Counterpart of hashPassword — the only place stored hashes are
// verified, so services never touch bcrypt directly.
export const comparePassword = async (candidate, hash) => {
  return bcrypt.compare(candidate, hash);
};

export default comparePassword;
