/**
 * Adjust stock — add or remove a quantity with a reason (damage, wastage,
 * count correction, ...). Logged as a signed movement.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as inventoryService from '../../services/inventoryService.js';
import { useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import { Button, Input, Modal, Select } from '../ui';

const REASONS = [
  { value: 'damage', label: 'Damage' },
  { value: 'wastage', label: 'Wastage' },
  { value: 'count_correction', label: 'Count correction' },
  { value: 'expiry', label: 'Expiry' },
  { value: 'theft', label: 'Theft' },
  { value: 'other', label: 'Other' },
];

const AdjustStockModal = ({ open, onClose, stock, storeId }) => {
  const [direction, setDirection] = useState('remove');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('count_correction');

  useEffect(() => {
    if (open) {
      setDirection('remove');
      setQuantity('');
      setReason('count_correction');
    }
  }, [open]);

  const adjust = useApiMutation(inventoryService.adjustStock, {
    successMessage: 'Stock adjusted',
    invalidateKeys: [queryKeys.inventory.all],
    onSuccess: () => onClose(),
  });

  const handleSubmit = () => {
    const magnitude = Number(quantity);
    const delta = direction === 'remove' ? -magnitude : magnitude;

    adjust.mutate({
      productId: stock.product.id,
      storeId,
      delta,
      reason,
    });
  };

  if (!stock) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Adjust — ${stock.product.name}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={adjust.isPending}
            disabled={!(Number(quantity) > 0)}
          >
            Apply
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          On hand: <span className="font-medium text-gray-900">{stock.quantity}</span>
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
            options={[
              { value: 'remove', label: 'Remove (−)' },
              { value: 'add', label: 'Add (+)' },
            ]}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>

        <Select
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          options={REASONS}
        />
      </div>
    </Modal>
  );
};

AdjustStockModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stock: PropTypes.object,
  storeId: PropTypes.string,
};

export default AdjustStockModal;
