import { BATCH_CONFIG } from "../../config/constants.js";

// Builds a readable auto batch number from a product's SKU and the next
// per-product sequence, e.g. ("SUG1KG", 3) -> "SUG1KG-B003". Used when a
// stock-in supplies no supplier/lot batch number of its own.
export const generateBatchNo = (sku, seq) => {
  const padded = String(seq).padStart(BATCH_CONFIG.SEQ_DIGITS, "0");

  return `${sku}${BATCH_CONFIG.INFIX}${padded}`;
};

export default generateBatchNo;
