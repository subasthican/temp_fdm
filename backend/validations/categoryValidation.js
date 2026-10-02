import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

export const createCategoryValidation = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Category name is required",
      "string.empty": "Category name is required",
    }),
    parent: objectId.allow(null).optional(),
  }).unknown(true),
};

export const updateCategoryValidation = {
  ...idParamSchema,
  body: Joi.object({
    name: Joi.string().trim().optional(),
    parent: objectId.allow(null).optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getCategoriesValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    parent: objectId.allow(null).optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const categoryIdValidation = idParamSchema;
