import ApiError from "./apiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// Every service catch block rethrows through this: known ApiErrors pass
// through untouched; anything unexpected is logged with its context and
// wrapped so internals never leak to the client.
const handleServiceError = (error, context) => {
  if (error instanceof ApiError) {
    return error;
  }

  console.error(`${context}:`, error);

  return ApiError.internal(
    "Something went wrong. Please try again.",
    ERROR_CODES.INTERNAL_ERROR,
  );
};

export default handleServiceError;
