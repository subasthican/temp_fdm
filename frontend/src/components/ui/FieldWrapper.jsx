/**
 * Standard label / error / helper chrome for field components. Only for
 * building NEW field components — pages use Input/TextArea/Select.
 */
import PropTypes from 'prop-types';

const FieldWrapper = ({ label, error, helperText, htmlFor, children }) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-medium text-content"
        >
          {label}
        </label>
      )}

      {children}

      {error ? (
        <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

FieldWrapper.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default FieldWrapper;
