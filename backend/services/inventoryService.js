import Stock from "../models/Stock.js";
import Batch from "../models/Batch.js";
import StockMovement from "../models/StockMovement.js";
import ProductStorePrice from "../models/ProductStorePrice.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import getPagination from "../utils/pagination.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { MOVEMENT_TYPES } from "../config/constants.js";
import { applyStockDelta } from "../helpers/inventory/applyStockDelta.js";
import { assertProductAndStore } from "../helpers/inventory/assertProductAndStore.js";
import { generateBatchNo } from "../helpers/inventory/generateBatchNo.js";

// ============================================
// Receiving stock (shared with goods-receipt in Phase 2)
// ============================================

// Creates a batch, bumps the store's stock, and logs the movement. This
// is the single stock-in path — the manual "receive stock" form and the
// future purchase goods-receipt both call it.
export const receiveStock = async (payload, actorId) => {
  try {
    const { productId, storeId, batchNo, expiryDate, cost, sellPrice, quantity } =
      payload;

    if (quantity <= 0) {
      throw ApiError.badRequest(
        "Quantity to receive must be greater than zero",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { product } = await assertProductAndStore(productId, storeId);

    // No supplier/lot number supplied → auto-generate a readable one from
    // the product SKU and its next per-product batch sequence.
    let finalBatchNo = batchNo;
    if (!finalBatchNo) {
      const priorCount = await Batch.countDocuments({ productId });
      finalBatchNo = generateBatchNo(product.sku, priorCount + 1);
    }

    const batch = await Batch.create({
      productId,
      storeId,
      batchNo: finalBatchNo,
      expiryDate,
      cost,
      sellPrice,
      quantity,
    });

    const stock = await applyStockDelta(productId, storeId, quantity);

    await StockMovement.create({
      productId,
      storeId,
      batchId: batch._id,
      type: MOVEMENT_TYPES.RECEIVE,
      quantity,
      refType: "stock_in",
      refId: batch._id,
      actorId,
    });

    return {
      success: true,
      message: "Stock received",
      data: {
        batch: {
          id: batch._id,
          batchNo: batch.batchNo,
          expiryDate: batch.expiryDate,
          cost: batch.cost,
          sellPrice: batch.sellPrice,
          quantity: batch.quantity,
        },
        onHand: stock.quantity,
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in receiveStock");
  }
};

// ============================================
// Manual adjustment
// ============================================

export const adjustStock = async (payload, actorId) => {
  try {
    const { productId, storeId, delta, reason, batchId } = payload;

    if (!delta || delta === 0) {
      throw ApiError.badRequest(
        "Adjustment quantity cannot be zero",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    await assertProductAndStore(productId, storeId);

    // If a specific batch is named (e.g. wastage of an expiring lot),
    // adjust that batch too so FEFO stays honest.
    if (batchId) {
      const batch = await Batch.findOne({ _id: batchId, productId, storeId });

      if (!batch) {
        throw ApiError.notFound(
          "Batch not found for this product/store",
          ERROR_CODES.RESOURCE_NOT_FOUND,
        );
      }

      batch.quantity = Math.max(0, batch.quantity + delta);
      await batch.save();
    }

    const stock = await applyStockDelta(productId, storeId, delta);

    await StockMovement.create({
      productId,
      storeId,
      batchId: batchId || null,
      type: MOVEMENT_TYPES.ADJUSTMENT,
      quantity: delta,
      reason,
      refType: "adjustment",
      actorId,
    });

    return {
      success: true,
      message: "Stock adjusted",
      data: { onHand: stock.quantity },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in adjustStock");
  }
};

// ============================================
// Reads
// ============================================

export const getStock = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    const query = {};
    if (filters.storeId) query.storeId = filters.storeId;

    const result = await Stock.paginate(query, {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: { path: "productId", select: "name sku pricingMode isActive" },
    });

    // Filter out rows whose product was removed, and optionally by search.
    let docs = result.docs.filter((row) => row.productId);

    if (filters.search) {
      const term = filters.search.toLowerCase();
      docs = docs.filter(
        (row) =>
          row.productId.name.toLowerCase().includes(term) ||
          row.productId.sku.toLowerCase().includes(term),
      );
    }

    // Batch-load reorder levels for the returned product/store pairs so
    // low-stock can be flagged without an N+1 query.
    const priceQuery = filters.storeId
      ? { storeId: filters.storeId, productId: { $in: docs.map((d) => d.productId._id) } }
      : { productId: { $in: docs.map((d) => d.productId._id) } };

    const prices = await ProductStorePrice.find(priceQuery);
    const reorderByKey = {};
    prices.forEach((p) => {
      reorderByKey[`${p.productId}_${p.storeId}`] = p.reorderLevel;
    });

    return {
      success: true,
      message: "Stock fetched",
      data: {
        count: docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: docs.map((row) => {
          const reorderLevel =
            reorderByKey[`${row.productId._id}_${row.storeId}`] || 0;

          return {
            id: row._id,
            product: {
              id: row.productId._id,
              name: row.productId.name,
              sku: row.productId.sku,
              pricingMode: row.productId.pricingMode,
            },
            storeId: row.storeId,
            quantity: row.quantity,
            reorderLevel,
            lowStock: reorderLevel > 0 && row.quantity <= reorderLevel,
          };
        }),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getStock");
  }
};

export const getBatches = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    const query = {};
    if (filters.productId) query.productId = filters.productId;
    if (filters.storeId) query.storeId = filters.storeId;
    if (filters.inStock) query.quantity = { $gt: 0 };

    const result = await Batch.paginate(query, {
      page,
      limit,
      // FEFO order — earliest expiry first.
      sort: { expiryDate: 1, createdAt: 1 },
      populate: { path: "storeId", select: "name code" },
    });

    return {
      success: true,
      message: "Batches fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((batch) => ({
          id: batch._id,
          store: batch.storeId
            ? { id: batch.storeId._id, name: batch.storeId.name, code: batch.storeId.code }
            : null,
          batchNo: batch.batchNo,
          expiryDate: batch.expiryDate,
          cost: batch.cost,
          sellPrice: batch.sellPrice,
          quantity: batch.quantity,
          isActive: batch.isActive,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getBatches");
  }
};

export const getMovements = async (filters = {}) => {
  try {
    const { page, limit } = getPagination(filters);

    const query = {};
    if (filters.productId) query.productId = filters.productId;
    if (filters.storeId) query.storeId = filters.storeId;
    if (filters.type) query.type = filters.type;

    const result = await StockMovement.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: "productId", select: "name sku" },
        { path: "actorId", select: "fullName" },
      ],
    });

    return {
      success: true,
      message: "Movements fetched",
      data: {
        count: result.docs.length,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        data: result.docs.map((m) => ({
          id: m._id,
          product: m.productId
            ? { id: m.productId._id, name: m.productId.name, sku: m.productId.sku }
            : null,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          actor: m.actorId ? m.actorId.fullName : null,
          createdAt: m.createdAt,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getMovements");
  }
};
