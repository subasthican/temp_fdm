import Store from "../models/Store.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// ============================================
// Store Operations
// ============================================

export const createStore = async (payload) => {
  try {
    const { name, code, address, phone, currency, taxProfile, receipt } =
      payload;

    const existing = await Store.findOne({ code });

    if (existing) {
      throw ApiError.conflict(
        "A store with this code already exists",
        ERROR_CODES.DUPLICATE_RESOURCE,
      );
    }

    const store = await Store.create({
      name,
      code,
      address,
      phone,
      currency,
      taxProfile,
      receipt,
    });

    return {
      success: true,
      message: "Store created",
      data: {
        store: {
          id: store._id,
          name: store.name,
          code: store.code,
          address: store.address,
          phone: store.phone,
          currency: store.currency,
          taxProfile: store.taxProfile,
          receipt: store.receipt,
          isActive: store.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createStore");
  }
};

export const getStores = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    const query = {};

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { code: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const result = await Store.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      success: true,
      message: "Stores fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((store) => ({
          id: store._id,
          name: store.name,
          code: store.code,
          address: store.address,
          phone: store.phone,
          currency: store.currency,
          taxProfile: store.taxProfile,
          receipt: store.receipt,
          isActive: store.isActive,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getStores");
  }
};

export const getStoreById = async (storeId) => {
  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound(
        "Store not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    return {
      success: true,
      message: "Store fetched",
      data: {
        store: {
          id: store._id,
          name: store.name,
          code: store.code,
          address: store.address,
          phone: store.phone,
          currency: store.currency,
          taxProfile: store.taxProfile,
          receipt: store.receipt,
          isActive: store.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getStoreById");
  }
};

export const updateStore = async (storeId, data) => {
  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound(
        "Store not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // A changed code must stay unique across stores.
    if (data.code !== undefined && data.code !== store.code) {
      const existing = await Store.findOne({ code: data.code });

      if (existing) {
        throw ApiError.conflict(
          "A store with this code already exists",
          ERROR_CODES.DUPLICATE_RESOURCE,
        );
      }
    }

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.code !== undefined) updates.code = data.code;
    if (data.address !== undefined) updates.address = data.address;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.currency !== undefined) updates.currency = data.currency;
    if (data.taxProfile !== undefined) updates.taxProfile = data.taxProfile;
    if (data.receipt !== undefined) updates.receipt = data.receipt;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(store, updates);
    await store.save();

    return {
      success: true,
      message: "Store updated",
      data: {
        store: {
          id: store._id,
          name: store.name,
          code: store.code,
          address: store.address,
          phone: store.phone,
          currency: store.currency,
          taxProfile: store.taxProfile,
          receipt: store.receipt,
          isActive: store.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateStore");
  }
};

export const deactivateStore = async (storeId) => {
  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound(
        "Store not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // Soft-deactivate only — stores are referenced by sales, stock and
    // registers, so they are never hard-deleted.
    store.isActive = false;
    await store.save();

    return {
      success: true,
      message: "Store deactivated",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in deactivateStore");
  }
};
