/**
 * Reusable action menu. A trigger button opens a portal-anchored popover
 * of items — used for row actions (kebab), overflow menus, and any
 * "click to reveal a short list of actions" pattern.
 *
 *   <Dropdown
 *     items={[
 *       { label: 'Edit', icon: <Pencil size={15} />, onClick: ... },
 *       { type: 'divider' },
 *       { label: 'Delete', icon: <Trash2 size={15} />, danger: true, onClick: ... },
 *     ]}
 *   />
 *
 * Pass a custom `trigger` node, or rely on the default kebab button.
 */
import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { MoreHorizontal } from 'lucide-react';

const Dropdown = ({ items, trigger, align = 'right', label = 'Open menu', width = 200 }) => {
  const id = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = align === 'right' ? rect.right - width : rect.left;
    setCoords({ top: rect.bottom + 6, left: Math.max(8, left) });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (event) => {
    event.stopPropagation();
    setOpen((o) => !o);
  };

  const triggerNode = trigger ? (
    cloneElement(trigger, { ref: triggerRef, onClick: toggle, 'aria-expanded': open })
  ) : (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={open}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-content/10"
    >
      <MoreHorizontal size={18} aria-hidden="true" />
    </button>
  );

  return (
    <>
      {triggerNode}

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-labelledby={id}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width }}
            className="z-[70] origin-top animate-slide-down overflow-hidden rounded-xl border border-line bg-elevated p-1 shadow-overlay"
          >
            {items.map((item, index) => {
              if (item.type === 'divider') {
                return <div key={`d-${index}`} className="my-1 h-px bg-line" />;
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    item.onClick?.(event);
                  }}
                  role="menuitem"
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    item.danger
                      ? 'text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10'
                      : 'text-content hover:bg-surface-muted'
                  }`}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};

Dropdown.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['divider']),
      label: PropTypes.string,
      icon: PropTypes.node,
      onClick: PropTypes.func,
      danger: PropTypes.bool,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  trigger: PropTypes.element,
  align: PropTypes.oneOf(['left', 'right']),
  label: PropTypes.string,
  width: PropTypes.number,
};

export default Dropdown;
