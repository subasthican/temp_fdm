import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

export const createTaxClassValidation = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Tax class name is required",
      "string.empty": "Tax class name is required",
    }),
    rate: Joi.number().min(0).required().messages({
      "any.required": "Tax rate is required",
      "number.base": "Tax rate must be a number",
      "number.min": "Tax rate cannot be negative",
    }),
    isInclusiveDefault: Joi.boolean().optional(),
  }).unknown(true),
};

export const updateTaxClassValidation = {
  ...idParamSchema,
  body: Joi.object({
    name: Joi.string().trim().optional(),
    rate: Joi.number().min(0).optional(),
    isInclusiveDefault: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getTaxClassesValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const taxClassIdValidation = idParamSchema;
