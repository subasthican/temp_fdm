/**
 * Global app constants — roles, routes, payments, currency, pagination.
 * Any string/number used in two files, or mirroring a backend enum,
 * belongs here — never inline.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
});

export const BACK_OFFICE_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER]);

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
});

export const CURRENCY = Object.freeze({
  SYMBOL: 'Rs.',
  DECIMALS: 2,
});

export const ROUTES = Object.freeze({
  LOGIN: '/login',
  DASHBOARD: '/',
  POS: '/pos',
  SELECT_REGISTER: '/select-register',
  STORES: '/stores',
  CATALOG: '/catalog',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  INVENTORY: '/inventory',
  SUPPLIERS: '/suppliers',
  CUSTOMERS: '/customers',
  REPORTS: '/reports',
  USERS: '/users',
  SETTINGS: '/settings',
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
});

export const SEARCH_DEBOUNCE_MS = 350;
