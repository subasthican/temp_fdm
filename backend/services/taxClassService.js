import TaxClass from "../models/TaxClass.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// ============================================
// Tax Class Operations
// ============================================

export const createTaxClass = async (payload) => {
  try {
    const { name, rate, isInclusiveDefault } = payload;

    const taxClass = await TaxClass.create({ name, rate, isInclusiveDefault });

    return {
      success: true,
      message: "Tax class created",
      data: {
        taxClass: {
          id: taxClass._id,
          name: taxClass.name,
          rate: taxClass.rate,
          isInclusiveDefault: taxClass.isInclusiveDefault,
          isActive: taxClass.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createTaxClass");
  }
};

export const getTaxClasses = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    // Soft-deleted rows are excluded from every list.
    const query = { isDeleted: { $ne: true } };

    if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const result = await TaxClass.paginate(query, {
      page,
      limit,
      sort: { name: 1 },
    });

    return {
      success: true,
      message: "Tax classes fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((taxClass) => ({
          id: taxClass._id,
          name: taxClass.name,
          rate: taxClass.rate,
          isInclusiveDefault: taxClass.isInclusiveDefault,
          isActive: taxClass.isActive,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getTaxClasses");
  }
};

export const updateTaxClass = async (taxClassId, data) => {
  try {
    const taxClass = await TaxClass.findById(taxClassId);

    if (!taxClass) {
      throw ApiError.notFound(
        "Tax class not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.rate !== undefined) updates.rate = data.rate;
    if (data.isInclusiveDefault !== undefined)
      updates.isInclusiveDefault = data.isInclusiveDefault;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(taxClass, updates);
    await taxClass.save();

    return {
      success: true,
      message: "Tax class updated",
      data: {
        taxClass: {
          id: taxClass._id,
          name: taxClass.name,
          rate: taxClass.rate,
          isInclusiveDefault: taxClass.isInclusiveDefault,
          isActive: taxClass.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateTaxClass");
  }
};

// Soft delete — marks the tax class deleted (hidden everywhere) without
// removing the row, so historical product references stay intact.
export const softDeleteTaxClass = async (taxClassId) => {
  try {
    const taxClass = await TaxClass.findById(taxClassId);

    if (!taxClass) {
      throw ApiError.notFound(
        "Tax class not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    taxClass.isDeleted = true;
    await taxClass.save();

    return {
      success: true,
      message: "Tax class deleted",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in softDeleteTaxClass");
  }
};
