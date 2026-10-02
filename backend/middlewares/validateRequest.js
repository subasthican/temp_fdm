import ApiError from "../utils/apiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

const LOCATIONS = ["params", "query", "body"];

// Validates each location (params / query / body) the schema declares
// and writes the converted value back so Joi normalization
// (.trim(), .lowercase(), number coercion) reaches the service.
const validateRequest = (schema) => (req, res, next) => {
  for (const location of LOCATIONS) {
    if (!schema[location]) continue;

    const { error, value } = schema[location].validate(req[location], {
      abortEarly: false,
      stripUnknown: false,
      convert: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");

      return next(ApiError.badRequest(message, ERROR_CODES.VALIDATION_ERROR));
    }

    req[location] = value;
  }

  next();
};

export default validateRequest;
