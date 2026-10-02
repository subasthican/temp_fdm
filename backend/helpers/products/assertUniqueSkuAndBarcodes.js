import Product from "../../models/Product.js";
import ApiError from "../../utils/apiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";

// Rejects a SKU or barcode already used by a different product — scan
// integrity depends on barcodes being unique across the catalog.
export const assertUniqueSkuAndBarcodes = async (
  { sku, barcodes },
  excludeId = null,
) => {
  if (sku) {
    const skuOwner = await Product.findOne({ sku });

    if (skuOwner && String(skuOwner._id) !== String(excludeId)) {
      throw ApiError.conflict(
        "A product with this SKU already exists",
        ERROR_CODES.DUPLICATE_RESOURCE,
      );
    }
  }

  if (barcodes && barcodes.length > 0) {
    const barcodeOwner = await Product.findOne({
      barcodes: { $in: barcodes },
    });

    if (barcodeOwner && String(barcodeOwner._id) !== String(excludeId)) {
      throw ApiError.conflict(
        "One of these barcodes is already used by another product",
        ERROR_CODES.DUPLICATE_RESOURCE,
      );
    }
  }
};

export default assertUniqueSkuAndBarcodes;
