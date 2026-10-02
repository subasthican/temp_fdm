/**
 * Terminal binding screen — after login, the POS terminal picks the
 * store and register it operates as. The binding is persisted in
 * useRegisterStore and stamps every sale and cash session.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorSmartphone, Store as StoreIcon } from 'lucide-react';

import * as storeService from '../../services/storeService.js';
import * as registerService from '../../services/registerService.js';
import { useApiQuery } from '../../hooks/api';
import { useRegisterStore } from '../../store/useRegisterStore.js';
import { queryKeys, ROUTES } from '../../constants';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
} from '../../components/ui';

const RegisterSelectPage = () => {
  const navigate = useNavigate();
  const setBinding = useRegisterStore((state) => state.setBinding);

  const [selectedStore, setSelectedStore] = useState(null);

  const storesQuery = useApiQuery(
    queryKeys.stores.list({ isActive: true }),
    () => storeService.getStores({ isActive: true }),
  );

  const registersQuery = useApiQuery(
    queryKeys.registers.list({ storeId: selectedStore?.id, isActive: true }),
    () =>
      registerService.getRegisters({
        storeId: selectedStore.id,
        isActive: true,
      }),
    { enabled: Boolean(selectedStore) },
  );

  const stores = storesQuery.data?.data || [];
  const registers = registersQuery.data?.data || [];

  const handlePick = (register) => {
    setBinding({
      store: {
        id: selectedStore.id,
        name: selectedStore.name,
        code: selectedStore.code,
      },
      register: {
        id: register.id,
        code: register.code,
        name: register.name,
        receiptPrefix: register.receiptPrefix,
      },
    });

    navigate(ROUTES.POS);
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <Card
          title={selectedStore ? `Registers — ${selectedStore.name}` : 'Select store'}
          subtitle={
            selectedStore
              ? 'Pick the register this terminal operates as'
              : 'Which branch is this terminal in?'
          }
          actions={
            selectedStore && (
              <Button variant="ghost" onClick={() => setSelectedStore(null)}>
                Change store
              </Button>
            )
          }
        >
          {!selectedStore ? (
            storesQuery.isLoading ? (
              <LoadingState message="Loading stores..." />
            ) : storesQuery.errorMessage ? (
              <EmptyState
                title="Could not load stores"
                message={storesQuery.errorMessage}
              />
            ) : stores.length === 0 ? (
              <EmptyState
                title="No active stores"
                message="Ask an admin to create a store first."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setSelectedStore(store)}
                    className="flex items-center gap-3 rounded-xl border border-line p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-muted"
                  >
                    <StoreIcon
                      size={20}
                      className="text-muted"
                      aria-hidden="true"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-content">
                        {store.name}
                      </span>
                      <span className="block text-xs text-muted">
                        {store.code}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : registersQuery.isLoading ? (
            <LoadingState message="Loading registers..." />
          ) : registersQuery.errorMessage ? (
            <EmptyState
              title="Could not load registers"
              message={registersQuery.errorMessage}
            />
          ) : registers.length === 0 ? (
            <EmptyState
              title="No active registers"
              message="Ask an admin to add a register to this store."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {registers.map((register) => (
                <button
                  key={register.id}
                  type="button"
                  onClick={() => handlePick(register)}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50"
                >
                  <MonitorSmartphone
                    size={20}
                    className="text-muted"
                    aria-hidden="true"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-content">
                      {register.code}
                      {register.name ? ` — ${register.name}` : ''}
                    </span>
                    <span className="block text-xs text-gray-500">
                      Receipts: {register.receiptPrefix}-…
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegisterSelectPage;
