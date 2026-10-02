import jwt from "jsonwebtoken";

import config from "../../config/env.js";

// The only place tokens are signed — the auth service imports this so
// secrets and expiry windows can never drift between call sites.
export const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

export default generateTokens;
