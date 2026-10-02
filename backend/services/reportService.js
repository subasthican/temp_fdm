import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import Stock from "../models/Stock.js";
import handleServiceError from "../utils/handleServiceError.js";
import { SALE_STATUS } from "../config/constants.js";

// Current on-hand snapshot (not date-ranged): total units, stock value
// (qty × per-store cost), low-stock count, and SKU count. Excludes
// soft-deleted products. Scoped to a store when given.
const getStockSnapshot = async (storeId) => {
  const match = {};
  if (storeId) match.storeId = new mongoose.Types.ObjectId(storeId);

  const [snapshot] = await Stock.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "productstoreprices",
        let: { pid: "$productId", sid: "$storeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$productId", "$$pid"] },
                  { $eq: ["$storeId", "$$sid"] },
                ],
              },
            },
          },
        ],
        as: "price",
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $addFields: { price: { $first: "$price" }, product: { $first: "$product" } } },
    { $match: { "product.isDeleted": { $ne: true } } },
    {
      $group: {
        _id: null,
        totalUnits: { $sum: "$quantity" },
        stockValue: {
          $sum: {
            $multiply: ["$quantity", { $ifNull: ["$price.cost", 0] }],
          },
        },
        lowStock: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$price.reorderLevel", 0] },
                  { $lte: ["$quantity", "$price.reorderLevel"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        skus: { $sum: 1 },
      },
    },
  ]);

  return (
    snapshot || { totalUnits: 0, stockValue: 0, lowStock: 0, skus: 0 }
  );
};

// ============================================
// Dashboard / Reports
// ============================================

// One aggregation ($facet) over completed sales in the window returns
// every dashboard block at once: headline summary, tender split, top
// products, and the daily sales series.
export const getDashboard = async (filters = {}) => {
  try {
    const match = { status: SALE_STATUS.COMPLETED };

    if (filters.storeId) {
      match.storeId = new mongoose.Types.ObjectId(filters.storeId);
    }

    if (filters.from || filters.to) {
      match.soldAt = {};
      if (filters.from) match.soldAt.$gte = new Date(filters.from);
      if (filters.to) match.soldAt.$lte = new Date(filters.to);
    }

    const [result] = await Sale.aggregate([
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                revenue: { $sum: "$grandTotal" },
                salesCount: { $sum: 1 },
                itemsSold: { $sum: { $sum: "$lines.quantity" } },
              },
            },
          ],
          tenders: [
            { $unwind: "$payments" },
            {
              $group: {
                _id: "$payments.method",
                amount: { $sum: "$payments.amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { amount: -1 } },
          ],
          // Change is always cash — subtracted from the cash tender below
          // so tender totals reflect money kept, not money handled.
          change: [
            { $group: { _id: null, total: { $sum: "$changeGiven" } } },
          ],
          topProducts: [
            { $unwind: "$lines" },
            {
              $group: {
                _id: "$lines.productId",
                name: { $first: "$lines.name" },
                qty: { $sum: "$lines.quantity" },
                revenue: { $sum: "$lines.lineTotal" },
              },
            },
            { $sort: { qty: -1 } },
            { $limit: 8 },
          ],
          daily: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$soldAt" },
                },
                revenue: { $sum: "$grandTotal" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const summary = result.summary[0] || {
      revenue: 0,
      salesCount: 0,
      itemsSold: 0,
    };

    const averageBasket = summary.salesCount
      ? summary.revenue / summary.salesCount
      : 0;

    const changeTotal = result.change[0]?.total || 0;

    const stock = await getStockSnapshot(filters.storeId);

    return {
      success: true,
      message: "Dashboard fetched",
      data: {
        summary: {
          revenue: summary.revenue,
          salesCount: summary.salesCount,
          itemsSold: summary.itemsSold,
          averageBasket,
        },
        stock: {
          totalUnits: stock.totalUnits,
          stockValue: stock.stockValue,
          lowStock: stock.lowStock,
          skus: stock.skus,
        },
        tenders: result.tenders.map((t) => ({
          method: t._id,
          // Net of change for cash so the split matches revenue.
          amount: t._id === "cash" ? t.amount - changeTotal : t.amount,
          count: t.count,
        })),
        topProducts: result.topProducts.map((p) => ({
          productId: p._id,
          name: p.name,
          qty: p.qty,
          revenue: p.revenue,
        })),
        daily: result.daily.map((d) => ({
          date: d._id,
          revenue: d.revenue,
          count: d.count,
        })),
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getDashboard");
  }
};
