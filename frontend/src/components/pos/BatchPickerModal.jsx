/**
 * Batch picker — shown at checkout only when a scanned batch-priced
 * product has multiple in-stock batches at different MRPs. The cashier
 * picks the batch matching the pack's printed price. Defaults to FEFO
 * (earliest expiry, listed first and highlighted).
 */
import PropTypes from 'prop-types';
import { CalendarClock } from 'lucide-react';

import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Badge, Modal } from '../ui';

const BatchPickerModal = ({ open, item, onClose, onPick }) => {
  if (!item) return null;

  const batches = item.batches || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Choose batch — ${item.name}`}
      size="sm"
    >
      <p className="mb-3 text-sm text-muted">
        This item has batches at different prices. Pick the one matching the
        pack.
      </p>

      <ul className="space-y-2">
        {batches.map((batch, index) => (
          <li key={batch.id}>
            <button
              type="button"
              onClick={() => onPick(batch)}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-muted ${
                index === 0 ? 'border-content/25 bg-surface-muted' : 'border-line'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="nums text-sm font-semibold text-content">
                    {formatCurrency(batch.sellPrice)}
                  </span>
                  {index === 0 && <Badge variant="gray">FEFO</Badge>}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <CalendarClock size={12} aria-hidden="true" />
                  {batch.batchNo || 'No batch no.'}
                  {batch.expiryDate && ` · exp ${formatDate(batch.expiryDate)}`}
                </p>
              </div>

              <span className="text-xs text-muted">{batch.available} in stock</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
};

BatchPickerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
};

export default BatchPickerModal;
