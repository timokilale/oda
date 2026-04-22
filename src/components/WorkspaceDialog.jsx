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
  const onCloseRef = useRef(onClose);
  const focusedOnOpenRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      focusedOnOpenRef.current = false;
      return undefined;
    }

    if (focusedOnOpenRef.current) {
      return undefined;
    }

    focusedOnOpenRef.current = true;

    const timer = window.setTimeout(() => {
      const dialogBody = dialogRef.current?.querySelector(".workspace-dialog__body");
      const firstFocusable =
        dialogBody?.querySelector(
          '[data-dialog-autofocus], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ||
        dialogRef.current?.querySelector(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
      firstFocusable?.focus();
    }, 60);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

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
