/**
 * Multi-line text field — same chrome as Input.
 */
import { useId } from 'react';
import PropTypes from 'prop-types';

import FieldWrapper from './FieldWrapper.jsx';

const TextArea = ({
  label,
  error,
  helperText,
  rows = 3,
  className = '',
  ...props
}) => {
  const id = useId();

  return (
    <FieldWrapper label={label} error={error} helperText={helperText} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-content placeholder-faint outline-none transition-colors focus:ring-2 ${
          error
            ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
            : 'border-line hover:border-line-strong focus:border-content focus:ring-content/10'
        } ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
};

TextArea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  rows: PropTypes.number,
  className: PropTypes.string,
};

export default TextArea;
