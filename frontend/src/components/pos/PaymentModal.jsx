/**
 * Payment + complete-sale. Supports split tenders (cash/card/wallet),
 * shows paid / remaining / change, and posts the sale with a
 * client-generated UUID so a retry is idempotent (never double-posts).
 * On success it shows the receipt summary.
 */
import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Delete, Plus, Printer, X } from 'lucide-react';

import * as saleService from '../../services/saleService.js';
import { useApiMutation } from '../../hooks/api';
import { useCartStore } from '../../store/useCartStore.js';
import { useRegisterStore } from '../../store/useRegisterStore.js';
import { queryKeys, PAYMENT_METHODS } from '../../constants';
import { formatCurrency } from '../../utils/formatters.js';
import { Badge, Button, Modal, Select } from '../ui';
import ReceiptModal from './ReceiptModal.jsx';

const METHOD_OPTIONS = [
  { value: PAYMENT_METHODS.CASH, label: 'Cash' },
  { value: PAYMENT_METHODS.CARD, label: 'Card' },
  { value: PAYMENT_METHODS.WALLET, label: 'Wallet' },
];

const PaymentModal = ({ open, onClose, onCompleted }) => {
  const lines = useCartStore((state) => state.lines);
  const store = useRegisterStore((state) => state.store);
  const register = useRegisterStore((state) => state.register);

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines],
  );

  const [clientSaleId, setClientSaleId] = useState('');
  const [tenders, setTenders] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Fresh idempotency key + a default cash tender each time it opens.
  useEffect(() => {
    if (!open) return;

    setClientSaleId(crypto.randomUUID());
    setTenders([{ method: PAYMENT_METHODS.CASH, amount: String(total) }]);
    setActiveIndex(0);
    setCompletedSale(null);
  }, [open, total]);

  const paid = tenders.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const remaining = Math.max(0, total - paid);
  const change = Math.max(0, paid - total);

  const completeSale = useApiMutation(saleService.completeSale, {
    successMessage: 'Sale completed',
    invalidateKeys: [queryKeys.inventory.all, queryKeys.products.all],
    onSuccess: (sale) => setCompletedSale(sale),
  });

  const setTender = (index, field, value) =>
    setTenders((list) =>
      list.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );

  const addTender = () => {
    setTenders((list) => [
      ...list,
      { method: PAYMENT_METHODS.CARD, amount: String(remaining) },
    ]);
    setActiveIndex(tenders.length);
  };

  const removeTender = (index) => {
    setTenders((list) => list.filter((_, i) => i !== index));
    setActiveIndex(0);
  };

  // --- On-screen keypad: edits the active tender's amount ---
  const setActiveAmount = (next) => setTender(activeIndex, 'amount', next);
  const currentAmount = tenders[activeIndex]?.amount ?? '';

  const pressDigit = (digit) =>
    setActiveAmount((currentAmount + digit).replace(/^0+(?=\d)/, ''));
  const pressBackspace = () => setActiveAmount(currentAmount.slice(0, -1));
  const pressClear = () => setActiveAmount('');
  const addToAmount = (amount) =>
    setActiveAmount(String((Number(currentAmount) || 0) + amount));
  const fillExact = () =>
    setActiveAmount(String((Number(currentAmount) || 0) + remaining));

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'];
  const QUICK = [100, 500, 1000, 5000];

  const handleComplete = () => {
    completeSale.mutate({
      clientSaleId,
      storeId: store.id,
      registerId: register.id,
      lines: lines.map((l) => ({
        productId: l.productId,
        batchId: l.batchId || undefined,
        barcode: l.barcode || undefined,
        quantity: l.quantity,
      })),
      payments: tenders
        .map((t) => ({ method: t.method, amount: Number(t.amount) }))
        .filter((p) => p.amount > 0),
    });
  };

  const handleNewSale = () => {
    onCompleted();
    onClose();
  };

  // --- Success view ---
  if (completedSale) {
    return (
      <Modal
        open={open}
        onClose={handleNewSale}
        title="Sale completed"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              icon={<Printer size={16} aria-hidden="true" />}
              onClick={() => setReceiptOpen(true)}
            >
              Receipt
            </Button>
            <Button onClick={handleNewSale}>New sale</Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 size={44} className="text-success-500" aria-hidden="true" />
          <p className="text-lg font-semibold text-content">
            {completedSale.receiptNo}
          </p>
          <div className="w-full space-y-1 rounded-lg bg-surface-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Total</span>
              <span className="font-medium text-content">
                {formatCurrency(completedSale.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Paid</span>
              <span className="text-content">{formatCurrency(paid)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-success-600 dark:text-success-400">
              <span>Change</span>
              <span>{formatCurrency(completedSale.changeGiven)}</span>
            </div>
          </div>
        </div>

        <ReceiptModal
          open={receiptOpen}
          saleId={completedSale.id}
          onClose={() => setReceiptOpen(false)}
        />
      </Modal>
    );
  }

  // --- Payment entry view ---
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payment"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleComplete}
            loading={completeSale.isPending}
            disabled={paid < total || total <= 0}
          >
            Complete sale
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Left — tenders + running totals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
            <span className="text-sm font-medium text-muted">Total due</span>
            <span className="nums text-xl font-bold text-content">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="space-y-2">
            {tenders.map((tender, index) => {
              const active = index === activeIndex;
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-28 shrink-0">
                    <Select
                      value={tender.method}
                      onChange={(event) => setTender(index, 'method', event.target.value)}
                      options={METHOD_OPTIONS}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`nums flex h-10 flex-1 items-center justify-end rounded-lg border px-3 text-sm font-semibold text-content transition-colors ${
                      active
                        ? 'border-content ring-2 ring-content/10'
                        : 'border-line hover:border-line-strong'
                    }`}
                  >
                    {tender.amount ? formatCurrency(Number(tender.amount)) : '—'}
                  </button>
                  {tenders.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove tender"
                      onClick={() => removeTender(index)}
                      className="rounded-lg p-2 text-faint transition-colors hover:bg-surface-muted hover:text-content"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={addTender}
            >
              Split payment
            </Button>
          </div>

          <div className="space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Paid</span>
              <span className="nums">{formatCurrency(paid)}</span>
            </div>
            {remaining > 0 ? (
              <div className="flex justify-between font-medium text-danger-600 dark:text-danger-400">
                <span>Remaining</span>
                <span className="nums">{formatCurrency(remaining)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-base font-bold text-success-600 dark:text-success-400">
                <span>Change</span>
                <span className="nums">{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right — on-screen keypad */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={fillExact}
              className="col-span-1 h-9 rounded-lg border border-line text-xs font-semibold text-content transition-colors hover:bg-surface-muted"
            >
              Exact
            </button>
            {QUICK.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => addToAmount(amount)}
                className="nums h-9 rounded-lg border border-line text-xs font-semibold text-content transition-colors hover:bg-surface-muted"
              >
                +{amount}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pressDigit(key)}
                className="nums h-12 rounded-xl border border-line bg-surface text-lg font-semibold text-content transition-colors hover:bg-surface-muted active:bg-line"
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              onClick={pressBackspace}
              onDoubleClick={pressClear}
              aria-label="Backspace"
              className="flex h-12 items-center justify-center rounded-xl border border-line bg-surface text-content transition-colors hover:bg-surface-muted active:bg-line"
            >
              <Delete size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="text-center text-xs text-faint">
            <Badge variant="gray">
              {store?.name} · {register?.code}
            </Badge>
          </div>
        </div>
      </div>
    </Modal>
  );
};

PaymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCompleted: PropTypes.func.isRequired,
};

export default PaymentModal;
