/**
 * POS checkout (cashier) — a tappable product wall on the left and the
 * live cart on the right (a slide-up sheet on small screens). Products can
 * be scanned (barcode → Enter), searched, or tapped from the grid; the
 * category bar scrolls horizontally. Batch-priced items are allocated
 * across batches FEFO with automatic overflow, a line's batch can be
 * overridden, and quantity typed directly.
 */
import { useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutGrid, Package, ScanBarcode, Search, ShoppingCart } from 'lucide-react';

import * as saleService from '../../services/saleService.js';
import * as productService from '../../services/productService.js';
import * as categoryService from '../../services/categoryService.js';
import { useApiQuery } from '../../hooks/api';
import { useRegisterStore } from '../../store/useRegisterStore.js';
import { useCartStore } from '../../store/useCartStore.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency } from '../../utils/formatters.js';
import { ROUTES } from '../../constants';
import CartPanel from '../../components/pos/CartPanel.jsx';
import PaymentModal from '../../components/pos/PaymentModal.jsx';
import BatchPickerModal from '../../components/pos/BatchPickerModal.jsx';

const ALL = 'all';

const POSPage = () => {
  const store = useRegisterStore((state) => state.store);
  const register = useRegisterStore((state) => state.register);

  const {
    lines,
    batchInfo,
    addUnits,
    incLine,
    decLine,
    setLineQuantity,
    changeLineBatch,
    removeLine,
    clear,
    totals,
  } = useCartStore();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [batchOverride, setBatchOverride] = useState({
    open: false,
    lineKey: null,
    item: null,
  });
  const barcodeRef = useRef(null);

  const { data: productsData, isLoading } = useApiQuery(
    ['products', 'pos-search'],
    () => productService.getProducts({ isActive: true, limit: 200 }),
    { enabled: Boolean(store) },
  );

  const { data: categoriesData } = useApiQuery(
    ['categories', 'pos'],
    () => categoryService.getCategories({ isActive: true }),
    { enabled: Boolean(store) },
  );

  const products = useMemo(() => productsData?.data || [], [productsData]);
  const categories = categoriesData?.data || [];

  const term = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const inCategory = category === ALL || p.category?.id === category;
        const matches =
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term);
        return inCategory && matches;
      }),
    [products, category, term],
  );

  const countFor = (categoryId) =>
    products.filter((p) => p.category?.id === categoryId).length;

  if (!register) {
    return <Navigate to={ROUTES.SELECT_REGISTER} replace />;
  }

  const resolveAndAdd = async (lookup) => {
    try {
      const res = await saleService.lookupItem({ storeId: store.id, ...lookup });
      const { added, requested } = addUnits(res, 1);
      if (added < requested) toast.error(`${res.name} is out of stock`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (filtered.length === 1) {
      resolveAndAdd({ productId: filtered[0].id });
    } else {
      resolveAndAdd({ barcode: q });
    }
    setQuery('');
    barcodeRef.current?.focus();
  };

  const handleQtyInput = (line, value) => {
    const { added, requested } = setLineQuantity(line.key, Number(value));
    if (requested > 0 && added < requested && line.batchId) {
      toast.error(`Only ${line.name} up to available stock could be added`);
    }
  };

  const openBatchOverride = (line) => {
    setBatchOverride({
      open: true,
      lineKey: line.key,
      item: { name: line.name, batches: batchInfo[line.productId] || [] },
    });
  };

  const cartTotals = totals();

  const chips = [
    { id: ALL, name: 'All', count: products.length },
    ...categories.map((c) => ({ id: c.id, name: c.name, count: countFor(c.id) })),
  ];

  const cartProps = {
    lines,
    batchInfo,
    totals: cartTotals,
    storeName: store?.name,
    registerCode: register?.code,
    onInc: incLine,
    onDec: decLine,
    onQty: handleQtyInput,
    onRemove: removeLine,
    onOpenBatch: openBatchOverride,
    onCharge: () => {
      setCartOpen(false);
      setPaymentOpen(true);
    },
    onClear: clear,
  };

  return (
    <div className="flex h-full flex-col gap-3 bg-app p-3 lg:flex-row">
      {/* Main — search, categories, product wall */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <form onSubmit={handleSubmit} className="relative shrink-0">
          <Search
            size={18}
            className="pointer-events-none absolute inset-y-0 left-3.5 my-auto text-faint"
            aria-hidden="true"
          />
          <input
            ref={barcodeRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Scan a barcode, or search by name / SKU"
            aria-label="Scan or search"
            autoFocus
            className="h-11 w-full rounded-xl border border-line bg-surface pl-11 pr-10 text-sm text-content placeholder-faint outline-none transition-colors focus:border-content focus:ring-2 focus:ring-content/10"
          />
          <ScanBarcode
            size={18}
            className="pointer-events-none absolute inset-y-0 right-3.5 my-auto text-faint"
            aria-hidden="true"
          />
        </form>

        {/* Category bar — horizontal scroll */}
        <div className="scrollbar-thin -mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((chip) => {
            const active = category === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategory(chip.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-transparent bg-ink text-ink-content'
                    : 'border-line bg-surface text-muted hover:text-content'
                }`}
              >
                {chip.id === ALL && <LayoutGrid size={14} aria-hidden="true" />}
                {chip.name}
                <span
                  className={`nums rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-surface-muted text-faint'}`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product wall */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto rounded-xl border border-line bg-surface p-2.5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-faint">
              <Package size={32} aria-hidden="true" />
              <p className="text-sm">No products here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => resolveAndAdd({ productId: product.id })}
                  className="flex min-h-[74px] flex-col justify-between rounded-lg border border-line bg-surface p-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-content/10"
                >
                  <span className="line-clamp-2 text-xs font-medium leading-snug text-content">
                    {product.name}
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] text-faint">
                      {product.sku}
                    </span>
                    {product.pricingMode === 'batch' && (
                      <span className="shrink-0 rounded bg-surface-muted px-1 text-[10px] font-medium text-muted">
                        MRP
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart — desktop side panel */}
      <aside className="hidden overflow-hidden rounded-xl border border-line lg:flex lg:w-[22rem] xl:w-96">
        <CartPanel {...cartProps} />
      </aside>

      {/* Cart — mobile summary bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface p-3 shadow-overlay lg:hidden">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-content"
          aria-label="View cart"
        >
          <ShoppingCart size={20} aria-hidden="true" />
          {cartTotals.itemCount > 0 && (
            <span className="nums absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-ink-content">
              {cartTotals.itemCount}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Total</p>
          <p className="nums truncate text-base font-bold text-content">
            {formatCurrency(cartTotals.grandTotal)}
          </p>
        </div>
        <button
          type="button"
          disabled={lines.length === 0}
          onClick={() => setPaymentOpen(true)}
          className="h-11 shrink-0 rounded-xl bg-success-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-success-700 disabled:opacity-50"
        >
          Charge
        </button>
      </div>

      {/* Cart — mobile slide-up sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t border-line bg-surface shadow-overlay animate-slide-down">
            <CartPanel {...cartProps} onClose={() => setCartOpen(false)} />
          </div>
        </div>
      )}

      <BatchPickerModal
        open={batchOverride.open}
        item={batchOverride.item}
        onClose={() => setBatchOverride({ open: false, lineKey: null, item: null })}
        onPick={(batch) => {
          changeLineBatch(batchOverride.lineKey, batch);
          setBatchOverride({ open: false, lineKey: null, item: null });
          barcodeRef.current?.focus();
        }}
      />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onCompleted={() => {
          clear();
          barcodeRef.current?.focus();
        }}
      />
    </div>
  );
};

export default POSPage;
