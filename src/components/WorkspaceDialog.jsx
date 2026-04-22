import { useEffect, useRef } from "react";

export default function WorkspaceDialog({
  open,
  title,
  description = "",
  footer = null,
  onClose,
  children,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 60);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="workspace-dialog" ref={dialogRef}>
        <div className="workspace-dialog__header">
          <div>
            <h2 className="workspace-dialog__title">{title}</h2>
            {description ? <p className="workspace-dialog__description">{description}</p> : null}
          </div>
          <button type="button" className="button button-secondary" onClick={() => onClose?.()}>
            Close
          </button>
        </div>

        <div className="workspace-dialog__body">{children}</div>

        {footer ? <div className="workspace-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
