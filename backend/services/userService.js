import User from "../models/User.js";
import Store from "../models/Store.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { USER_ROLES } from "../config/constants.js";
import { hashPassword } from "../helpers/auth/hashPassword.js";
import { shapeUser } from "../helpers/users/shapeUser.js";

// Rejects store ids that don't point at real stores.
const assertStoresExist = async (stores) => {
  if (!stores || stores.length === 0) return;

  const count = await Store.countDocuments({ _id: { $in: stores } });

  if (count !== stores.length) {
    throw ApiError.badRequest(
      "One or more assigned stores do not exist",
      ERROR_CODES.RESOURCE_NOT_FOUND,
    );
  }
};

// ============================================
// User Operations
// ============================================

export const createUser = async (payload) => {
  try {
    const { username, password, fullName, role, email, phone, stores } =
      payload;

    const existing = await User.findOne({ username });

    if (existing) {
      throw ApiError.conflict(
        "A user with this username already exists",
        ERROR_CODES.USER_DUPLICATE,
      );
    }

    await assertStoresExist(stores);

    // Models are schema-only (§7) — the service hashes explicitly.
    const user = await User.create({
      username,
      password: await hashPassword(password),
      fullName,
      role,
      email,
      phone,
      stores: stores || [],
    });

    return {
      success: true,
      message: "User created",
      data: { user: shapeUser(user) },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createUser");
  }
};

export const getUsers = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    // Soft-deleted users are excluded from every read.
    const query = { isDeleted: { $ne: true } };

    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: "i" } },
        { fullName: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const result = await User.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: "stores", select: "name code" },
    });

    return {
      success: true,
      message: "Users fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map(shapeUser),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getUsers");
  }
};

export const getUserById = async (userId) => {
  try {
    const user = await User.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    }).populate("stores", "name code");

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    return {
      success: true,
      message: "User fetched",
      data: { user: shapeUser(user) },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getUserById");
  }
};

export const updateUser = async (userId, data, actorId) => {
  try {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    // An admin cannot lock themselves out.
    if (
      data.isActive === false &&
      String(userId) === String(actorId)
    ) {
      throw ApiError.badRequest(
        "You cannot deactivate your own account",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (data.stores !== undefined) {
      await assertStoresExist(data.stores);
    }

    // Whitelist update fields — never spread a request body. Username and
    // password are never changed here (password → resetPassword).
    const updates = {};
    if (data.fullName !== undefined) updates.fullName = data.fullName;
    if (data.role !== undefined) updates.role = data.role;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.stores !== undefined) updates.stores = data.stores;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(user, updates);

    // Deactivating ends the user's sessions once the access token expires.
    if (data.isActive === false) user.refreshToken = undefined;

    await user.save();

    return {
      success: true,
      message: "User updated",
      data: { user: shapeUser(user) },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateUser");
  }
};

export const resetPassword = async (userId, newPassword) => {
  try {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    // Reset invalidates every active session for this user.
    user.password = await hashPassword(newPassword);
    user.refreshToken = undefined;
    await user.save();

    return {
      success: true,
      message: "Password reset. The user must log in again.",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in resetPassword");
  }
};

export const softDeleteUser = async (userId, actorId) => {
  try {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    if (String(userId) === String(actorId)) {
      throw ApiError.badRequest(
        "You cannot delete your own account",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // Never delete the last remaining active admin.
    if (user.role === USER_ROLES.ADMIN) {
      const admins = await User.countDocuments({
        role: USER_ROLES.ADMIN,
        isActive: true,
        isDeleted: { $ne: true },
      });

      if (admins <= 1) {
        throw ApiError.badRequest(
          "Cannot delete the last active admin",
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
    }

    user.isDeleted = true;
    user.isActive = false;
    user.refreshToken = undefined;
    await user.save();

    return {
      success: true,
      message: "User deleted",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in softDeleteUser");
  }
};
