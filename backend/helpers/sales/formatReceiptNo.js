import { RECEIPT_CONFIG } from "../../config/constants.js";

// Builds a receipt number from a register's prefix and its sequence,
// e.g. ("S01", 148) -> "S01-000148". Extracted so online completion and
// offline sync format numbers identically.
export const formatReceiptNo = (prefix, seq) => {
  const padded = String(seq).padStart(RECEIPT_CONFIG.SEQ_DIGITS, "0");

  return `${prefix}-${padded}`;
};

export default formatReceiptNo;
