import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "confirm",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    // Focus the cancel button by default (safer default)
    const timer = window.setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 60);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        return;
      }

      // Trap focus inside dialog
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable?.length) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const isDestructive = variant === "danger";

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`confirm-dialog${isDestructive ? " confirm-dialog--danger" : ""}`}
        ref={dialogRef}
      >
        <h2 className="confirm-dialog__title">{title}</h2>
        {message ? <p className="confirm-dialog__message">{message}</p> : null}
        <div className="confirm-dialog__actions">
          <button type="button" className="button" onClick={() => onCancel?.()}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${isDestructive ? "button-danger" : "button-confirm"}`}
            ref={confirmBtnRef}
            onClick={() => onConfirm?.()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
