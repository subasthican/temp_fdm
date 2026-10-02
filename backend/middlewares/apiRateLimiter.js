import rateLimit from "express-rate-limit";

import { RATE_LIMIT } from "../config/constants.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// The single global limiter, mounted once on /api in app.js.
// No per-route limiters (backend style guide §3).
const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errorCode: ERROR_CODES.INTERNAL_ERROR,
  },
});

export default apiRateLimiter;
