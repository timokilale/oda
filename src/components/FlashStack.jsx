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

  const tone = flash.type === "error" ? "error" : "success";

  return (
    <div className={`flash-stack${bottom ? " flash-stack--bottom" : ""}`} data-flash-stack>
      <div
        className={`flash flash--${tone}${dismissing ? " is-dismissing" : ""}`}
        data-flash
        role={tone === "error" ? "alert" : "status"}
      >
        <div className="flash__body">
          <strong className="flash__title">{tone === "error" ? "Attention" : "Success"}</strong>
          <span>{flash.message}</span>
        </div>
        <button type="button" className="flash__dismiss" onClick={handleDismiss}>
          Close
        </button>
      </div>
    </div>
  );
}
