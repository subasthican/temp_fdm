import Product from "../models/Product.js";
import Store from "../models/Store.js";
import Register from "../models/Register.js";
import Batch from "../models/Batch.js";
import Stock from "../models/Stock.js";
import StockMovement from "../models/StockMovement.js";
import ProductStorePrice from "../models/ProductStorePrice.js";
import Sale from "../models/Sale.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { PRICING_MODES, MOVEMENT_TYPES } from "../config/constants.js";
import { formatReceiptNo } from "../helpers/sales/formatReceiptNo.js";
import { shapeSale } from "../helpers/sales/shapeSale.js";

// ============================================
// Checkout lookup
// ============================================

// Resolves a scanned/searched item into a sellable line for the given
// store: the product, its unit price, and (for batch-priced items) the
// FEFO batch the price came from. The cart is built from these.
export const lookupItem = async ({ storeId, barcode, productId }) => {
  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound("Store not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Find by explicit id or by any of the product's barcodes.
    const product = productId
      ? await Product.findById(productId)
      : await Product.findOne({ barcodes: barcode });

    if (!product || !product.isActive || product.isDeleted) {
      throw ApiError.notFound(
        "No active product found for this code",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    const stock = await Stock.findOne({ productId: product._id, storeId });
    const onHand = stock ? stock.quantity : 0;

    let unitPrice = 0;
    let batches = [];

    if (product.pricingMode === PRICING_MODES.BATCH) {
      // Return every in-stock batch (FEFO order) so the cashier can pick
      // the one matching the pack's printed MRP. The first is the FEFO
      // default; unitPrice mirrors it for convenience.
      const inStock = await Batch.find({
        productId: product._id,
        storeId,
        isActive: true,
        quantity: { $gt: 0 },
      }).sort({ expiryDate: 1, createdAt: 1 });

      if (inStock.length === 0) {
        throw ApiError.badRequest(
          `"${product.name}" has no stocked batch to price. Receive stock first.`,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      batches = inStock.map((b) => ({
        id: b._id,
        batchNo: b.batchNo,
        expiryDate: b.expiryDate,
        sellPrice: b.sellPrice,
        available: b.quantity,
      }));

      unitPrice = batches[0].sellPrice;
    } else {
      // Product-priced: the per-store sell price, no batch.
      const price = await ProductStorePrice.findOne({
        productId: product._id,
        storeId,
      });

      unitPrice = price ? price.sellPrice : 0;
    }

    return {
      success: true,
      message: "Item resolved",
      data: {
        item: {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          barcode: barcode || product.barcodes[0] || null,
          pricingMode: product.pricingMode,
          sellType: product.sellType,
          unitPrice,
          onHand,
          batches,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in lookupItem");
  }
};

// ============================================
// Complete sale
// ============================================

export const completeSale = async (payload, cashierId) => {
  try {
    const { clientSaleId, storeId, registerId, lines, payments } = payload;

    // Idempotency — a retried or re-synced sale returns the original,
    // never a duplicate.
    const existing = await Sale.findOne({ clientSaleId });

    if (existing) {
      return {
        success: true,
        message: "Sale already recorded",
        data: { sale: shapeSale(existing) },
      };
    }

    const store = await Store.findById(storeId);

    if (!store) {
      throw ApiError.notFound("Store not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const register = await Register.findById(registerId);

    if (!register) {
      throw ApiError.notFound(
        "Register not found",
        ERROR_CODES.RESOURCE_NOT_FOUND,
      );
    }

    if (!lines || lines.length === 0) {
      throw ApiError.badRequest(
        "A sale needs at least one item",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // Build each line at the authoritative server-side price — never
    // trust the client's amounts. Prices come from the named batch (the
    // one the cashier was shown) or the per-store price.
    const saleLines = [];
    let subtotal = 0;

    for (const line of lines) {
      const product = await Product.findById(line.productId);

      if (!product) {
        throw ApiError.notFound(
          "A product on this sale no longer exists",
          ERROR_CODES.RESOURCE_NOT_FOUND,
        );
      }

      let unitPrice = 0;
      let batchId = null;
      let batchNo = null;

      if (line.batchId) {
        const batch = await Batch.findById(line.batchId);

        if (!batch) {
          throw ApiError.notFound(
            "A batch on this sale no longer exists",
            ERROR_CODES.RESOURCE_NOT_FOUND,
          );
        }

        unitPrice = batch.sellPrice;
        batchId = batch._id;
        batchNo = batch.batchNo;

        // Draw down the batch (clamped — oversell is reconciled, not
        // hard-blocked, per the offline-consistency design).
        batch.quantity = Math.max(0, batch.quantity - line.quantity);
        await batch.save();
      } else {
        const price = await ProductStorePrice.findOne({
          productId: product._id,
          storeId,
        });

        unitPrice = price ? price.sellPrice : 0;
      }

      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;

      saleLines.push({
        productId: product._id,
        name: product.name,
        barcode: line.barcode || product.barcodes[0] || null,
        sellType: product.sellType,
        quantity: line.quantity,
        unitPrice,
        lineTotal,
        batchId,
        batchNo,
      });
    }

    const grandTotal = subtotal;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid < grandTotal) {
      throw ApiError.badRequest(
        "Payment does not cover the total",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const changeGiven = totalPaid - grandTotal;

    // Atomic per-register sequence → offline-safe receipt number.
    const seqRegister = await Register.findByIdAndUpdate(
      registerId,
      { $inc: { receiptCounter: 1 } },
      { new: true },
    );

    const receiptNo = formatReceiptNo(
      seqRegister.receiptPrefix,
      seqRegister.receiptCounter,
    );

    const sale = await Sale.create({
      clientSaleId,
      receiptNo,
      storeId,
      registerId,
      cashierId,
      lines: saleLines,
      subtotal,
      grandTotal,
      payments,
      changeGiven,
    });

    // Decrement store stock and write the SALE ledger entries.
    for (const line of saleLines) {
      await Stock.findOneAndUpdate(
        { productId: line.productId, storeId },
        { $inc: { quantity: -line.quantity } },
        { upsert: true, setDefaultsOnInsert: true },
      );

      await StockMovement.create({
        productId: line.productId,
        storeId,
        batchId: line.batchId,
        type: MOVEMENT_TYPES.SALE,
        quantity: -line.quantity,
        refType: "sale",
        refId: sale._id,
        actorId: cashierId,
      });
    }

    return {
      success: true,
      message: "Sale completed",
      data: { sale: shapeSale(sale) },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in completeSale");
  }
};

// Full receipt payload — store header/footer, register, cashier, lines,
// totals and payments — everything needed to render or reprint a receipt.
export const getSaleById = async (saleId) => {
  try {
    const sale = await Sale.findById(saleId)
      .populate("storeId", "name address phone currency receipt")
      .populate("registerId", "code name")
      .populate("cashierId", "fullName");

    if (!sale) {
      throw ApiError.notFound("Sale not found", ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const store = sale.storeId;

    return {
      success: true,
      message: "Sale fetched",
      data: {
        sale: {
          id: sale._id,
          receiptNo: sale.receiptNo,
          status: sale.status,
          soldAt: sale.soldAt,
          store: store
            ? {
                name: store.name,
                address: store.address,
                phone: store.phone,
                currency: store.currency,
                header: store.receipt?.header || "",
                footer: store.receipt?.footer || "",
              }
            : null,
          register: sale.registerId
            ? { code: sale.registerId.code, name: sale.registerId.name }
            : null,
          cashier: sale.cashierId ? sale.cashierId.fullName : null,
          lines: sale.lines.map((l) => ({
            name: l.name,
            barcode: l.barcode,
            batchNo: l.batchNo,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
          subtotal: sale.subtotal,
          discountTotal: sale.discountTotal,
          taxTotal: sale.taxTotal,
          grandTotal: sale.grandTotal,
          payments: sale.payments.map((p) => ({
            method: p.method,
            amount: p.amount,
          })),
          changeGiven: sale.changeGiven,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getSaleById");
  }
};
