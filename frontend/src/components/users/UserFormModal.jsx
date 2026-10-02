/**
 * Create/edit form for a staff user. Pass `user` to edit (username is
 * fixed and the password field is hidden — use Reset password instead);
 * omit it to create.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as userService from '../../services/userService.js';
import * as storeService from '../../services/storeService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { queryKeys, ROLES } from '../../constants';
import { Button, Input, Modal, Select } from '../ui';

const ROLE_OPTIONS = [
  { value: ROLES.CASHIER, label: 'Cashier' },
  { value: ROLES.MANAGER, label: 'Manager' },
  { value: ROLES.ADMIN, label: 'Admin' },
];

const EMPTY_FORM = {
  username: '',
  password: '',
  fullName: '',
  role: ROLES.CASHIER,
  email: '',
  phone: '',
};

const UserFormModal = ({ open, onClose, user }) => {
  const isEdit = Boolean(user);

  const [form, setForm] = useState(EMPTY_FORM);
  const [storeIds, setStoreIds] = useState([]);

  const { data: storesData } = useApiQuery(
    queryKeys.stores.list({ isActive: true }),
    () => storeService.getStores({ isActive: true }),
    { enabled: open },
  );

  const stores = storesData?.data || [];

  useEffect(() => {
    if (!open) return;

    setForm(
      user
        ? {
            username: user.username || '',
            password: '',
            fullName: user.fullName || '',
            role: user.role || ROLES.CASHIER,
            email: user.email || '',
            phone: user.phone || '',
          }
        : EMPTY_FORM,
    );
    setStoreIds((user?.stores || []).map((s) => s.id || s));
  }, [open, user]);

  const saveUser = useApiMutation(
    isEdit ? userService.updateUser : userService.createUser,
    {
      successMessage: isEdit ? 'User updated' : 'User created',
      invalidateKeys: [queryKeys.users.all],
      onSuccess: () => onClose(),
    },
  );

  const setField = (field) => (event) =>
    setForm((f) => ({ ...f, [field]: event.target.value }));

  const toggleStore = (id) =>
    setStoreIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  const handleSubmit = () => {
    const base = {
      fullName: form.fullName,
      role: form.role,
      email: form.email,
      phone: form.phone,
      stores: storeIds,
    };

    if (isEdit) {
      saveUser.mutate({ id: user.id, ...base });
    } else {
      saveUser.mutate({
        username: form.username,
        password: form.password,
        ...base,
      });
    }
  };

  const valid = isEdit
    ? form.fullName
    : form.username && form.password.length >= 8 && form.fullName;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${user.username}` : 'New user'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saveUser.isPending} disabled={!valid}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Username"
              value={form.username}
              onChange={setField('username')}
              placeholder="cashier01"
              autoComplete="off"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={setField('password')}
              helperText="Min 8 characters"
              autoComplete="new-password"
            />
          </div>
        )}

        <Input
          label="Full name"
          value={form.fullName}
          onChange={setField('fullName')}
          placeholder="Kamal Perera"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            value={form.role}
            onChange={setField('role')}
            options={ROLE_OPTIONS}
          />
          <Input label="Phone" value={form.phone} onChange={setField('phone')} />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={setField('email')}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-content">
            Assigned stores
          </p>
          {stores.length === 0 ? (
            <p className="text-xs text-muted">No active stores.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => {
                const checked = storeIds.includes(store.id);
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      checked
                        ? 'border-transparent bg-ink text-ink-content'
                        : 'border-line bg-surface text-muted hover:text-content'
                    }`}
                  >
                    {store.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

UserFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default UserFormModal;
