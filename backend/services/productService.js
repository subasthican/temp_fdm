import Product from "../models/Product.js";
import ProductStorePrice from "../models/ProductStorePrice.js";
import Store from "../models/Store.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { BARCODE_FORMATS } from "../config/constants.js";
import { generateEan13 } from "../helpers/barcode/generateEan13.js";
import { shapeProduct } from "../helpers/products/shapeProduct.js";
import { assertUniqueSkuAndBarcodes } from "../helpers/products/assertUniqueSkuAndBarcodes.js";
import { assertRefsExist } from "../helpers/products/assertRefsExist.js";

// ============================================
// Product Operations
// ============================================

export const createProduct = async (payload) => {
  try {
    const {
      name,
      sku,
      barcodes,
      categoryId,
      brandId,
      imageUrl,
      sellType,
      pricingMode,
      baseUnit,
      taxClassId,
      isAgeRestricted,
    } = payload;

    await assertUniqueSkuAndBarcodes({ sku, barcodes });
    await assertRefsExist({ categoryId, brandId, taxClassId });

    const product = await Product.create({
      name,
      sku,
      barcodes: barcodes || [],
      categoryId: categoryId || null,
      brandId: brandId || null,
      imageUrl,
      sellType,
      pricingMode,
      baseUnit,
      taxClassId: taxClassId || null,
      isAgeRestricted,
    });

    return {
      success: true,
      message: "Product created",
      data: { product: shapeProduct(product) },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in createProduct");
  }
};

export const getProducts = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    // Soft-deleted rows are excluded from every list.
    const query = { isDeleted: { $ne: true } };

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { sku: { $regex: filters.search, $options: "i" } },
        { barcodes: filters.search },
      ];
    }

    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.brandId) query.brandId = filters.brandId;
    if (filters.sellType) query.sellType = filters.sellType;
    if (filters.pricingMode) query.pricingMode = filters.pricingMode;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const result = await Product.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: "categoryId", select: "name" },
        { path: "brandId", select: "name" },
        { path: "taxClassId", select: "name rate" },
      ],
    });

    return {
      success: true,
      message: "Products fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map(shapeProduct),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getProducts");
  }
};

export const getProductById = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .populate("categoryId", "name")
      .populate("brandId", "name")
      .populate("taxClassId", "name rate");

    if (!product) {
      throw ApiError.notFound(
        "Product not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    const prices = await ProductStorePrice.find({ productId }).populate(
      "storeId",
      "name code",
    );

    return {
      success: true,
      message: "Product fetched",
      data: {
        product: {
          ...shapeProduct(product),
          prices: prices.map((price) => ({
            id: price._id,
            store: price.storeId
              ? { id: price.storeId._id, name: price.storeId.name, code: price.storeId.code }
              : null,
            cost: price.cost,
            sellPrice: price.sellPrice,
            reorderLevel: price.reorderLevel,
          })),
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getProductById");
  }
};

export const updateProduct = async (productId, data) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound(
        "Product not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    await assertUniqueSkuAndBarcodes(
      { sku: data.sku, barcodes: data.barcodes },
      productId,
    );
    await assertRefsExist(data);

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.barcodes !== undefined) updates.barcodes = data.barcodes;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.brandId !== undefined) updates.brandId = data.brandId;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
    if (data.sellType !== undefined) updates.sellType = data.sellType;
    if (data.pricingMode !== undefined) updates.pricingMode = data.pricingMode;
    if (data.baseUnit !== undefined) updates.baseUnit = data.baseUnit;
    if (data.taxClassId !== undefined) updates.taxClassId = data.taxClassId;
    if (data.isAgeRestricted !== undefined)
      updates.isAgeRestricted = data.isAgeRestricted;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    Object.assign(product, updates);
    await product.save();

    return {
      success: true,
      message: "Product updated",
      data: { product: shapeProduct(product) },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateProduct");
  }
};

// Soft delete — marks the product deleted (hidden from catalog, search
// and checkout) without removing the row, so stock and sale history stay
// intact. Distinct from deactivate (isActive), which is reversible.
export const softDeleteProduct = async (productId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound(
        "Product not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    product.isDeleted = true;
    await product.save();

    return {
      success: true,
      message: "Product deleted",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in softDeleteProduct");
  }
};

// ============================================
// Per-store Pricing
// ============================================

export const setProductPrice = async (productId, data) => {
  try {
    const { storeId, cost, sellPrice, reorderLevel } = data;

    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound(
        "Product not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound("Store not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Upsert — one price row per (product, store).
    const updates = {};
    if (cost !== undefined) updates.cost = cost;
    if (sellPrice !== undefined) updates.sellPrice = sellPrice;
    if (reorderLevel !== undefined) updates.reorderLevel = reorderLevel;

    const price = await ProductStorePrice.findOneAndUpdate(
      { productId, storeId },
      { $set: updates, $setOnInsert: { productId, storeId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return {
      success: true,
      message: "Price saved",
      data: {
        price: {
          id: price._id,
          productId: price.productId,
          storeId: price.storeId,
          cost: price.cost,
          sellPrice: price.sellPrice,
          reorderLevel: price.reorderLevel,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in setProductPrice");
  }
};

// ============================================
// Barcode Generation
// ============================================

export const generateBarcode = async (productId, format) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw ApiError.notFound(
        "Product not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    let value;

    if (format === BARCODE_FORMATS.CODE128) {
      // Code128 encodes the SKU directly — no minting needed.
      value = product.sku;

      if (product.barcodes.includes(value)) {
        throw ApiError.conflict(
          "This product already has its SKU as a barcode",
          ERROR_CODES.DUPLICATE_RESOURCE,
        );
      }
    } else {
      // EAN-13: mint a unique in-store code, retrying on the rare
      // collision against any product's existing barcodes.
      let attempt = 0;
      do {
        value = generateEan13();
        attempt += 1;
      } while (
        (await Product.findOne({ barcodes: value })) &&
        attempt < 5
      );
    }

    // Guard against handing back a value already used elsewhere.
    const owner = await Product.findOne({ barcodes: value });

    if (owner && String(owner._id) !== String(productId)) {
      throw ApiError.conflict(
        "Generated barcode collides with another product — try again",
        ERROR_CODES.DUPLICATE_RESOURCE,
      );
    }

    product.barcodes.push(value);
    await product.save();

    return {
      success: true,
      message: "Barcode generated",
      data: {
        barcode: value,
        format,
        product: shapeProduct(product),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in generateBarcode");
  }
};
