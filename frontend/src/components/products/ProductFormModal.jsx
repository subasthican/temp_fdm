/**
 * Create/edit form for a product. Pass `product` to edit; omit to create.
 * Category, brand, and tax class are optional (tax unset = exempt).
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import * as productService from '../../services/productService.js';
import * as categoryService from '../../services/categoryService.js';
import * as brandService from '../../services/brandService.js';
import * as taxClassService from '../../services/taxClassService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import {
  Button,
  Input,
  Modal,
  SearchableSelect,
  Select,
} from '../ui';

const EMPTY_FORM = {
  name: '',
  sku: '',
  barcodes: '',
  categoryId: '',
  brandId: '',
  taxClassId: '',
  sellType: 'each',
  pricingMode: 'product',
  imageUrl: '',
};

const ProductFormModal = ({ open, onClose, product }) => {
  const isEdit = Boolean(product);

  const [form, setForm] = useState(EMPTY_FORM);

  const { data: categoriesData } = useApiQuery(
    queryKeys.categories.list({ isActive: true }),
    () => categoryService.getCategories({ isActive: true }),
    { enabled: open },
  );
  const { data: brandsData } = useApiQuery(
    queryKeys.brands.list({ isActive: true }),
    () => brandService.getBrands({ isActive: true }),
    { enabled: open },
  );
  const { data: taxData } = useApiQuery(
    queryKeys.taxClasses.list({ isActive: true }),
    () => taxClassService.getTaxClasses({ isActive: true }),
    { enabled: open },
  );

  const categoryOptions = [
    { value: '', label: 'None' },
    ...(categoriesData?.data || []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const brandOptions = [
    { value: '', label: 'None' },
    ...(brandsData?.data || []).map((b) => ({ value: b.id, label: b.name })),
  ];
  const taxOptions = [
    { value: '', label: 'Exempt (0%)' },
    ...(taxData?.data || []).map((t) => ({
      value: t.id,
      label: `${t.name} (${t.rate}%)`,
    })),
  ];

  useEffect(() => {
    if (!open) return;

    setForm(
      product
        ? {
            name: product.name || '',
            sku: product.sku || '',
            barcodes: (product.barcodes || []).join(', '),
            categoryId: product.category?.id || '',
            brandId: product.brand?.id || '',
            taxClassId: product.taxClass?.id || '',
            sellType: product.sellType || 'each',
            pricingMode: product.pricingMode || 'product',
            imageUrl: product.imageUrl || '',
          }
        : EMPTY_FORM,
    );
  }, [open, product]);

  const saveProduct = useApiMutation(
    isEdit ? productService.updateProduct : productService.createProduct,
    {
      successMessage: isEdit ? 'Product updated' : 'Product created',
      invalidateKeys: [queryKeys.products.all],
      onSuccess: () => onClose(),
    },
  );

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const setSelect = (field) => (value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      sku: form.sku,
      barcodes: form.barcodes
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean),
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      taxClassId: form.taxClassId || null,
      sellType: form.sellType,
      pricingMode: form.pricingMode,
      imageUrl: form.imageUrl,
    };

    saveProduct.mutate(isEdit ? { id: product.id, ...payload } : payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'New product'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={saveProduct.isPending}
            disabled={!form.name || !form.sku}
          >
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={setField('name')}
          placeholder="Sugar 1kg"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="SKU"
            value={form.sku}
            onChange={setField('sku')}
            placeholder="SUG1KG"
          />
          <Input
            label="Barcodes"
            value={form.barcodes}
            onChange={setField('barcodes')}
            placeholder="890..., 891..."
            helperText="Comma-separated"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SearchableSelect
            label="Category"
            options={categoryOptions}
            value={form.categoryId}
            onChange={setSelect('categoryId')}
            placeholder="None"
          />
          <SearchableSelect
            label="Brand"
            options={brandOptions}
            value={form.brandId}
            onChange={setSelect('brandId')}
            placeholder="None"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Sell type"
            value={form.sellType}
            onChange={setField('sellType')}
            options={[
              { value: 'each', label: 'Each (count)' },
              { value: 'weighed', label: 'Weighed (per kg)' },
            ]}
          />
          <Select
            label="Pricing mode"
            value={form.pricingMode}
            onChange={setField('pricingMode')}
            options={[
              { value: 'product', label: 'Product price' },
              { value: 'batch', label: 'Batch MRP' },
            ]}
          />
        </div>

        <SearchableSelect
          label="Tax class"
          options={taxOptions}
          value={form.taxClassId}
          onChange={setSelect('taxClassId')}
          placeholder="Exempt (0%)"
          helperText="Leave exempt unless the item is taxed"
        />

        <Input
          label="Image URL"
          value={form.imageUrl}
          onChange={setField('imageUrl')}
          placeholder="/uploads/... or https://..."
        />
      </div>
    </Modal>
  );
};

ProductFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
};

export default ProductFormModal;
