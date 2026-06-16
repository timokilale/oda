import { useRef } from "react";

export default function SegmentedControl({ label, options, value, onChange }) {
  const containerRef = useRef(null);

  function handleKeyDown(event) {
    const currentIndex = options.findIndex((option) => option.value === value);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else {
      return;
    }

    onChange(options[nextIndex].value);
    const buttons = containerRef.current?.querySelectorAll("[role='radio']");
    buttons?.[nextIndex]?.focus();
  }

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-background p-0.5"
      role="radiogroup"
      aria-label={label}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const isChecked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isChecked ? "true" : "false"}
            tabIndex={isChecked ? 0 : -1}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isChecked
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
