/**
 * The live cart — used both as the desktop side panel and the mobile
 * bottom sheet. Renders the header, the scrollable line list (with qty
 * steppers and batch info), the totals, and the Charge / Clear actions.
 */
import PropTypes from 'prop-types';
import { Layers, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';

import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Button } from '../ui';

const CartPanel = ({
  lines,
  batchInfo,
  totals,
  storeName,
  registerCode,
  onInc,
  onDec,
  onQty,
  onRemove,
  onOpenBatch,
  onCharge,
  onClear,
  onClose,
}) => {
  const { itemCount, subtotal, grandTotal } = totals;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-content">
          <ShoppingCart size={17} aria-hidden="true" />
          Current sale
          {itemCount > 0 && (
            <span className="nums rounded-full bg-ink px-2 py-0.5 text-xs text-ink-content">
              {itemCount}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="hidden truncate text-xs text-muted sm:block">
            {storeName} · {registerCode}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-content lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </span>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-faint">
            <ShoppingCart size={34} aria-hidden="true" />
            <p className="text-sm">Tap or scan an item to start</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {lines.map((line) => {
              const multiBatch = (batchInfo[line.productId] || []).length > 1;

              return (
                <li key={line.key} className="p-3">
                  {/* Row 1 — name, line total, remove */}
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-content">
                      {line.name}
                    </p>
                    <span className="nums shrink-0 text-sm font-semibold text-content">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => onRemove(line.key)}
                      className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-faint transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Meta — unit price, batch, expiry */}
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                    <span className="nums shrink-0">
                      {formatCurrency(line.unitPrice)}
                    </span>
                    {line.batchNo && (
                      <span className="truncate">
                        · {line.batchNo}
                        {line.expiryDate && ` · exp ${formatDate(line.expiryDate)}`}
                      </span>
                    )}
                    {multiBatch && (
                      <button
                        type="button"
                        onClick={() => onOpenBatch(line)}
                        className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 font-medium text-content underline-offset-2 hover:underline"
                      >
                        <Layers size={11} aria-hidden="true" /> change
                      </button>
                    )}
                  </div>

                  {/* Row 2 — quantity stepper */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="nums text-xs text-faint">
                      {line.quantity} × {formatCurrency(line.unitPrice)}
                    </span>

                    <div className="inline-flex items-center rounded-lg border border-line bg-surface">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => onDec(line.key)}
                        className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted transition-colors hover:bg-surface-muted hover:text-content"
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={line.quantity}
                        onChange={(event) => onQty(line, event.target.value)}
                        aria-label={`Quantity for ${line.name}`}
                        className="nums h-8 w-10 border-x border-line bg-transparent text-center text-sm font-medium text-content outline-none focus:bg-surface-muted"
                      />
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => onInc(line.key)}
                        className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted transition-colors hover:bg-surface-muted hover:text-content"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-line p-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Items</span>
            <span className="nums">{itemCount}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold text-content">
            <span>Total</span>
            <span className="nums">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <Button
            variant="success"
            size="lg"
            fullWidth
            disabled={lines.length === 0}
            onClick={onCharge}
          >
            Charge {formatCurrency(grandTotal)}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            icon={<Trash2 size={16} aria-hidden="true" />}
            disabled={lines.length === 0}
            onClick={onClear}
          >
            Clear sale
          </Button>
        </div>
      </div>
    </div>
  );
};

CartPanel.propTypes = {
  lines: PropTypes.array.isRequired,
  batchInfo: PropTypes.object.isRequired,
  totals: PropTypes.shape({
    itemCount: PropTypes.number,
    subtotal: PropTypes.number,
    grandTotal: PropTypes.number,
  }).isRequired,
  storeName: PropTypes.string,
  registerCode: PropTypes.string,
  onInc: PropTypes.func.isRequired,
  onDec: PropTypes.func.isRequired,
  onQty: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onOpenBatch: PropTypes.func.isRequired,
  onCharge: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export default CartPanel;
