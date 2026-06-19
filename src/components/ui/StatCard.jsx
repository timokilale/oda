import { cn } from "../../lib/utils.js";

export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent = 'primary',
  className,
}) {
  const accentClasses = {
    primary: {
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#2a14b4]',
      valueColor: 'text-[#2a14b4] dark:text-[#c3c0ff]',
    },
    secondary: {
      iconBg: 'bg-[#f3f4f5]',
      iconColor: 'text-[#5b598c]',
      valueColor: 'text-[#5b598c] dark:text-neutral-300',
    },
    success: {
      iconBg: 'bg-[#D1FAE5]',
      iconColor: 'text-[#10B981]',
      valueColor: 'text-[#10B981]',
    },
    warning: {
      iconBg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#F59E0B]',
      valueColor: 'text-[#F59E0B]',
    },
    neutral: {
      iconBg: 'bg-neutral-100 dark:bg-neutral-800',
      iconColor: 'text-neutral-500 dark:text-neutral-400',
      valueColor: 'text-neutral-800 dark:text-white',
    },
  };

  const a = accentClasses[accent] || accentClasses.primary;

  return (
    <div className={cn('bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl shadow-xs', className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-full ${a.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${a.iconColor}`} />
          </div>
        )}
        <div className="min-w-0">
          <span className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {label}
          </span>
          <p className={`font-sans text-2xl font-bold text-neutral-800 dark:text-white mt-1 ${!Icon ? 'text-3xl' : ''}`}>
            {value}
          </p>
          {sublabel && (
            <span className="block font-sans text-[11px] text-neutral-400 mt-0.5 font-semibold">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
