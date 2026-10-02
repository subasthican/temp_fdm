/**
 * Categories CRUD panel — list, create/edit modal (with optional parent),
 * deactivate.
 */
import { useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';

import * as categoryService from '../../services/categoryService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { useAuthStore } from '../../store/useAuthStore.js';
import { queryKeys, ROLES } from '../../constants';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dropdown,
  EmptyState,
  Input,
  LoadingState,
  Modal,
  SearchableSelect,
  confirmDialog,
} from '../ui';

const EMPTY_FORM = { name: '', parent: '' };

const CategoriesPanel = () => {
  const isAdmin = useAuthStore((state) => state.user?.role === ROLES.ADMIN);
  const [modal, setModal] = useState({ open: false, category: null });
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.categories.list({}),
    () => categoryService.getCategories({}),
  );

  const categories = data?.data || [];

  useEffect(() => {
    if (modal.open) {
      setForm({
        name: modal.category?.name || '',
        parent: modal.category?.parent?.id || '',
      });
    }
  }, [modal]);

  const saveCategory = useApiMutation(
    modal.category ? categoryService.updateCategory : categoryService.createCategory,
    {
      successMessage: modal.category ? 'Category updated' : 'Category created',
      invalidateKeys: [queryKeys.categories.all],
      onSuccess: () => setModal({ open: false, category: null }),
    },
  );

  const softDeleteCategory = useApiMutation(categoryService.softDeleteCategory, {
    successMessage: 'Category deleted',
    invalidateKeys: [queryKeys.categories.all],
  });

  const toggleActive = useApiMutation(categoryService.updateCategory, {
    invalidateKeys: [queryKeys.categories.all],
  });

  const handleSave = () => {
    const payload = { name: form.name, parent: form.parent || null };

    saveCategory.mutate(
      modal.category ? { id: modal.category.id, ...payload } : payload,
    );
  };

  const handleToggleActive = (category) => {
    toggleActive.mutate({ id: category.id, isActive: !category.isActive });
  };

  const handleDelete = async (category) => {
    const ok = await confirmDialog({
      title: 'Delete category?',
      message: `"${category.name}" will be removed from the catalog. History is kept.`,
      confirmText: 'Delete',
    });

    if (ok) softDeleteCategory.mutate(category.id);
  };

  // A category cannot be its own parent.
  const parentOptions = categories
    .filter((c) => c.id !== modal.category?.id)
    .map((c) => ({ value: c.id, label: c.name }));

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'parent',
      header: 'Parent',
      render: (category) => category.parent?.name || '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (category) => (
        <Badge variant={category.isActive ? 'success' : 'gray'}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (category) => (
        <div className="flex justify-end">
          <Dropdown
            label={`Actions for ${category.name}`}
            items={[
              {
                label: 'Edit category',
                icon: <Pencil size={15} aria-hidden="true" />,
                onClick: () => setModal({ open: true, category }),
              },
              {
                label: category.isActive ? 'Deactivate' : 'Activate',
                icon: <Power size={15} aria-hidden="true" />,
                onClick: () => handleToggleActive(category),
              },
              ...(isAdmin
                ? [
                    { type: 'divider' },
                    {
                      label: 'Delete',
                      icon: <Trash2 size={15} aria-hidden="true" />,
                      danger: true,
                      onClick: () => handleDelete(category),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Categories"
        subtitle="Group products into a browsable hierarchy."
        padding={false}
        className="overflow-hidden"
        actions={
          <Button
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setModal({ open: true, category: null })}
          >
            New category
          </Button>
        }
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingState message="Loading categories..." />
          </div>
        ) : errorMessage ? (
          <EmptyState title="Could not load categories" message={errorMessage} />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Add your first category to start organising products."
            action={
              <Button
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={() => setModal({ open: true, category: null })}
              >
                New category
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} rows={categories} rowKey="id" />
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, category: null })}
        title={modal.category ? 'Edit category' : 'New category'}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, category: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saveCategory.isPending}
              disabled={!form.name}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm((f) => ({ ...f, name: event.target.value }))
            }
            placeholder="Beverages"
            autoFocus
          />

          <SearchableSelect
            label="Parent category (optional)"
            options={[{ value: '', label: 'None (top level)' }, ...parentOptions]}
            value={form.parent}
            onChange={(value) => setForm((f) => ({ ...f, parent: value }))}
            placeholder="None (top level)"
          />
        </div>
      </Modal>
    </>
  );
};

export default CategoriesPanel;
