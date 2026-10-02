/**
 * Single-line field (text / number / date / password). Standard chrome
 * via FieldWrapper; optional left/right icons.
 */
import { useId } from 'react';
import PropTypes from 'prop-types';

import FieldWrapper from './FieldWrapper.jsx';

const Input = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const id = useId();

  return (
    <FieldWrapper label={label} error={error} helperText={helperText} htmlFor={id}>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-content placeholder-faint outline-none transition-colors focus:ring-2 ${
            error
              ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
              : 'border-line hover:border-line-strong focus:border-content focus:ring-content/10'
          } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${className}`}
          {...props}
        />

        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-faint">
            {rightIcon}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Input;
