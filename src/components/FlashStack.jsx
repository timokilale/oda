import { useCallback, useEffect, useState } from "react";

export default function FlashStack({ flash, onDismiss, bottom = false }) {
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissing(true);
    window.setTimeout(() => {
      setDismissing(false);
      onDismiss?.();
    }, 200);
  }, [onDismiss]);

  useEffect(() => {
    if (!flash || flash.type === "error") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      handleDismiss();
    }, 4200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flash, handleDismiss]);

  useEffect(() => {
    setDismissing(false);
  }, [flash]);

  if (!flash?.message) {
    return null;
  }

  const isError = flash.type === "error";

  return (
    <div className={`fixed z-50 left-1/2 -translate-x-1/2 ${bottom ? "bottom-4" : "top-4"}`} data-flash-stack>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 ${
          dismissing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        } ${
          isError
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-primary border-primary/20 text-primary-foreground"
        }`}
        data-flash
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
      >
        <div className="flex items-center gap-2">
          <strong className="text-xs uppercase tracking-widest font-mono">
            {isError ? "Attention" : "Success"}
          </strong>
          <span className="text-sm">{flash.message}</span>
        </div>
        <button
          type="button"
          className="ml-auto text-xs underline underline-offset-2 hover:no-underline opacity-70 hover:opacity-100"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
