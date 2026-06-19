import { cn } from "../../lib/utils.js";

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  className,
}) {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
  };

  const thumbClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
  };

  const translateClasses = {
    sm: 'translate-x-[18px]',
    md: 'translate-x-5',
  };

  const s = sizeClasses[size] || sizeClasses.md;
  const t = thumbClasses[size] || thumbClasses.md;
  const tr = translateClasses[size] || translateClasses.md;

  if (label || description) {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <div className="min-w-0">
          {label && (
            <span className="block text-sm text-neutral-800 dark:text-neutral-100">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-neutral-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={`${s} rounded-full transition-colors peer-focus:outline-none ${
              checked ? 'bg-[#10B981]' : 'bg-neutral-300 dark:bg-neutral-600'
            }`}
          >
            <span
              className={`${t} ${checked ? tr : 'translate-x-0.5'} inline-block rounded-full bg-white shadow-sm transform transition-transform`}
            />
          </div>
        </label>
      </div>
    );
  }

  return (
    <label className={cn('relative inline-flex items-center cursor-pointer', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div
        className={`${s} rounded-full transition-colors peer-focus:outline-none ${
          checked ? 'bg-neutral-700 dark:bg-neutral-300' : 'bg-neutral-300 dark:bg-neutral-600'
        }`}
      >
        <span
          className={`${t} ${checked ? tr : 'translate-x-0.5'} inline-block rounded-full bg-white transform transition-transform`}
        />
      </div>
    </label>
  );
}
