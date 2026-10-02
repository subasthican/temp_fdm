/**
 * Thermal-style (80mm) receipt. Rendered from the enriched getSaleById
 * payload for both on-screen preview and printing.
 */
import PropTypes from 'prop-types';

import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

const PAYMENT_LABELS = { cash: 'Cash', card: 'Card', wallet: 'Wallet' };

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

Row.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  bold: PropTypes.bool,
};

const Receipt = ({ sale }) => {
  if (!sale) return null;

  const { store, register } = sale;

  return (
    <div className="mx-auto w-[80mm] bg-white p-3 font-mono text-[11px] leading-tight text-black">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-bold uppercase">{store?.name || 'Store'}</p>
        {store?.address && <p>{store.address}</p>}
        {store?.phone && <p>{store.phone}</p>}
        {store?.header && <p className="mt-1">{store.header}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <Row label="Receipt" value={sale.receiptNo} />
      <Row label="Date" value={formatDateTime(sale.soldAt)} />
      {register && <Row label="Register" value={register.code} />}
      {sale.cashier && <Row label="Cashier" value={sale.cashier} />}

      <div className="my-2 border-t border-dashed border-black" />

      {/* Line items */}
      <div className="space-y-1">
        {sale.lines.map((line, index) => (
          <div key={index}>
            <p className="truncate">{line.name}</p>
            <div className="flex justify-between">
              <span>
                {line.quantity} × {formatCurrency(line.unitPrice)}
                {line.batchNo ? ` (${line.batchNo})` : ''}
              </span>
              <span>{formatCurrency(line.lineTotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <Row label="Subtotal" value={formatCurrency(sale.subtotal)} />
      {sale.discountTotal > 0 && (
        <Row label="Discount" value={`-${formatCurrency(sale.discountTotal)}`} />
      )}
      {sale.taxTotal > 0 && <Row label="Tax" value={formatCurrency(sale.taxTotal)} />}
      <Row label="TOTAL" value={formatCurrency(sale.grandTotal)} bold />

      <div className="my-2 border-t border-dashed border-black" />

      {sale.payments.map((p, index) => (
        <Row
          key={index}
          label={PAYMENT_LABELS[p.method] || p.method}
          value={formatCurrency(p.amount)}
        />
      ))}
      {sale.changeGiven > 0 && (
        <Row label="Change" value={formatCurrency(sale.changeGiven)} bold />
      )}

      <div className="my-2 border-t border-dashed border-black" />

      <div className="text-center">
        <p>{store?.footer || 'Thank you!'}</p>
      </div>
    </div>
  );
};

Receipt.propTypes = {
  sale: PropTypes.object,
};

export default Receipt;
