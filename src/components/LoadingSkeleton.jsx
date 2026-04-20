export default function LoadingSkeleton({ variant = "card", count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "metric") {
    return (
      <div className="skeleton-grid skeleton-grid--metrics">
        {items.map((i) => (
          <div key={i} className="skeleton skeleton-metric" />
        ))}
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className="skeleton-grid">
        {items.map((i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-grid">
      {items.map((i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}
