/**
 * Receive stock — the manual stock-in form. Creates a batch (with expiry
 * and MRP), bumps on-hand, and logs a movement via the shared
 * receiveStock service. Batch MRP is what rings up for batch-priced items.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as inventoryService from '../../services/inventoryService.js';
import * as productService from '../../services/productService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import {
  Button,
  Input,
  Modal,
  SearchableSelect,
  Select,
} from '../ui';

const emptyForm = () => ({
  productId: '',
  batchNo: '',
  expiryDate: '',
  quantity: '',
  cost: '',
  sellPrice: '',
});

const ReceiveStockModal = ({ open, onClose, storeId, stores }) => {
  const [form, setForm] = useState(emptyForm());
  const [selectedStore, setSelectedStore] = useState(storeId || '');

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setSelectedStore(storeId || '');
    }
  }, [open, storeId]);

  const { data: productsData } = useApiQuery(
    queryKeys.products.list({ isActive: true }),
    () => productService.getProducts({ isActive: true }),
    { enabled: open },
  );

  const productOptions = (productsData?.data || []).map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
  }));

  const receive = useApiMutation(inventoryService.receiveStock, {
    successMessage: 'Stock received',
    invalidateKeys: [queryKeys.inventory.all, queryKeys.products.all],
    onSuccess: () => onClose(),
  });

  const setField = (field) => (event) =>
    setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = () => {
    receive.mutate({
      productId: form.productId,
      storeId: selectedStore,
      batchNo: form.batchNo,
      expiryDate: form.expiryDate || undefined,
      quantity: Number(form.quantity),
      cost: Number(form.cost) || 0,
      sellPrice: Number(form.sellPrice) || 0,
    });
  };

  const valid = form.productId && selectedStore && Number(form.quantity) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receive stock"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={receive.isPending} disabled={!valid}>
            Receive
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SearchableSelect
          label="Product"
          options={productOptions}
          value={form.productId}
          onChange={(value) => setForm((f) => ({ ...f, productId: value }))}
          placeholder="Search product..."
        />

        <Select
          label="Store"
          value={selectedStore}
          onChange={(event) => setSelectedStore(event.target.value)}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Batch no."
            value={form.batchNo}
            onChange={setField('batchNo')}
            placeholder="Auto-generated if blank"
            helperText="Leave blank to auto-generate"
          />
          <Input
            label="Expiry date"
            type="date"
            value={form.expiryDate}
            onChange={setField('expiryDate')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={setField('quantity')}
          />
          <Input
            label="Cost"
            type="number"
            min="0"
            value={form.cost}
            onChange={setField('cost')}
          />
          <Input
            label="MRP / sell"
            type="number"
            min="0"
            value={form.sellPrice}
            onChange={setField('sellPrice')}
            helperText="Batch price"
          />
        </div>
      </div>
    </Modal>
  );
};

ReceiveStockModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  storeId: PropTypes.string,
  stores: PropTypes.array.isRequired,
};

export default ReceiveStockModal;
