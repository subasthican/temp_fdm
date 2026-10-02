/**
 * Attractive custom dropdown for short static option lists. Replaces the
 * native <select> with a styled, animated, keyboard-navigable popover that
 * is portal-anchored so it never clips inside tables or modals.
 *
 * onChange stays compatible with the native contract — it receives an
 * event-like `{ target: { value } }`, so existing call sites keep working.
 * For long/filterable lists use SearchableSelect.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Check, ChevronDown } from 'lucide-react';

import FieldWrapper from './FieldWrapper.jsx';

const Select = ({
  label,
  error,
  helperText,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}) => {
  const id = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const selected = options.find((option) => String(option.value) === String(value));

  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (
        !menuRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (option) => {
    onChange?.({ target: { value: option.value } });
    setOpen(false);
  };

  return (
    <FieldWrapper label={label} error={error} helperText={helperText} htmlFor={id}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          error
            ? 'border-danger-400 focus-visible:ring-2 focus-visible:ring-danger-500/20'
            : 'border-line hover:border-line-strong focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-content/10'
        } ${className}`}
      >
        <span className={`truncate ${selected ? 'text-content' : 'text-faint'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            className="scrollbar-thin z-[70] max-h-64 origin-top animate-slide-down overflow-y-auto rounded-xl border border-line bg-elevated p-1 shadow-overlay"
          >
            {options.map((option) => {
              const active = String(option.value) === String(value);
              return (
                <li key={String(option.value)} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(option)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-surface-muted font-medium text-content'
                        : 'text-content hover:bg-surface-muted'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && (
                      <Check size={15} className="shrink-0 text-content" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </FieldWrapper>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Select;
