/**
 * Products management (Admin/Manager) — list with search + category/brand
 * filters, create/edit modal, per-store pricing modal, deactivate.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Barcode as BarcodeIcon,
  Coins,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
} from 'lucide-react';

import * as productService from '../../services/productService.js';
import * as categoryService from '../../services/categoryService.js';
import * as brandService from '../../services/brandService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { queryKeys, ROLES, ROUTES, SEARCH_DEBOUNCE_MS } from '../../constants';
import ProductFormModal from '../../components/products/ProductFormModal.jsx';
import ProductPricesModal from '../../components/products/ProductPricesModal.jsx';
import BarcodeModal from '../../components/products/BarcodeModal.jsx';
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

const ProductsPage = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((state) => state.user?.role === ROLES.ADMIN);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const [formModal, setFormModal] = useState({ open: false, product: null });
  const [pricesModal, setPricesModal] = useState({ open: false, product: null });
  const [barcodeModal, setBarcodeModal] = useState({ open: false, product: null });

  const filters = {
    search: debouncedSearch,
    ...(categoryId && { categoryId }),
    ...(brandId && { brandId }),
  };

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.products.list(filters),
    () => productService.getProducts(filters),
  );

  const { data: categoriesData } = useApiQuery(
    queryKeys.categories.list({ isActive: true }),
    () => categoryService.getCategories({ isActive: true }),
  );
  const { data: brandsData } = useApiQuery(
    queryKeys.brands.list({ isActive: true }),
    () => brandService.getBrands({ isActive: true }),
  );

  const products = data?.data || [];

  const softDeleteProduct = useApiMutation(productService.softDeleteProduct, {
    successMessage: 'Product deleted',
    invalidateKeys: [queryKeys.products.all],
  });

  const toggleActive = useApiMutation(productService.updateProduct, {
    invalidateKeys: [queryKeys.products.all],
  });

  const handleToggleActive = (product) => {
    toggleActive.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleDelete = async (product) => {
    const ok = await confirmDialog({
      title: 'Delete product?',
      message: `"${product.name}" will be removed from the catalog and till. Its sale history is kept.`,
      confirmText: 'Delete',
    });

    if (ok) softDeleteProduct.mutate(product.id);
  };

  const categoryFilterOptions = [
    { value: '', label: 'All categories' },
    ...(categoriesData?.data || []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const brandFilterOptions = [
    { value: '', label: 'All brands' },
    ...(brandsData?.data || []).map((b) => ({ value: b.id, label: b.name })),
  ];

  const columns = [
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'category',
      header: 'Category',
      render: (product) => product.category?.name || '—',
    },
    {
      key: 'pricingMode',
      header: 'Pricing',
      render: (product) =>
        product.pricingMode === 'batch' ? (
          <Badge variant="gray">Batch MRP</Badge>
        ) : (
          <span className="text-muted">Product</span>
        ),
    },
    {
      key: 'sellType',
      header: 'Sell',
      render: (product) => (product.sellType === 'weighed' ? 'Weighed' : 'Each'),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (product) => (
        <Badge variant={product.isActive ? 'success' : 'gray'}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (product) => (
        <div className="flex justify-end">
          <Dropdown
            label={`Actions for ${product.name}`}
            items={[
              {
                label: 'Edit product',
                icon: <Pencil size={15} aria-hidden="true" />,
                onClick: () => setFormModal({ open: true, product }),
              },
              {
                label: 'Pricing',
                icon: <Coins size={15} aria-hidden="true" />,
                onClick: () => setPricesModal({ open: true, product }),
              },
              {
                label: 'Barcodes',
                icon: <BarcodeIcon size={15} aria-hidden="true" />,
                onClick: () => setBarcodeModal({ open: true, product }),
              },
              {
                label: product.isActive ? 'Deactivate' : 'Activate',
                icon: <Power size={15} aria-hidden="true" />,
                onClick: () => handleToggleActive(product),
              },
              ...(isAdmin
                ? [
                    { type: 'divider' },
                    {
                      label: 'Delete',
                      icon: <Trash2 size={15} aria-hidden="true" />,
                      danger: true,
                      onClick: () => handleDelete(product),
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
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Your product catalog across all stores"
        actions={
          <Button
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setFormModal({ open: true, product: null })}
          >
            New product
          </Button>
        }
      />

      <Card padding={false}>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="min-w-[220px] flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              leftIcon={<Search size={16} aria-hidden="true" />}
            />
          </div>
          <div className="w-48">
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              options={categoryFilterOptions}
            />
          </div>
          <div className="w-48">
            <Select
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              options={brandFilterOptions}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading products..." />
        ) : errorMessage ? (
          <EmptyState title="Could not load products" message={errorMessage} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message="Create your first product, or adjust the filters."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={products}
            rowKey="id"
            onRowClick={(product) =>
              navigate(ROUTES.PRODUCT_DETAIL.replace(':id', product.id))
            }
          />
        )}
      </Card>

      <ProductFormModal
        open={formModal.open}
        product={formModal.product}
        onClose={() => setFormModal({ open: false, product: null })}
      />

      <ProductPricesModal
        open={pricesModal.open}
        product={pricesModal.product}
        onClose={() => setPricesModal({ open: false, product: null })}
      />

      <BarcodeModal
        open={barcodeModal.open}
        product={barcodeModal.product}
        onClose={() => setBarcodeModal({ open: false, product: null })}
      />
    </div>
  );
};

export default ProductsPage;
