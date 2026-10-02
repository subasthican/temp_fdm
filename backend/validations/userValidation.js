import Joi from "joi";

import { USER_ROLES } from "../config/constants.js";

const objectId = Joi.string().hex().length(24);

const idParamSchema = {
  params: Joi.object({
    id: objectId.required(),
  }).unknown(true),
};

const roles = Joi.string().valid(...Object.values(USER_ROLES));

export const createUserValidation = {
  body: Joi.object({
    username: Joi.string().trim().lowercase().min(3).max(50).required().messages({
      "any.required": "Username is required",
      "string.empty": "Username is required",
    }),
    password: Joi.string().min(8).required().messages({
      "any.required": "Password is required",
      "string.min": "Password must be at least 8 characters",
    }),
    fullName: Joi.string().trim().required().messages({
      "any.required": "Full name is required",
      "string.empty": "Full name is required",
    }),
    role: roles.required().messages({
      "any.required": "Role is required",
      "any.only": "Invalid role",
    }),
    email: Joi.string().trim().lowercase().email().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
    stores: Joi.array().items(objectId).optional(),
  }).unknown(true),
};

export const updateUserValidation = {
  ...idParamSchema,
  body: Joi.object({
    fullName: Joi.string().trim().optional(),
    role: roles.optional(),
    email: Joi.string().trim().lowercase().email().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
    stores: Joi.array().items(objectId).optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const getUsersValidation = {
  body: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().allow("").optional(),
    role: roles.optional(),
    isActive: Joi.boolean().optional(),
  }).unknown(true),
};

export const resetPasswordValidation = {
  ...idParamSchema,
  body: Joi.object({
    newPassword: Joi.string().min(8).required().messages({
      "any.required": "New password is required",
      "string.min": "New password must be at least 8 characters",
    }),
  }).unknown(true),
};

export const userIdValidation = idParamSchema;
