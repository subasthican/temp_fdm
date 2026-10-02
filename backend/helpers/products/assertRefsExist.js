import Category from "../../models/Category.js";
import Brand from "../../models/Brand.js";
import TaxClass from "../../models/TaxClass.js";
import ApiError from "../../utils/apiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";

// Validates that the optional category / brand / tax-class references on
// a product payload point at records that exist and are not soft-deleted.
const notDeleted = { isDeleted: { $ne: true } };

export const assertRefsExist = async ({ categoryId, brandId, taxClassId }) => {
  if (
    categoryId &&
    !(await Category.findOne({ _id: categoryId, ...notDeleted }))
  ) {
    throw ApiError.notFound(
      "Category not found",
      ERROR_CODES.RESOURCE_NOT_FOUND,
    );
  }

  if (brandId && !(await Brand.findOne({ _id: brandId, ...notDeleted }))) {
    throw ApiError.notFound("Brand not found", ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  if (
    taxClassId &&
    !(await TaxClass.findOne({ _id: taxClassId, ...notDeleted }))
  ) {
    throw ApiError.notFound(
      "Tax class not found",
      ERROR_CODES.RESOURCE_NOT_FOUND,
    );
  }
};

export default assertRefsExist;
