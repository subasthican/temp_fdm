/**
 * Create/edit form for a store, rendered in a Modal. Pass `store` to
 * edit; omit it to create.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as storeService from '../../services/storeService.js';
import { useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import { Button, Input, Modal, TextArea } from '../ui';

const EMPTY_FORM = {
  name: '',
  code: '',
  address: '',
  phone: '',
  receiptHeader: '',
  receiptFooter: '',
};

const StoreFormModal = ({ open, onClose, store }) => {
  const isEdit = Boolean(store);

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    setForm(
      store
        ? {
            name: store.name || '',
            code: store.code || '',
            address: store.address || '',
            phone: store.phone || '',
            receiptHeader: store.receipt?.header || '',
            receiptFooter: store.receipt?.footer || '',
          }
        : EMPTY_FORM,
    );
  }, [open, store]);

  const saveStore = useApiMutation(
    isEdit ? storeService.updateStore : storeService.createStore,
    {
      successMessage: isEdit ? 'Store updated' : 'Store created',
      invalidateKeys: [queryKeys.stores.all],
      onSuccess: () => onClose(),
    },
  );

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      code: form.code,
      address: form.address,
      phone: form.phone,
      receipt: {
        header: form.receiptHeader,
        footer: form.receiptFooter,
      },
    };

    saveStore.mutate(isEdit ? { id: store.id, ...payload } : payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit store' : 'New store'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            loading={saveStore.isPending}
            disabled={!form.name || !form.code}
          >
            {isEdit ? 'Save changes' : 'Create store'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={setField('name')}
          placeholder="Main Branch"
        />

        <Input
          label="Code"
          value={form.code}
          onChange={setField('code')}
          placeholder="MB"
          helperText="Short unique code, e.g. MB"
        />

        <TextArea
          label="Address"
          value={form.address}
          onChange={setField('address')}
          rows={2}
        />

        <Input label="Phone" value={form.phone} onChange={setField('phone')} />

        <Input
          label="Receipt header"
          value={form.receiptHeader}
          onChange={setField('receiptHeader')}
          placeholder="Shown at the top of every receipt"
        />

        <Input
          label="Receipt footer"
          value={form.receiptFooter}
          onChange={setField('receiptFooter')}
          placeholder="Thank you, come again!"
        />
      </div>
    </Modal>
  );
};

StoreFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  store: PropTypes.object,
};

export default StoreFormModal;
