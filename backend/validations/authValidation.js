import Joi from "joi";

export const loginValidation = {
  body: Joi.object({
    username: Joi.string().trim().lowercase().required().messages({
      "any.required": "Username is required",
      "string.empty": "Username is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
      "string.empty": "Password is required",
    }),
  }).unknown(true),
};

export const refreshTokenValidation = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      "any.required": "Refresh token is required",
      "string.empty": "Refresh token is required",
    }),
  }).unknown(true),
};

export const updateProfileValidation = {
  body: Joi.object({
    fullName: Joi.string().trim().optional(),
    email: Joi.string().trim().lowercase().email().allow("").optional(),
    phone: Joi.string().trim().allow("").optional(),
  }).unknown(true),
};

export const changePasswordValidation = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
      "string.empty": "Current password is required",
    }),
    newPassword: Joi.string().min(8).required().messages({
      "any.required": "New password is required",
      "string.empty": "New password is required",
      "string.min": "New password must be at least 8 characters",
    }),
  }).unknown(true),
};
