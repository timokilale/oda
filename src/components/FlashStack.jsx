import { useEffect } from "react";

export default function FlashStack({ flash, onDismiss, bottom = false }) {
  useEffect(() => {
    if (!flash || flash.type === "error") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onDismiss?.();
    }, 4200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flash, onDismiss]);

  if (!flash?.message) {
    return null;
  }

  const tone = flash.type === "error" ? "error" : "success";

  return (
    <div className={`flash-stack${bottom ? " flash-stack--bottom" : ""}`} data-flash-stack>
      <div className={`flash flash--${tone}`} data-flash role={tone === "error" ? "alert" : "status"}>
        <div className="flash__body">
          <strong className="flash__title">{tone === "error" ? "Attention" : "Success"}</strong>
          <span>{flash.message}</span>
        </div>
        <button type="button" className="flash__dismiss" onClick={() => onDismiss?.()}>
          Close
        </button>
      </div>
    </div>
  );
}
