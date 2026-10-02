import Joi from "joi";

const objectId = Joi.string().hex().length(24);

// Dashboard window + optional store scope. Dates are ISO strings.
export const getDashboardValidation = {
  body: Joi.object({
    storeId: objectId.optional(),
    from: Joi.date().optional(),
    to: Joi.date().optional(),
  }).unknown(true),
};
