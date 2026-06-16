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
      const dialogBody = dialogRef.current?.querySelector("[data-dialog-body]");
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-[720px] mx-4 max-h-[calc(100dvh-64px)] flex flex-col rounded-xl border border-border bg-card shadow-lg"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-xl font-display italic text-foreground">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors shrink-0"
            onClick={() => onClose?.()}
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5" data-dialog-body>
          {children}
        </div>

        {footer ? (
          <div className="px-6 py-4 border-t border-border">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
