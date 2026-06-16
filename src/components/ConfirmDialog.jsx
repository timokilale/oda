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

    const timer = window.setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 60);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        return;
      }

      if (event.key === "Tab") {
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
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
        className={`w-full max-w-[420px] mx-4 rounded-xl border bg-card shadow-lg ${
          isDestructive ? "border-destructive/30" : "border-border"
        }`}
        ref={dialogRef}
      >
        <div className="p-6">
          <h2 className={`text-xl font-display italic mb-2 ${
            isDestructive ? "text-destructive" : "text-foreground"
          }`}>
            {title}
          </h2>
          {message ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
            onClick={() => onCancel?.()}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            className={`inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium text-white transition-colors ${
              isDestructive
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90"
            }`}
            onClick={() => onConfirm?.()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
