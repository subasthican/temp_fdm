/**
 * React Query key factories. Never write a raw key array in a page —
 * always use (and extend) these factories.
 */

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'],
  },
  users: {
    all: ['users'],
    list: (filters) => ['users', 'list', filters],
    detail: (id) => ['users', 'detail', id],
  },
  products: {
    all: ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    prices: (id) => ['products', 'prices', id],
  },
  suppliers: {
    all: ['suppliers'],
    list: (filters) => ['suppliers', 'list', filters],
    detail: (id) => ['suppliers', 'detail', id],
  },
  stores: {
    all: ['stores'],
    list: (filters) => ['stores', 'list', filters],
    detail: (id) => ['stores', 'detail', id],
  },
  registers: {
    all: ['registers'],
    list: (filters) => ['registers', 'list', filters],
    detail: (id) => ['registers', 'detail', id],
  },
  categories: {
    all: ['categories'],
    list: (filters) => ['categories', 'list', filters],
  },
  brands: {
    all: ['brands'],
    list: (filters) => ['brands', 'list', filters],
  },
  taxClasses: {
    all: ['taxClasses'],
    list: (filters) => ['taxClasses', 'list', filters],
  },
  inventory: {
    all: ['inventory'],
    stock: (filters) => ['inventory', 'stock', filters],
    batches: (filters) => ['inventory', 'batches', filters],
    movements: (filters) => ['inventory', 'movements', filters],
  },
  sales: {
    all: ['sales'],
    receipt: (id) => ['sales', 'receipt', id],
  },
  reports: {
    dashboard: (filters) => ['reports', 'dashboard', filters],
  },
};
