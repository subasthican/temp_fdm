/**
 * Renders a barcode value as inline SVG via jsbarcode. Symbology is
 * auto-detected: a 13-digit numeric value is EAN-13, anything else
 * Code128.
 */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import JsBarcode from 'jsbarcode';

const detectFormat = (value) => (/^\d{13}$/.test(value) ? 'EAN13' : 'CODE128');

const Barcode = ({ value, height = 50, fontSize = 14, displayValue = true }) => {
  const ref = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !value) return;

    try {
      JsBarcode(ref.current, value, {
        format: detectFormat(value),
        height,
        fontSize,
        displayValue,
        margin: 6,
      });
      setError(false);
    } catch {
      setError(true);
    }
  }, [value, height, fontSize, displayValue]);

  if (error) {
    return <span className="text-xs text-danger-600">Invalid barcode</span>;
  }

  return <svg ref={ref} />;
};

Barcode.propTypes = {
  value: PropTypes.string.isRequired,
  height: PropTypes.number,
  fontSize: PropTypes.number,
  displayValue: PropTypes.bool,
};

export default Barcode;
