export default function LoadingSkeleton({ variant = "card", count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "metric") {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {items.map((i) => (
          <div key={i} className="h-[132px] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className="grid gap-2">
        {items.map((i) => (
          <div key={i} className="h-[52px] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
      {items.map((i) => (
        <div key={i} className="h-[140px] rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}
