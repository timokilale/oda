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

    // Focus the new button
    const buttons = containerRef.current?.querySelectorAll("[role='radio']");
    buttons?.[nextIndex]?.focus();
  }

  return (
    <div
      className="segmented-control"
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
            className="segmented-control__option"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
