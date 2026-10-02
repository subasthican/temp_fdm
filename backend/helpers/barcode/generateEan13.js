import { BARCODE_CONFIG } from "../../config/constants.js";

// Computes the EAN-13 check digit for the first 12 digits: digits are
// weighted 1,3,1,3,... from the left, and the check digit brings the
// weighted sum up to the next multiple of 10.
const ean13CheckDigit = (twelveDigits) => {
  let sum = 0;

  for (let i = 0; i < 12; i += 1) {
    const digit = Number(twelveDigits[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  return (10 - (sum % 10)) % 10;
};

// Mints a full 13-digit in-store EAN-13: the reserved prefix, a random
// body, and the computed check digit. Uniqueness is enforced by the
// caller (retry on collision).
export const generateEan13 = () => {
  const prefix = BARCODE_CONFIG.INSTORE_PREFIX;

  const bodyLength = 12 - prefix.length;
  let body = "";
  for (let i = 0; i < bodyLength; i += 1) {
    body += Math.floor(Math.random() * 10);
  }

  const twelve = `${prefix}${body}`;

  return `${twelve}${ean13CheckDigit(twelve)}`;
};

export default generateEan13;
