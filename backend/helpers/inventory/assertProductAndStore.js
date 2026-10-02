import Product from "../../models/Product.js";
import Store from "../../models/Store.js";
import ApiError from "../../utils/apiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";

// Shared guard — validates that a product and store both exist before a
// stock operation touches them, and returns the fetched docs so callers
// can reuse them without a second query.
export const assertProductAndStore = async (productId, storeId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw ApiError.notFound("Product not found", ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  const store = await Store.findById(storeId);

  if (!store) {
    throw ApiError.notFound("Store not found", ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  return { product, store };
};

export default assertProductAndStore;
