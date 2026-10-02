import Stock from "../../models/Stock.js";

// Upserts the running Stock balance for a product/store by a signed delta
// and returns the updated document. The StockMovement ledger records the
// same change separately — this only keeps the fast-read total in step.
export const applyStockDelta = async (productId, storeId, delta) => {
  const stock = await Stock.findOneAndUpdate(
    { productId, storeId },
    { $inc: { quantity: delta } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return stock;
};

export default applyStockDelta;
