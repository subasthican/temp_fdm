/**
 * Stores management (Admin) — the reference CRUD page: list with search,
 * create/edit modal, deactivate via confirmDialog, and registers per
 * store. Copy this page's patterns for every new resource.
 */
import { useState } from 'react';
import { MonitorSmartphone, Pencil, Plus, Search } from 'lucide-react';

import * as storeService from '../../services/storeService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { useDebounce } from '../../hooks/useDebounce.js';
import { queryKeys, SEARCH_DEBOUNCE_MS } from '../../constants';
import StoreFormModal from '../../components/stores/StoreFormModal.jsx';
import StoreRegistersModal from '../../components/stores/StoreRegistersModal.jsx';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  confirmDialog,
} from '../../components/ui';

const StoresPage = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const [formModal, setFormModal] = useState({ open: false, store: null });
  const [registersModal, setRegistersModal] = useState({
    open: false,
    store: null,
  });

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.stores.list({ search: debouncedSearch }),
    () => storeService.getStores({ search: debouncedSearch }),
  );

  const stores = data?.data || [];

  const deactivateStore = useApiMutation(storeService.deactivateStore, {
    successMessage: 'Store deactivated',
    invalidateKeys: [queryKeys.stores.all],
  });

  const handleDeactivate = async (store) => {
    const ok = await confirmDialog({
      title: 'Deactivate store?',
      message: `"${store.name}" will stop accepting sales. Its history is kept.`,
      confirmText: 'Deactivate',
    });

    if (ok) deactivateStore.mutate(store.id);
  };

  const columns = [
    { key: 'code', header: 'Code', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'address', header: 'Address' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'isActive',
      header: 'Status',
      render: (store) => (
        <Badge variant={store.isActive ? 'success' : 'gray'}>
          {store.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (store) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Registers of ${store.name}`}
            icon={<MonitorSmartphone size={15} aria-hidden="true" />}
            onClick={() => setRegistersModal({ open: true, store })}
          >
            Registers
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${store.name}`}
            icon={<Pencil size={15} aria-hidden="true" />}
            onClick={() => setFormModal({ open: true, store })}
          />

          {store.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeactivate(store)}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stores"
        subtitle="Branches and their checkout registers"
        actions={
          <Button
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setFormModal({ open: true, store: null })}
          >
            New store
          </Button>
        }
      />

      <Card padding={false}>
        <div className="border-b border-gray-100 p-4">
          <div className="max-w-xs">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or code..."
              leftIcon={<Search size={16} aria-hidden="true" />}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading stores..." />
        ) : errorMessage ? (
          <EmptyState title="Could not load stores" message={errorMessage} />
        ) : stores.length === 0 ? (
          <EmptyState
            title="No stores yet"
            message="Create your first branch to get started."
          />
        ) : (
          <DataTable columns={columns} rows={stores} rowKey="id" />
        )}
      </Card>

      <StoreFormModal
        open={formModal.open}
        store={formModal.store}
        onClose={() => setFormModal({ open: false, store: null })}
      />

      <StoreRegistersModal
        open={registersModal.open}
        store={registersModal.store}
        onClose={() => setRegistersModal({ open: false, store: null })}
      />
    </div>
  );
};

export default StoresPage;
