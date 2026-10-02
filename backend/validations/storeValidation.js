import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

export const createStoreValidation = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Store name is required",
      "string.empty": "Store name is required",
    }),
    code: Joi.string().trim().uppercase().required().messages({
      "any.required": "Store code is required",
      "string.empty": "Store code is required",
    }),
    address: Joi.string().trim().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
    currency: Joi.string().trim().optional(),
    taxProfile: Joi.object({
      isInclusive: Joi.boolean().optional(),
    }).optional(),
    receipt: Joi.object({
      header: Joi.string().trim().allow("").optional(),
      footer: Joi.string().trim().allow("").optional(),
      logoUrl: Joi.string().trim().allow("").optional(),
    }).optional(),
  }).unknown(true),
};

export const updateStoreValidation = {
  ...idParamSchema,
  body: Joi.object({
    name: Joi.string().trim().optional(),
    code: Joi.string().trim().uppercase().optional(),
    address: Joi.string().trim().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
    currency: Joi.string().trim().optional(),
    taxProfile: Joi.object({
      isInclusive: Joi.boolean().optional(),
    }).optional(),
    receipt: Joi.object({
      header: Joi.string().trim().allow("").optional(),
      footer: Joi.string().trim().allow("").optional(),
      logoUrl: Joi.string().trim().allow("").optional(),
    }).optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getStoresValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const storeIdValidation = idParamSchema;
