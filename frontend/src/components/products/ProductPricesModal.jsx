/**
 * Per-store pricing for one product — a row per active store with
 * editable cost / sell price / reorder level, upserted on save.
 * For BATCH-priced products the sell price here is a default/fallback
 * (batch MRP wins at billing).
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as productService from '../../services/productService.js';
import * as storeService from '../../services/storeService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  LoadingState,
  Modal,
} from '../ui';

const ProductPricesModal = ({ open, onClose, product }) => {
  const [rows, setRows] = useState({});

  const { data: storesData, isLoading: storesLoading } = useApiQuery(
    queryKeys.stores.list({ isActive: true }),
    () => storeService.getStores({ isActive: true }),
    { enabled: open },
  );

  const {
    data: productData,
    isLoading: productLoading,
    errorMessage,
  } = useApiQuery(
    queryKeys.products.detail(product?.id),
    () => productService.getProductById(product.id),
    { enabled: open && Boolean(product) },
  );

  const stores = storesData?.data || [];

  // Seed the editable rows from existing prices whenever data arrives.
  useEffect(() => {
    if (!open || !productData) return;

    const byStore = {};
    (productData.prices || []).forEach((price) => {
      if (price.store) {
        byStore[price.store.id] = {
          cost: price.cost,
          sellPrice: price.sellPrice,
          reorderLevel: price.reorderLevel,
        };
      }
    });

    const seeded = {};
    (storesData?.data || []).forEach((store) => {
      seeded[store.id] = byStore[store.id] || {
        cost: '',
        sellPrice: '',
        reorderLevel: '',
      };
    });

    setRows(seeded);
  }, [open, productData, storesData]);

  const setCell = (storeId, field) => (event) =>
    setRows((current) => ({
      ...current,
      [storeId]: { ...current[storeId], [field]: event.target.value },
    }));

  const savePrice = useApiMutation(productService.setProductPrice, {
    successMessage: 'Price saved',
    invalidateKeys: [
      queryKeys.products.all,
      queryKeys.products.detail(product?.id),
    ],
  });

  const handleSave = (storeId) => {
    const row = rows[storeId] || {};

    savePrice.mutate({
      id: product.id,
      storeId,
      cost: Number(row.cost) || 0,
      sellPrice: Number(row.sellPrice) || 0,
      reorderLevel: Number(row.reorderLevel) || 0,
    });
  };

  if (!product) return null;

  const loading = storesLoading || productLoading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pricing — ${product.name}`}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {product.pricingMode === 'batch' && (
        <div className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800">
          This product is <strong>batch-priced</strong> — the sell price
          below is only a fallback. The batch MRP is what rings up at the
          till.
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading pricing..." />
      ) : errorMessage ? (
        <EmptyState title="Could not load pricing" message={errorMessage} />
      ) : stores.length === 0 ? (
        <EmptyState
          title="No active stores"
          message="Create a store before setting prices."
        />
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <div
              key={store.id}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {store.name}
                </span>
                <Badge variant="gray">{store.code}</Badge>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <Input
                    label="Cost"
                    type="number"
                    min="0"
                    value={rows[store.id]?.cost ?? ''}
                    onChange={setCell(store.id, 'cost')}
                  />
                </div>
                <div className="w-28">
                  <Input
                    label="Sell price"
                    type="number"
                    min="0"
                    value={rows[store.id]?.sellPrice ?? ''}
                    onChange={setCell(store.id, 'sellPrice')}
                  />
                </div>
                <div className="w-28">
                  <Input
                    label="Reorder at"
                    type="number"
                    min="0"
                    value={rows[store.id]?.reorderLevel ?? ''}
                    onChange={setCell(store.id, 'reorderLevel')}
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => handleSave(store.id)}
                  loading={savePrice.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

ProductPricesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
};

export default ProductPricesModal;
