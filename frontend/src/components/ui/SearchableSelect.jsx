/**
 * Filterable dropdown for long lists (products, customers, suppliers).
 * Keyboard navigable: arrows to move, Enter to pick, Escape to close.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Search } from 'lucide-react';

import FieldWrapper from './FieldWrapper.jsx';

const SearchableSelect = ({
  label,
  error,
  helperText,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, search]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);

    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
    setSearch('');
  };

  const onKeyDown = (event) => {
    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[highlighted]) pick(filtered[highlighted]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <FieldWrapper label={label} error={error} helperText={helperText}>
      <div ref={containerRef} className="relative" onKeyDown={onKeyDown}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-10 w-full items-center justify-between rounded-lg border bg-surface px-3 text-left text-sm outline-none transition-colors focus:ring-2 ${
            error
              ? 'border-danger-400 focus:ring-danger-500/20'
              : 'border-line hover:border-line-strong focus:border-content focus:ring-content/10'
          }`}
        >
          <span className={selected ? 'text-content' : 'text-faint'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-full origin-top animate-slide-down rounded-xl border border-line bg-elevated shadow-overlay">
            <div className="border-b border-line p-2">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute inset-y-0 left-2.5 my-auto text-faint"
                  aria-hidden="true"
                />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setHighlighted(0);
                  }}
                  placeholder="Type to filter..."
                  className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-2 text-sm text-content placeholder-faint outline-none focus:border-content focus:ring-2 focus:ring-content/10"
                />
              </div>
            </div>

            <ul
              role="listbox"
              className="scrollbar-thin max-h-56 overflow-y-auto p-1"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-faint">No matches</li>
              )}

              {filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <button
                    type="button"
                    onClick={() => pick(option)}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      index === highlighted
                        ? 'bg-surface-muted font-medium text-content'
                        : 'text-content hover:bg-surface-muted'
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

SearchableSelect.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default SearchableSelect;
