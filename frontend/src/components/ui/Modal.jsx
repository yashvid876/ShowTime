import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

/** Native <dialog>: focus trap, Esc handling and inert background come from the browser. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return undefined;
    if (!el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    }
    return () => { if (typeof el.close === 'function') el.close(); };
  }, [open]);
  if (!open) return null;
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(e) => { e.preventDefault(); onClose?.(); }}
      onClick={(e) => { if (e.target === ref.current) onClose?.(); }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-2xl bg-white shadow-pop backdrop:bg-ink-900/50`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
        <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-1 text-ink-500 hover:bg-ink-100">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-5 py-3">{footer}</div>}
    </dialog>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = 'Confirm', cancelLabel = 'Keep', danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="text-sm text-ink-700">{children}</div>
    </Modal>
  );
}
