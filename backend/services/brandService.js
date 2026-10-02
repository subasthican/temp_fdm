import Brand from "../models/Brand.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// ============================================
// Brand Operations
// ============================================

export const createBrand = async (payload) => {
  try {
    const { name } = payload;

    const brand = await Brand.create({ name });

    return {
      success: true,
      message: "Brand created",
      data: {
        brand: {
          id: brand._id,
          name: brand.name,
          isActive: brand.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createBrand");
  }
};

export const getBrands = async (filters = {}) => {
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

    const result = await Brand.paginate(query, {
      page,
      limit,
      sort: { name: 1 },
    });

    return {
      success: true,
      message: "Brands fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((brand) => ({
          id: brand._id,
          name: brand.name,
          isActive: brand.isActive,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getBrands");
  }
};

export const updateBrand = async (brandId, data) => {
  try {
    const brand = await Brand.findById(brandId);

    if (!brand) {
      throw ApiError.notFound("Brand not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(brand, updates);
    await brand.save();

    return {
      success: true,
      message: "Brand updated",
      data: {
        brand: {
          id: brand._id,
          name: brand.name,
          isActive: brand.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateBrand");
  }
};

// Soft delete — marks the brand deleted (hidden everywhere) without
// removing the row, so historical product references stay intact.
export const softDeleteBrand = async (brandId) => {
  try {
    const brand = await Brand.findById(brandId);

    if (!brand) {
      throw ApiError.notFound("Brand not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    brand.isDeleted = true;
    await brand.save();

    return {
      success: true,
      message: "Brand deleted",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in softDeleteBrand");
  }
};
