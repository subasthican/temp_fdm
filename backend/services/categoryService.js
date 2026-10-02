import Category from "../models/Category.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// ============================================
// Category Operations
// ============================================

export const createCategory = async (payload) => {
  try {
    const { name, parent } = payload;

    if (parent) {
      const parentExists = await Category.findOne({
        _id: parent,
        isDeleted: { $ne: true },
      });

      if (!parentExists) {
        throw ApiError.notFound(
          "Parent category not found",
          ERROR_CODES.RESOURCE_NOT_FOUND,
        );
      }
    }

    const category = await Category.create({ name, parent: parent || null });

    return {
      success: true,
      message: "Category created",
      data: {
        category: {
          id: category._id,
          name: category.name,
          parent: category.parent,
          isActive: category.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createCategory");
  }
};

export const getCategories = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    // Soft-deleted rows are excluded from every list.
    const query = { isDeleted: { $ne: true } };

    if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    if (filters.parent !== undefined) {
      query.parent = filters.parent;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const result = await Category.paginate(query, {
      page,
      limit,
      sort: { name: 1 },
      populate: { path: "parent", select: "name" },
    });

    return {
      success: true,
      message: "Categories fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((category) => ({
          id: category._id,
          name: category.name,
          parent: category.parent
            ? { id: category.parent._id, name: category.parent.name }
            : null,
          isActive: category.isActive,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getCategories");
  }
};

export const updateCategory = async (categoryId, data) => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw ApiError.notFound(
        "Category not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    // A category cannot be its own parent.
    if (data.parent && String(data.parent) === String(categoryId)) {
      throw ApiError.badRequest(
        "A category cannot be its own parent",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (data.parent) {
      const parentExists = await Category.findOne({
        _id: data.parent,
        isDeleted: { $ne: true },
      });

      if (!parentExists) {
        throw ApiError.notFound(
          "Parent category not found",
          ERROR_CODES.RESOURCE_NOT_FOUND,
        );
      }
    }

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.parent !== undefined) updates.parent = data.parent;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(category, updates);
    await category.save();

    return {
      success: true,
      message: "Category updated",
      data: {
        category: {
          id: category._id,
          name: category.name,
          parent: category.parent,
          isActive: category.isActive,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateCategory");
  }
};

// Soft delete — marks the category deleted (hidden everywhere) without
// removing the row, so historical product references stay intact.
export const softDeleteCategory = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw ApiError.notFound(
        "Category not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    category.isDeleted = true;
    await category.save();

    return {
      success: true,
      message: "Category deleted",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in softDeleteCategory");
  }
};
