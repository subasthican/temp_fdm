/**
 * Pure display formatters. Currency is ALWAYS formatCurrency() — never
 * manual `Rs. ${x}` strings.
 */
import { CURRENCY } from '../constants';

export const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return `${CURRENCY.SYMBOL} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: CURRENCY.DECIMALS,
    maximumFractionDigits: CURRENCY.DECIMALS,
  })}`;
};

export const formatDate = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
