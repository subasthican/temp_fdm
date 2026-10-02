/**
 * Staff / user management (Admin only) — list with search + role filter,
 * create/edit, reset password, activate/deactivate, and soft delete.
 */
import { useState } from 'react';
import { KeyRound, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';

import * as userService from '../../services/userService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { queryKeys, ROLES, SEARCH_DEBOUNCE_MS } from '../../constants';
import UserFormModal from '../../components/users/UserFormModal.jsx';
import ResetPasswordModal from '../../components/users/ResetPasswordModal.jsx';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dropdown,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  confirmDialog,
} from '../../components/ui';

const ROLE_BADGE = {
  admin: 'danger',
  manager: 'info',
  cashier: 'gray',
};

const UsersPage = () => {
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const [formModal, setFormModal] = useState({ open: false, user: null });
  const [resetModal, setResetModal] = useState({ open: false, user: null });

  const filters = { search: debouncedSearch, ...(role && { role }) };

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.users.list(filters),
    () => userService.getUsers(filters),
  );

  const users = data?.data || [];

  const toggleActive = useApiMutation(userService.updateUser, {
    invalidateKeys: [queryKeys.users.all],
  });

  const softDeleteUser = useApiMutation(userService.softDeleteUser, {
    successMessage: 'User deleted',
    invalidateKeys: [queryKeys.users.all],
  });

  const handleToggleActive = (user) =>
    toggleActive.mutate({ id: user.id, isActive: !user.isActive });

  const handleDelete = async (user) => {
    const ok = await confirmDialog({
      title: 'Delete user?',
      message: `"${user.fullName}" (${user.username}) will lose access. History is kept.`,
      confirmText: 'Delete',
    });

    if (ok) softDeleteUser.mutate(user.id);
  };

  const columns = [
    { key: 'username', header: 'Username', sortable: true },
    { key: 'fullName', header: 'Name', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant={ROLE_BADGE[user.role] || 'gray'}>{user.role}</Badge>
      ),
    },
    {
      key: 'stores',
      header: 'Stores',
      render: (user) =>
        user.stores?.length
          ? user.stores.map((s) => s.name || s).join(', ')
          : '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'gray'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (user) => {
        const isSelf = user.id === currentUserId;
        return (
          <div className="flex justify-end">
            <Dropdown
              label={`Actions for ${user.username}`}
              items={[
                {
                  label: 'Edit user',
                  icon: <Pencil size={15} aria-hidden="true" />,
                  onClick: () => setFormModal({ open: true, user }),
                },
                {
                  label: 'Reset password',
                  icon: <KeyRound size={15} aria-hidden="true" />,
                  onClick: () => setResetModal({ open: true, user }),
                },
                // Self-account guards: can't deactivate/delete yourself.
                ...(isSelf
                  ? []
                  : [
                      {
                        label: user.isActive ? 'Deactivate' : 'Activate',
                        icon: <Power size={15} aria-hidden="true" />,
                        onClick: () => handleToggleActive(user),
                      },
                      { type: 'divider' },
                      {
                        label: 'Delete',
                        icon: <Trash2 size={15} aria-hidden="true" />,
                        danger: true,
                        onClick: () => handleDelete(user),
                      },
                    ]),
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Users, roles, and store assignments"
        actions={
          <Button
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setFormModal({ open: true, user: null })}
          >
            New user
          </Button>
        }
      />

      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="min-w-[220px] flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username or name..."
              leftIcon={<Search size={16} aria-hidden="true" />}
            />
          </div>
          <div className="w-44">
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              options={[
                { value: '', label: 'All roles' },
                { value: ROLES.ADMIN, label: 'Admin' },
                { value: ROLES.MANAGER, label: 'Manager' },
                { value: ROLES.CASHIER, label: 'Cashier' },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingState message="Loading users..." />
          </div>
        ) : errorMessage ? (
          <EmptyState title="Could not load users" message={errorMessage} />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" message="Create your first staff user." />
        ) : (
          <DataTable columns={columns} rows={users} rowKey="id" />
        )}
      </Card>

      <UserFormModal
        open={formModal.open}
        user={formModal.user}
        onClose={() => setFormModal({ open: false, user: null })}
      />

      <ResetPasswordModal
        open={resetModal.open}
        user={resetModal.user}
        onClose={() => setResetModal({ open: false, user: null })}
      />
    </div>
  );
};

export default UsersPage;
