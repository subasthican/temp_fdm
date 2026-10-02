import Joi from "joi";

import {
  SELL_TYPES,
  PRICING_MODES,
  BARCODE_FORMATS,
} from "../config/constants.js";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

export const createProductValidation = {
  body: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Product name is required",
      "string.empty": "Product name is required",
    }),
    sku: Joi.string().trim().uppercase().required().messages({
      "any.required": "SKU is required",
      "string.empty": "SKU is required",
    }),
    barcodes: Joi.array().items(Joi.string().trim()).optional(),
    categoryId: objectId.allow(null).optional(),
    brandId: objectId.allow(null).optional(),
    imageUrl: Joi.string().trim().allow("").optional(),
    sellType: Joi.string()
      .valid(...Object.values(SELL_TYPES))
      .optional(),
    pricingMode: Joi.string()
      .valid(...Object.values(PRICING_MODES))
      .optional(),
    baseUnit: Joi.string().trim().optional(),
    taxClassId: objectId.allow(null).optional(),
    isAgeRestricted: Joi.boolean().optional(),
  }).unknown(true),
};

export const updateProductValidation = {
  ...idParamSchema,
  body: Joi.object({
    name: Joi.string().trim().optional(),
    sku: Joi.string().trim().uppercase().optional(),
    barcodes: Joi.array().items(Joi.string().trim()).optional(),
    categoryId: objectId.allow(null).optional(),
    brandId: objectId.allow(null).optional(),
    imageUrl: Joi.string().trim().allow("").optional(),
    sellType: Joi.string()
      .valid(...Object.values(SELL_TYPES))
      .optional(),
    pricingMode: Joi.string()
      .valid(...Object.values(PRICING_MODES))
      .optional(),
    baseUnit: Joi.string().trim().optional(),
    taxClassId: objectId.allow(null).optional(),
    isAgeRestricted: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getProductsValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    categoryId: objectId.optional(),
    brandId: objectId.optional(),
    sellType: Joi.string()
      .valid(...Object.values(SELL_TYPES))
      .optional(),
    pricingMode: Joi.string()
      .valid(...Object.values(PRICING_MODES))
      .optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const productIdValidation = idParamSchema;

// Generate/assign a barcode (POST /api/products/:id/barcode)
export const generateBarcodeValidation = {
  ...idParamSchema,
  body: Joi.object({
    format: Joi.string()
      .valid(...Object.values(BARCODE_FORMATS))
      .required()
      .messages({
        "any.required": "Barcode format is required",
        "any.only": "Barcode format must be ean13 or code128",
      }),
  }).unknown(true),
};

// Per-store price upsert (POST /api/products/:id/prices)
export const setProductPriceValidation = {
  ...idParamSchema,
  body: Joi.object({
    storeId: objectId.required().messages({
      "any.required": "Store is required",
      "string.empty": "Store is required",
    }),
    cost: Joi.number().min(0).optional(),
    sellPrice: Joi.number().min(0).optional(),
    reorderLevel: Joi.number().min(0).optional(),
  }).unknown(true),
};
