import Joi from "joi";

import { MOVEMENT_TYPES, ADJUSTMENT_REASONS } from "../config/constants.js";

const objectId = Joi.string().hex().length(24);

export const receiveStockValidation = {
  body: Joi.object({
    productId: objectId.required().messages({
      "any.required": "Product is required",
    }),
    storeId: objectId.required().messages({
      "any.required": "Store is required",
    }),
    batchNo: Joi.string().trim().allow("").optional(),
    expiryDate: Joi.date().optional(),
    cost: Joi.number().min(0).optional(),
    sellPrice: Joi.number().min(0).optional(),
    quantity: Joi.number().greater(0).required().messages({
      "any.required": "Quantity is required",
      "number.greater": "Quantity must be greater than zero",
    }),
  }).unknown(true),
};

export const adjustStockValidation = {
  body: Joi.object({
    productId: objectId.required().messages({
      "any.required": "Product is required",
    }),
    storeId: objectId.required().messages({
      "any.required": "Store is required",
    }),
    batchId: objectId.optional(),
    // Signed: negative removes stock, positive adds it.
    delta: Joi.number().invalid(0).required().messages({
      "any.required": "Adjustment quantity is required",
      "any.invalid": "Adjustment quantity cannot be zero",
    }),
    reason: Joi.string()
      .valid(...Object.values(ADJUSTMENT_REASONS))
      .required()
      .messages({
        "any.required": "Reason is required",
        "any.only": "Invalid adjustment reason",
      }),
  }).unknown(true),
};

export const getStockValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    storeId: objectId.optional(),
  }).unknown(true),
};

export const getBatchesValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    productId: objectId.optional(),
    storeId: objectId.optional(),
    inStock: Joi.boolean().optional(),
  }).unknown(true),
};

export const getMovementsValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    productId: objectId.optional(),
    storeId: objectId.optional(),
    type: Joi.string()
      .valid(...Object.values(MOVEMENT_TYPES))
      .optional(),
  }).unknown(true),
};
