/**
 * Barcode manager for a product — generate a barcode (EAN-13 or Code128),
 * then preview and print a sheet of labels. PRODUCT-priced items print
 * the selected store's sell price; BATCH-priced items print barcode-only
 * (price is set per batch at receiving time).
 */
import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Printer } from 'lucide-react';

import * as productService from '../../services/productService.js';
import * as storeService from '../../services/storeService.js';
import { useApiQuery, useApiMutation } from '../../hooks/api';
import { queryKeys } from '../../constants';
import { formatCurrency } from '../../utils/formatters.js';
import Barcode from './Barcode.jsx';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  LoadingState,
  Modal,
  Select,
} from '../ui';

const BarcodeModal = ({ open, onClose, product }) => {
  const [format, setFormat] = useState('ean13');
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const [storeId, setStoreId] = useState('');
  const [quantity, setQuantity] = useState(12);

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.products.detail(product?.id),
    () => productService.getProductById(product.id),
    { enabled: open && Boolean(product) },
  );

  const { data: storesData } = useApiQuery(
    queryKeys.stores.list({ isActive: true }),
    () => storeService.getStores({ isActive: true }),
    { enabled: open },
  );

  const detail = data;
  const barcodes = detail?.barcodes || [];
  const stores = storesData?.data || [];
  const isBatchPriced = detail?.pricingMode === 'batch';

  // Default the selected barcode (newest) and store once data arrives.
  useEffect(() => {
    const list = data?.barcodes || [];
    if (list.length > 0) setSelectedBarcode(list[list.length - 1]);
  }, [data]);

  useEffect(() => {
    const list = storesData?.data || [];
    if (list.length > 0) setStoreId((current) => current || list[0].id);
  }, [storesData]);

  const generateBarcode = useApiMutation(productService.generateBarcode, {
    successMessage: 'Barcode generated',
    invalidateKeys: [
      queryKeys.products.all,
      queryKeys.products.detail(product?.id),
    ],
  });

  const storePrice = useMemo(() => {
    const match = (detail?.prices || []).find((p) => p.store?.id === storeId);

    return match?.sellPrice;
  }, [detail, storeId]);

  const showPrice = !isBatchPriced && storePrice !== undefined && storePrice > 0;

  const handleGenerate = () => {
    generateBarcode.mutate({ id: product.id, format });
  };

  const handlePrint = () => {
    document.body.classList.add('printing-labels');
    window.print();
    document.body.classList.remove('printing-labels');
  };

  const labelCount = Math.max(1, Math.min(Number(quantity) || 1, 60));

  if (!product) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Barcodes — ${product.name}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            icon={<Printer size={16} aria-hidden="true" />}
            onClick={handlePrint}
            disabled={!selectedBarcode}
          >
            Print labels
          </Button>
        </>
      }
    >
      {isLoading ? (
        <LoadingState message="Loading barcodes..." />
      ) : errorMessage ? (
        <EmptyState title="Could not load barcodes" message={errorMessage} />
      ) : (
        <div className="space-y-5">
          {/* Generate */}
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
            <div className="w-44">
              <Select
                label="Generate barcode"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                options={[
                  { value: 'ean13', label: 'In-store EAN-13' },
                  { value: 'code128', label: 'Code128 (from SKU)' },
                ]}
              />
            </div>
            <Button onClick={handleGenerate} loading={generateBarcode.isPending}>
              Generate
            </Button>
          </div>

          {/* Existing barcodes */}
          {barcodes.length === 0 ? (
            <EmptyState
              title="No barcodes yet"
              message="Generate one above, or add manufacturer barcodes when editing the product."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-56">
                  <Select
                    label="Barcode to print"
                    value={selectedBarcode}
                    onChange={(event) => setSelectedBarcode(event.target.value)}
                    options={barcodes.map((b) => ({ value: b, label: b }))}
                  />
                </div>

                <div className="w-48">
                  <Select
                    label="Price from store"
                    value={storeId}
                    onChange={(event) => setStoreId(event.target.value)}
                    options={stores.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                    disabled={isBatchPriced}
                  />
                </div>

                <div className="w-28">
                  <Input
                    label="Labels"
                    type="number"
                    min="1"
                    max="60"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>
              </div>

              {isBatchPriced && (
                <div className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800">
                  This product is <strong>batch-priced</strong> — labels print
                  without a price. Price labels are printed per batch at
                  receiving time.
                </div>
              )}

              {/* Single preview */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
                <div className="inline-flex flex-col items-center rounded-lg border border-gray-200 p-3 text-center">
                  <span className="text-xs font-medium text-gray-900">
                    {product.name}
                  </span>
                  <Barcode value={selectedBarcode} />
                  {showPrice ? (
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(storePrice)}
                    </span>
                  ) : (
                    !isBatchPriced && (
                      <Badge variant="gray">no price set for this store</Badge>
                    )
                  )}
                </div>
              </div>

              {/* Print sheet — hidden on screen, shown only when printing */}
              <div className="print-labels hidden print:block">
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: labelCount }).map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center border border-gray-300 p-2 text-center"
                      style={{ breakInside: 'avoid' }}
                    >
                      <span className="text-[10px] font-medium">
                        {product.name}
                      </span>
                      <Barcode
                        value={selectedBarcode}
                        height={40}
                        fontSize={12}
                      />
                      {showPrice && (
                        <span className="text-xs font-bold">
                          {formatCurrency(storePrice)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

BarcodeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
};

export default BarcodeModal;
