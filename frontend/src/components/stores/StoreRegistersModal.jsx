/**
 * Registers of one store — list, add, and deactivate, in a Modal opened
 * from the Stores page.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';

import * as registerService from '../../services/registerService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  LoadingState,
  Modal,
  confirmDialog,
} from '../ui';

const EMPTY_FORM = { code: '', name: '', receiptPrefix: '' };

const StoreRegistersModal = ({ open, onClose, store }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.registers.list({ storeId: store?.id }),
    () => registerService.getRegisters({ storeId: store.id }),
    { enabled: open && Boolean(store) },
  );

  const registers = data?.data || [];

  const createRegister = useApiMutation(registerService.createRegister, {
    successMessage: 'Register created',
    invalidateKeys: [queryKeys.registers.all],
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const deactivateRegister = useApiMutation(
    registerService.deactivateRegister,
    {
      successMessage: 'Register deactivated',
      invalidateKeys: [queryKeys.registers.all],
    },
  );

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleAdd = () => {
    createRegister.mutate({ storeId: store.id, ...form });
  };

  const handleDeactivate = async (register) => {
    const ok = await confirmDialog({
      title: 'Deactivate register?',
      message: `"${register.code}" will no longer accept sales.`,
      confirmText: 'Deactivate',
    });

    if (ok) deactivateRegister.mutate(register.id);
  };

  if (!store) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Registers — ${store.name}`}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <LoadingState message="Loading registers..." />
        ) : errorMessage ? (
          <EmptyState title="Could not load registers" message={errorMessage} />
        ) : registers.length === 0 && !showForm ? (
          <EmptyState
            title="No registers yet"
            message="Add the first register for this store."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {registers.map((register) => (
              <li
                key={register.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {register.code}
                    {register.name ? ` — ${register.name}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    Receipt prefix: {register.receiptPrefix}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={register.isActive ? 'success' : 'gray'}>
                    {register.isActive ? 'Active' : 'Inactive'}
                  </Badge>

                  {register.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(register)}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {showForm ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <Input
              label="Code"
              value={form.code}
              onChange={setField('code')}
              placeholder="REG01"
            />

            <Input
              label="Name"
              value={form.name}
              onChange={setField('name')}
              placeholder="Front Counter"
            />

            <Input
              label="Receipt prefix"
              value={form.receiptPrefix}
              onChange={setField('receiptPrefix')}
              placeholder="S01"
              helperText="Globally unique — used to number offline receipts"
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>

              <Button
                onClick={handleAdd}
                loading={createRegister.isPending}
                disabled={!form.code || !form.receiptPrefix}
              >
                Add register
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setShowForm(true)}
          >
            Add register
          </Button>
        )}
      </div>
    </Modal>
  );
};

StoreRegistersModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  store: PropTypes.object,
};

export default StoreRegistersModal;
