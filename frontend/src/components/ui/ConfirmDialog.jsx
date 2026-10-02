/**
 * Global promise-based confirmation dialog. window.confirm is banned —
 * call confirmDialog({ title, message, ... }) and await the boolean.
 * <ConfirmDialogHost /> is mounted exactly once in App.jsx.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

import Button from './Button.jsx';

let requestConfirm = null;

export const confirmDialog = (options) => {
  if (!requestConfirm) {
    return Promise.resolve(false);
  }

  return requestConfirm(options);
};

export const ConfirmDialogHost = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    requestConfirm = (options) =>
      new Promise((resolve) => {
        setState({ ...options, resolve });
      });

    return () => {
      requestConfirm = null;
    };
  }, []);

  if (!state) return null;

  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    resolve,
  } = state;

  const close = (answer) => {
    resolve(answer);
    setState(null);
  };

  const isDanger = variant === 'danger';

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm animate-scale-in rounded-2xl border border-line bg-elevated p-5 shadow-overlay"
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isDanger
                ? 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400'
                : 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400'
            }`}
          >
            <AlertTriangle size={18} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-content">{title}</h2>
            {message && <p className="mt-1 text-sm text-muted">{message}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            {cancelText}
          </Button>

          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={() => close(true)}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialogHost;
