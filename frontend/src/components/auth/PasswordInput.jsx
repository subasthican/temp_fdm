import { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

import { Input } from '../ui';

const PasswordInput = ({ className = '', ...props }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      type={isVisible ? 'text' : 'password'}
      leftIcon={<LockKeyhole size={18} aria-hidden="true" />}
      rightIcon={
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="rounded-md p-1 text-faint transition-colors hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      className={`h-12 text-base ${className}`}
      {...props}
    />
  );
};

PasswordInput.propTypes = {
  className: PropTypes.string,
};

export default PasswordInput;
