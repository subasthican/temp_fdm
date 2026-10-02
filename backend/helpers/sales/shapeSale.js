// Shapes a completed sale document into the standard response object, so
// a freshly completed sale and an idempotent replay look identical.
export const shapeSale = (sale) => ({
  id: sale._id,
  clientSaleId: sale.clientSaleId,
  receiptNo: sale.receiptNo,
  storeId: sale.storeId,
  registerId: sale.registerId,
  status: sale.status,
  lines: sale.lines.map((l) => ({
    productId: l.productId,
    name: l.name,
    barcode: l.barcode,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
    batchNo: l.batchNo,
  })),
  subtotal: sale.subtotal,
  discountTotal: sale.discountTotal,
  taxTotal: sale.taxTotal,
  grandTotal: sale.grandTotal,
  payments: sale.payments.map((p) => ({ method: p.method, amount: p.amount })),
  changeGiven: sale.changeGiven,
  soldAt: sale.soldAt,
});

export default shapeSale;
