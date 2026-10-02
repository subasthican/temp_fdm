import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

export const createBrandValidation = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Brand name is required",
      "string.empty": "Brand name is required",
    }),
  }).unknown(true),
};

export const updateBrandValidation = {
  ...idParamSchema,
  body: Joi.object({
    name: Joi.string().trim().optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getBrandsValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const brandIdValidation = idParamSchema;
