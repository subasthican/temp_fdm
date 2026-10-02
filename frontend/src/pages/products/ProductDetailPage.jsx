/**
 * Read-only product view (Admin/Manager) — full details, rendered
 * barcodes, and the per-store price table in one place. Edit / pricing /
 * barcode actions reuse the same modals as the list page.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Barcode as BarcodeIcon, Coins, Pencil } from 'lucide-react';

import * as productService from '../../services/productService.js';
import * as inventoryService from '../../services/inventoryService.js';
import { useApiQuery } from '../../hooks/api';
import { queryKeys, ROUTES, PRODUCT_PLACEHOLDER } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { resolveMediaUrl } from '../../utils/networkUrls.js';
import ProductFormModal from '../../components/products/ProductFormModal.jsx';
import ProductPricesModal from '../../components/products/ProductPricesModal.jsx';
import BarcodeModal from '../../components/products/BarcodeModal.jsx';
import Barcode from '../../components/products/Barcode.jsx';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  LoadingState,
  PageHeader,
} from '../../components/ui';

const Detail = ({ label, children }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-0.5 text-sm text-gray-900">{children}</dd>
  </div>
);

Detail.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [pricesOpen, setPricesOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);

  const { data: product, isLoading, errorMessage } = useApiQuery(
    queryKeys.products.detail(id),
    () => productService.getProductById(id),
  );

  const { data: batchesData } = useApiQuery(
    queryKeys.inventory.batches({ productId: id, inStock: true }),
    () => inventoryService.getBatches({ productId: id, inStock: true }),
  );

  const batches = batchesData?.data || [];

  if (isLoading) {
    return <LoadingState message="Loading product..." />;
  }

  if (errorMessage || !product) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={() => navigate(ROUTES.PRODUCTS)}
        >
          Back to products
        </Button>
        <EmptyState
          title="Could not load product"
          message={errorMessage || 'This product no longer exists.'}
        />
      </div>
    );
  }

  const priceColumns = [
    { key: 'store', header: 'Store', render: (row) => row.store?.name || '—' },
    { key: 'cost', header: 'Cost', render: (row) => formatCurrency(row.cost) },
    {
      key: 'sellPrice',
      header: 'Sell price',
      render: (row) => formatCurrency(row.sellPrice),
    },
    { key: 'reorderLevel', header: 'Reorder at' },
  ];

  const batchColumns = [
    { key: 'batchNo', header: 'Batch', render: (row) => row.batchNo || '—' },
    { key: 'store', header: 'Store', render: (row) => row.store?.name || '—' },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row) => (row.expiryDate ? formatDate(row.expiryDate) : '—'),
    },
    {
      key: 'sellPrice',
      header: 'MRP',
      render: (row) => formatCurrency(row.sellPrice),
    },
    { key: 'quantity', header: 'Qty' },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        icon={<ArrowLeft size={16} aria-hidden="true" />}
        onClick={() => navigate(ROUTES.PRODUCTS)}
      >
        Back to products
      </Button>

      <PageHeader
        title={product.name}
        subtitle={`SKU ${product.sku}`}
        actions={
          <>
            <Button
              variant="outline"
              icon={<BarcodeIcon size={16} aria-hidden="true" />}
              onClick={() => setBarcodeOpen(true)}
            >
              Barcode
            </Button>
            <Button
              variant="outline"
              icon={<Coins size={16} aria-hidden="true" />}
              onClick={() => setPricesOpen(true)}
            >
              Pricing
            </Button>
            <Button
              icon={<Pencil size={16} aria-hidden="true" />}
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <div className="flex gap-5">
            <img
              src={resolveMediaUrl(product.imageUrl) || PRODUCT_PLACEHOLDER}
              alt={product.name}
              className="h-24 w-24 shrink-0 rounded-lg border border-gray-200 object-cover"
              onError={(event) => {
                event.currentTarget.src = PRODUCT_PLACEHOLDER;
              }}
            />

            <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
              <Detail label="Category">{product.category?.name || '—'}</Detail>
              <Detail label="Brand">{product.brand?.name || '—'}</Detail>
              <Detail label="Tax class">
                {product.taxClass
                  ? `${product.taxClass.name} (${product.taxClass.rate}%)`
                  : 'Exempt (0%)'}
              </Detail>
              <Detail label="Pricing mode">
                <Badge variant={product.pricingMode === 'batch' ? 'info' : 'gray'}>
                  {product.pricingMode === 'batch' ? 'Batch MRP' : 'Product'}
                </Badge>
              </Detail>
              <Detail label="Sell type">
                {product.sellType === 'weighed' ? 'Weighed (per kg)' : 'Each'}
              </Detail>
              <Detail label="Base unit">{product.baseUnit || '—'}</Detail>
              <Detail label="Age restricted">
                {product.isAgeRestricted ? 'Yes' : 'No'}
              </Detail>
              <Detail label="Status">
                <Badge variant={product.isActive ? 'success' : 'gray'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Detail>
            </dl>
          </div>
        </Card>

        <Card title="Barcodes">
          {product.barcodes?.length ? (
            <div className="space-y-3">
              {product.barcodes.map((value) => (
                <div
                  key={value}
                  className="flex justify-center rounded-lg border border-gray-100 p-2"
                >
                  <Barcode value={value} height={40} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No barcodes"
              message="Generate one from the Barcode action."
            />
          )}
        </Card>
      </div>

      <Card title="Per-store pricing" padding={false}>
        {product.prices?.length ? (
          <DataTable columns={priceColumns} rows={product.prices} rowKey="id" />
        ) : (
          <EmptyState
            title="No store prices yet"
            message="Set prices from the Pricing action."
          />
        )}
      </Card>

      <Card
        title="Batches in stock"
        subtitle="Earliest expiry first (FEFO)"
        padding={false}
      >
        {batches.length ? (
          <DataTable columns={batchColumns} rows={batches} rowKey="id" />
        ) : (
          <EmptyState
            title="No batches in stock"
            message="Receive stock from the Inventory page to create batches."
          />
        )}
      </Card>

      <ProductFormModal
        open={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
      />
      <ProductPricesModal
        open={pricesOpen}
        product={product}
        onClose={() => setPricesOpen(false)}
      />
      <BarcodeModal
        open={barcodeOpen}
        product={product}
        onClose={() => setBarcodeOpen(false)}
      />
    </div>
  );
};

export default ProductDetailPage;
