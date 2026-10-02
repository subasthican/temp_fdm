/**
 * Brands CRUD panel — list, create/edit modal, deactivate.
 */
import { useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';

import * as brandService from '../../services/brandService.js';
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
  confirmDialog,
} from '../ui';

const BrandsPanel = () => {
  const isAdmin = useAuthStore((state) => state.user?.role === ROLES.ADMIN);
  const [modal, setModal] = useState({ open: false, brand: null });
  const [name, setName] = useState('');

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.brands.list({}),
    () => brandService.getBrands({}),
  );

  const brands = data?.data || [];

  useEffect(() => {
    if (modal.open) setName(modal.brand?.name || '');
  }, [modal]);

  const saveBrand = useApiMutation(
    modal.brand ? brandService.updateBrand : brandService.createBrand,
    {
      successMessage: modal.brand ? 'Brand updated' : 'Brand created',
      invalidateKeys: [queryKeys.brands.all],
      onSuccess: () => setModal({ open: false, brand: null }),
    },
  );

  const softDeleteBrand = useApiMutation(brandService.softDeleteBrand, {
    successMessage: 'Brand deleted',
    invalidateKeys: [queryKeys.brands.all],
  });

  const toggleActive = useApiMutation(brandService.updateBrand, {
    invalidateKeys: [queryKeys.brands.all],
  });

  const handleSave = () => {
    saveBrand.mutate(modal.brand ? { id: modal.brand.id, name } : { name });
  };

  const handleToggleActive = (brand) => {
    toggleActive.mutate({ id: brand.id, isActive: !brand.isActive });
  };

  const handleDelete = async (brand) => {
    const ok = await confirmDialog({
      title: 'Delete brand?',
      message: `"${brand.name}" will be removed from the catalog. History is kept.`,
      confirmText: 'Delete',
    });

    if (ok) softDeleteBrand.mutate(brand.id);
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'isActive',
      header: 'Status',
      render: (brand) => (
        <Badge variant={brand.isActive ? 'success' : 'gray'}>
          {brand.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (brand) => (
        <div className="flex justify-end">
          <Dropdown
            label={`Actions for ${brand.name}`}
            items={[
              {
                label: 'Edit brand',
                icon: <Pencil size={15} aria-hidden="true" />,
                onClick: () => setModal({ open: true, brand }),
              },
              {
                label: brand.isActive ? 'Deactivate' : 'Activate',
                icon: <Power size={15} aria-hidden="true" />,
                onClick: () => handleToggleActive(brand),
              },
              ...(isAdmin
                ? [
                    { type: 'divider' },
                    {
                      label: 'Delete',
                      icon: <Trash2 size={15} aria-hidden="true" />,
                      danger: true,
                      onClick: () => handleDelete(brand),
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
        title="Brands"
        subtitle="Manufacturers and labels carried across your products."
        padding={false}
        className="overflow-hidden"
        actions={
          <Button
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setModal({ open: true, brand: null })}
          >
            New brand
          </Button>
        }
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingState message="Loading brands..." />
          </div>
        ) : errorMessage ? (
          <EmptyState title="Could not load brands" message={errorMessage} />
        ) : brands.length === 0 ? (
          <EmptyState
            title="No brands yet"
            message="Add your first brand to tag products by maker."
            action={
              <Button
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={() => setModal({ open: true, brand: null })}
              >
                New brand
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} rows={brands} rowKey="id" />
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, brand: null })}
        title={modal.brand ? 'Edit brand' : 'New brand'}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, brand: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saveBrand.isPending}
              disabled={!name}
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Coca-Cola"
          autoFocus
        />
      </Modal>
    </>
  );
};

export default BrandsPanel;
