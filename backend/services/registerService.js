import Register from "../models/Register.js";
import Store from "../models/Store.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// ============================================
// Register Operations
// ============================================

export const createRegister = async (payload) => {
  try {
    const { storeId, code, name, receiptPrefix } = payload;

    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound(
        "Store not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // The prefix seeds offline receipt numbers, so it must be globally
    // unique — checked here for a clean message (the index still backs
    // it up against races).
    const prefixTaken = await Register.findOne({ receiptPrefix });

    if (prefixTaken) {
      throw ApiError.conflict(
        "A register with this receipt prefix already exists",
        ERROR_CODES.DUPLICATE_RESOURCE,
      );
    }

    const codeTaken = await Register.findOne({ storeId, code });

    if (codeTaken) {
      throw ApiError.conflict(
        "A register with this code already exists in this store",
        ERROR_CODES.DUPLICATE_RESOURCE,
      );
    }

    const register = await Register.create({
      storeId,
      code,
      name,
      receiptPrefix,
    });

    return {
      success: true,
      message: "Register created",
      data: {
        register: {
          id: register._id,
          storeId: register.storeId,
          code: register.code,
          name: register.name,
          receiptPrefix: register.receiptPrefix,
          isActive: register.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createRegister");
  }
};

export const getRegisters = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    const query = {};

    if (filters.storeId) {
      query.storeId = filters.storeId;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { code: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const result = await Register.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: "storeId", select: "name code" },
    });

    return {
      success: true,
      message: "Registers fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((register) => ({
          id: register._id,
          store: register.storeId
            ? {
                id: register.storeId._id,
                name: register.storeId.name,
                code: register.storeId.code,
              }
            : null,
          code: register.code,
          name: register.name,
          receiptPrefix: register.receiptPrefix,
          isActive: register.isActive,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getRegisters");
  }
};

export const getRegisterById = async (registerId) => {
  try {
    const register = await Register.findById(registerId).populate({
      path: "storeId",
      select: "name code",
    });

    if (!register) {
      throw ApiError.notFound(
        "Register not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    return {
      success: true,
      message: "Register fetched",
      data: {
        register: {
          id: register._id,
          store: register.storeId
            ? {
                id: register.storeId._id,
                name: register.storeId.name,
                code: register.storeId.code,
              }
            : null,
          code: register.code,
          name: register.name,
          receiptPrefix: register.receiptPrefix,
          isActive: register.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getRegisterById");
  }
};

export const updateRegister = async (registerId, data) => {
  try {
    const register = await Register.findById(registerId);

    if (!register) {
      throw ApiError.notFound(
        "Register not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // A changed prefix must stay globally unique (offline numbering).
    if (
      data.receiptPrefix !== undefined &&
      data.receiptPrefix !== register.receiptPrefix
    ) {
      const prefixTaken = await Register.findOne({
        receiptPrefix: data.receiptPrefix,
      });

      if (prefixTaken) {
        throw ApiError.conflict(
          "A register with this receipt prefix already exists",
          ERROR_CODES.DUPLICATE_RESOURCE,
        );
      }
    }

    // A changed code must stay unique within the register's store.
    if (data.code !== undefined && data.code !== register.code) {
      const codeTaken = await Register.findOne({
        storeId: register.storeId,
        code: data.code,
      });

      if (codeTaken) {
        throw ApiError.conflict(
          "A register with this code already exists in this store",
          ERROR_CODES.DUPLICATE_RESOURCE,
        );
      }
    }

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.code !== undefined) updates.code = data.code;
    if (data.name !== undefined) updates.name = data.name;
    if (data.receiptPrefix !== undefined)
      updates.receiptPrefix = data.receiptPrefix;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(register, updates);
    await register.save();

    return {
      success: true,
      message: "Register updated",
      data: {
        register: {
          id: register._id,
          storeId: register.storeId,
          code: register.code,
          name: register.name,
          receiptPrefix: register.receiptPrefix,
          isActive: register.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateRegister");
  }
};

export const deactivateRegister = async (registerId) => {
  try {
    const register = await Register.findById(registerId);

    if (!register) {
      throw ApiError.notFound(
        "Register not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // Soft-deactivate only — registers are referenced by sales and
    // cash sessions, so they are never hard-deleted.
    register.isActive = false;
    await register.save();

    return {
      success: true,
      message: "Register deactivated",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in deactivateRegister");
  }
};
