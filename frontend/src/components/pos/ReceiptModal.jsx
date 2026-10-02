/**
 * Receipt preview + print for a completed sale. Fetches the enriched
 * sale via getSaleById (also used for reprints) and prints an 80mm
 * receipt via print-only CSS.
 */
import PropTypes from 'prop-types';

import * as saleService from '../../services/saleService.js';
import { useApiQuery } from '../../hooks/api';
import { queryKeys } from '../../constants';
import Receipt from './Receipt.jsx';
import { Button, EmptyState, LoadingState, Modal } from '../ui';

const ReceiptModal = ({ open, saleId, onClose }) => {
  const { data: sale, isLoading, errorMessage } = useApiQuery(
    queryKeys.sales.receipt(saleId),
    () => saleService.getSaleById(saleId),
    { enabled: open && Boolean(saleId) },
  );

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    document.body.classList.remove('printing-receipt');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receipt"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} disabled={!sale}>
            Print
          </Button>
        </>
      }
    >
      {isLoading ? (
        <LoadingState message="Loading receipt..." />
      ) : errorMessage ? (
        <EmptyState title="Could not load receipt" message={errorMessage} />
      ) : (
        <div className="flex justify-center">
          <div className="print-receipt rounded-lg border border-gray-200 shadow-sm">
            <Receipt sale={sale} />
          </div>
        </div>
      )}
    </Modal>
  );
};

ReceiptModal.propTypes = {
  open: PropTypes.bool.isRequired,
  saleId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ReceiptModal;
