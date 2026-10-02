/**
 * Tax classes CRUD panel — list, create/edit modal (rate + inclusive
 * default), deactivate.
 */
import { useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';

import * as taxClassService from '../../services/taxClassService.js';
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
  Select,
  confirmDialog,
} from '../ui';

const EMPTY_FORM = { name: '', rate: '', isInclusiveDefault: 'true' };

const TaxClassesPanel = () => {
  const isAdmin = useAuthStore((state) => state.user?.role === ROLES.ADMIN);
  const [modal, setModal] = useState({ open: false, taxClass: null });
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.taxClasses.list({}),
    () => taxClassService.getTaxClasses({}),
  );

  const taxClasses = data?.data || [];

  useEffect(() => {
    if (modal.open) {
      setForm({
        name: modal.taxClass?.name || '',
        rate: modal.taxClass?.rate ?? '',
        isInclusiveDefault: String(modal.taxClass?.isInclusiveDefault ?? true),
      });
    }
  }, [modal]);

  const saveTaxClass = useApiMutation(
    modal.taxClass ? taxClassService.updateTaxClass : taxClassService.createTaxClass,
    {
      successMessage: modal.taxClass ? 'Tax class updated' : 'Tax class created',
      invalidateKeys: [queryKeys.taxClasses.all],
      onSuccess: () => setModal({ open: false, taxClass: null }),
    },
  );

  const softDeleteTaxClass = useApiMutation(taxClassService.softDeleteTaxClass, {
    successMessage: 'Tax class deleted',
    invalidateKeys: [queryKeys.taxClasses.all],
  });

  const toggleActive = useApiMutation(taxClassService.updateTaxClass, {
    invalidateKeys: [queryKeys.taxClasses.all],
  });

  const handleSave = () => {
    const payload = {
      name: form.name,
      rate: Number(form.rate),
      isInclusiveDefault: form.isInclusiveDefault === 'true',
    };

    saveTaxClass.mutate(
      modal.taxClass ? { id: modal.taxClass.id, ...payload } : payload,
    );
  };

  const handleToggleActive = (taxClass) => {
    toggleActive.mutate({ id: taxClass.id, isActive: !taxClass.isActive });
  };

  const handleDelete = async (taxClass) => {
    const ok = await confirmDialog({
      title: 'Delete tax class?',
      message: `"${taxClass.name}" will be removed from the catalog. History is kept.`,
      confirmText: 'Delete',
    });

    if (ok) softDeleteTaxClass.mutate(taxClass.id);
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'rate',
      header: 'Rate',
      sortable: true,
      align: 'right',
      render: (taxClass) => `${taxClass.rate}%`,
    },
    {
      key: 'isInclusiveDefault',
      header: 'Default',
      render: (taxClass) => (taxClass.isInclusiveDefault ? 'Inclusive' : 'Exclusive'),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (taxClass) => (
        <Badge variant={taxClass.isActive ? 'success' : 'gray'}>
          {taxClass.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (taxClass) => (
        <div className="flex justify-end">
          <Dropdown
            label={`Actions for ${taxClass.name}`}
            items={[
              {
                label: 'Edit tax class',
                icon: <Pencil size={15} aria-hidden="true" />,
                onClick: () => setModal({ open: true, taxClass }),
              },
              {
                label: taxClass.isActive ? 'Deactivate' : 'Activate',
                icon: <Power size={15} aria-hidden="true" />,
                onClick: () => handleToggleActive(taxClass),
              },
              ...(isAdmin
                ? [
                    { type: 'divider' },
                    {
                      label: 'Delete',
                      icon: <Trash2 size={15} aria-hidden="true" />,
                      danger: true,
                      onClick: () => handleDelete(taxClass),
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
        title="Tax classes"
        subtitle="Rates used for receipt tax breakdowns and reporting."
        padding={false}
        className="overflow-hidden"
        actions={
          <Button
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setModal({ open: true, taxClass: null })}
          >
            New tax class
          </Button>
        }
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingState message="Loading tax classes..." />
          </div>
        ) : errorMessage ? (
          <EmptyState title="Could not load tax classes" message={errorMessage} />
        ) : taxClasses.length === 0 ? (
          <EmptyState
            title="No tax classes yet"
            message="Add your first tax class to drive receipt tax breakdowns."
            action={
              <Button
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={() => setModal({ open: true, taxClass: null })}
              >
                New tax class
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} rows={taxClasses} rowKey="id" />
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, taxClass: null })}
        title={modal.taxClass ? 'Edit tax class' : 'New tax class'}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModal({ open: false, taxClass: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saveTaxClass.isPending}
              disabled={!form.name || form.rate === ''}
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
            placeholder="Standard VAT"
            autoFocus
          />

          <Input
            label="Rate (%)"
            type="number"
            min="0"
            value={form.rate}
            onChange={(event) =>
              setForm((f) => ({ ...f, rate: event.target.value }))
            }
            placeholder="15"
          />

          <Select
            label="Default pricing"
            value={form.isInclusiveDefault}
            onChange={(event) =>
              setForm((f) => ({ ...f, isInclusiveDefault: event.target.value }))
            }
            options={[
              { value: 'true', label: 'Tax-inclusive' },
              { value: 'false', label: 'Tax-exclusive' },
            ]}
          />
        </div>
      </Modal>
    </>
  );
};

export default TaxClassesPanel;
