import Joi from "joi";

import { PAYMENT_METHODS } from "../config/constants.js";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

// Look up a scanned/searched item for the cart. Either a barcode or a
// productId must be given, alongside the store the terminal is bound to.
export const lookupItemValidation = {
  body: Joi.object({
    storeId: objectId.required().messages({
      "any.required": "Store is required",
    }),
    barcode: Joi.string().trim().optional(),
    productId: objectId.optional(),
  })
    .or("barcode", "productId")
    .messages({
      "object.missing": "A barcode or product is required",
    })
    .unknown(true),
};

export const completeSaleValidation = {
  body: Joi.object({
    clientSaleId: Joi.string().trim().required().messages({
      "any.required": "clientSaleId is required",
      "string.empty": "clientSaleId is required",
    }),
    storeId: objectId.required().messages({
      "any.required": "Store is required",
    }),
    registerId: objectId.required().messages({
      "any.required": "Register is required",
    }),
    lines: Joi.array()
      .min(1)
      .items(
        Joi.object({
          productId: objectId.required(),
          batchId: objectId.optional(),
          barcode: Joi.string().trim().optional(),
          quantity: Joi.number().greater(0).required(),
        }).unknown(true),
      )
      .required()
      .messages({ "array.min": "A sale needs at least one item" }),
    payments: Joi.array()
      .min(1)
      .items(
        Joi.object({
          method: Joi.string()
            .valid(...Object.values(PAYMENT_METHODS))
            .required(),
          amount: Joi.number().greater(0).required(),
          ref: Joi.string().trim().allow("").optional(),
        }).unknown(true),
      )
      .required()
      .messages({ "array.min": "At least one payment is required" }),
  }).unknown(true),
};

export const saleIdValidation = idParamSchema;
