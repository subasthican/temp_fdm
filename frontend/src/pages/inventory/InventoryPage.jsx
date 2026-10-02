/**
 * Inventory (Admin/Manager) — per-store stock on hand with low-stock
 * highlighting, receive-stock, and adjust actions.
 */
import { useEffect, useState } from 'react';
import { PackagePlus, Search, SlidersHorizontal } from 'lucide-react';

import * as inventoryService from '../../services/inventoryService.js';
import * as storeService from '../../services/storeService.js';
import { useApiQuery } from '../../hooks/api';
import { useDebounce } from '../../hooks/useDebounce.js';
import { queryKeys, SEARCH_DEBOUNCE_MS } from '../../constants';
import ReceiveStockModal from '../../components/inventory/ReceiveStockModal.jsx';
import AdjustStockModal from '../../components/inventory/AdjustStockModal.jsx';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
} from '../../components/ui';

const InventoryPage = () => {
  const [storeId, setStoreId] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [adjust, setAdjust] = useState({ open: false, stock: null });

  const { data: storesData } = useApiQuery(
    queryKeys.stores.list({ isActive: true }),
    () => storeService.getStores({ isActive: true }),
  );

  const stores = storesData?.data || [];

  // Default to the first store once stores load.
  useEffect(() => {
    const list = storesData?.data || [];
    if (list.length > 0) setStoreId((current) => current || list[0].id);
  }, [storesData]);

  const filters = { storeId, search: debouncedSearch };

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.inventory.stock(filters),
    () => inventoryService.getStock(filters),
    { enabled: Boolean(storeId) },
  );

  const rows = data?.data || [];

  const columns = [
    { key: 'sku', header: 'SKU', render: (row) => row.product.sku },
    { key: 'name', header: 'Product', render: (row) => row.product.name },
    {
      key: 'pricingMode',
      header: 'Pricing',
      render: (row) => (
        <Badge variant={row.product.pricingMode === 'batch' ? 'info' : 'gray'}>
          {row.product.pricingMode === 'batch' ? 'Batch MRP' : 'Product'}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      header: 'On hand',
      render: (row) => (
        <span className={row.lowStock ? 'font-semibold text-danger-600' : ''}>
          {row.quantity}
        </span>
      ),
    },
    { key: 'reorderLevel', header: 'Reorder at' },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.lowStock ? (
          <Badge variant="danger">Low stock</Badge>
        ) : (
          <Badge variant="success">OK</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<SlidersHorizontal size={15} aria-hidden="true" />}
          onClick={() => setAdjust({ open: true, stock: row })}
        >
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Stock on hand per store"
        actions={
          <Button
            icon={<PackagePlus size={16} aria-hidden="true" />}
            onClick={() => setReceiveOpen(true)}
            disabled={!storeId}
          >
            Receive stock
          </Button>
        }
      />

      <Card padding={false}>
        <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
          <div className="w-56">
            <Select
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
              options={stores.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select store"
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or SKU..."
              leftIcon={<Search size={16} aria-hidden="true" />}
            />
          </div>
        </div>

        {!storeId ? (
          <EmptyState title="No store selected" message="Pick a store to view stock." />
        ) : isLoading ? (
          <LoadingState message="Loading stock..." />
        ) : errorMessage ? (
          <EmptyState title="Could not load stock" message={errorMessage} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No stock yet"
            message="Receive stock to start tracking inventory for this store."
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey="id" />
        )}
      </Card>

      <ReceiveStockModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        storeId={storeId}
        stores={stores}
      />

      <AdjustStockModal
        open={adjust.open}
        stock={adjust.stock}
        storeId={storeId}
        onClose={() => setAdjust({ open: false, stock: null })}
      />
    </div>
  );
};

export default InventoryPage;
