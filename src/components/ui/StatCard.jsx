import { cn } from "../../lib/utils.js";

export default function StatCard({
  label,
  value,
  sublabel,
  className,
}) {
  return (
    <div className={cn('bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-xl', className)}>
      <span className="block font-sans text-[10px] font-medium text-neutral-400">
        {label}
      </span>
      <p className="font-sans text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
        {value}
      </p>
      {sublabel && (
        <span className="block font-sans text-[11px] text-neutral-400 mt-0.5">
          {sublabel}
        </span>
      )}
    </div>
  );
}
