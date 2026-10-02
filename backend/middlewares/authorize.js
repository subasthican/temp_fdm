import ApiError from "../utils/apiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// Role gate — mount after protect: authorize(USER_ROLES.ADMIN, ...).
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          "You do not have permission to perform this action",
          ERROR_CODES.AUTH_FORBIDDEN,
        ),
      );
    }

    next();
  };

export default authorize;
