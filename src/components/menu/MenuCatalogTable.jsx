import LoadingSkeleton from "../LoadingSkeleton.jsx";
import SegmentedControl from "../SegmentedControl.jsx";
import { formatCurrency } from "../../lib/format.js";

const MENU_FILTER_OPTIONS = [
  { value: "active", label: "Available" },
  { value: "archived", label: "Sold out" },
  { value: "all", label: "All" },
];

export default function MenuCatalogTable({
  items,
  visibleItems,
  filter,
  onFilterChange,
  loading,
  onEdit,
  onToggleAvailability,
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Items</h2>
        </div>
        <SegmentedControl
          label="Filter"
          options={MENU_FILTER_OPTIONS}
          value={filter}
          onChange={onFilterChange}
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="table-row" count={4} />
      ) : visibleItems.length ? (
        <div className="grid gap-2">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                item.active ? "border-border" : "border-border bg-muted/30 opacity-70"
              }`}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                  style={{
                    objectPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%`,
                  }}
                />
              ) : (
                <span className="w-10 h-10 rounded-lg bg-muted shrink-0" aria-hidden="true" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(item.price)}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    item.active
                      ? "border-border bg-background text-muted-foreground hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent"
                  }`}
                  onClick={() => onToggleAvailability(item, !item.active)}
                  title={item.active ? "Mark as sold out" : "Restore to menu"}
                >
                  {item.active ? "Sold out" : "Restore"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  onClick={() => onEdit(item)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-muted-foreground/50">
              <ellipse cx="12" cy="14" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 9c0-1 1-3 4-3s4 2 4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="10" y1="6" x2="10" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="14" y1="6" x2="14" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {filter === "archived"
              ? "No sold out items"
              : filter === "all"
                ? "No items yet"
                : "No available items"}
          </h3>
        </div>
      )}
    </section>
  );
}
