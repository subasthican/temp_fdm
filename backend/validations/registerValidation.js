import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

export const createRegisterValidation = {
  body: Joi.object({
    storeId: objectId.required().messages({
      "any.required": "Store is required",
      "string.empty": "Store is required",
    }),
    code: Joi.string().trim().uppercase().required().messages({
      "any.required": "Register code is required",
      "string.empty": "Register code is required",
    }),
    name: Joi.string().trim().allow("").optional(),
    receiptPrefix: Joi.string().trim().uppercase().required().messages({
      "any.required": "Receipt prefix is required",
      "string.empty": "Receipt prefix is required",
    }),
  }).unknown(true),
};

export const updateRegisterValidation = {
  ...idParamSchema,
  body: Joi.object({
    code: Joi.string().trim().uppercase().optional(),
    name: Joi.string().trim().allow("").optional(),
    receiptPrefix: Joi.string().trim().uppercase().optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getRegistersValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    storeId: objectId.optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const registerIdValidation = idParamSchema;
