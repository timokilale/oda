import LoadingSkeleton from "../LoadingSkeleton.jsx";
import SegmentedControl from "../SegmentedControl.jsx";
import { formatCurrency } from "../../lib/format.js";

const MENU_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
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
          <h2 className="text-[1.42rem] font-display italic text-foreground">Catalog</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Active dishes are visible to customers. Archived dishes stay searchable here.
          </p>
        </div>
        <SegmentedControl
          label="Menu item filter"
          options={MENU_FILTER_OPTIONS}
          value={filter}
          onChange={onFilterChange}
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="table-row" count={4} />
      ) : visibleItems.length ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm responsive-table">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Image</th>
                <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Name</th>
                <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Category</th>
                <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Status</th>
                <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Description</th>
                <th scope="col" className="text-right py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Price</th>
                <th scope="col" className="text-right py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${item.active ? "" : "opacity-60"}`}>
                  <td className="py-3 px-3" data-label="Image">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-[52px] h-[52px] rounded-lg object-cover"
                        style={{
                          objectPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%`,
                        }}
                      />
                    ) : (
                      <span className="inline-block w-[52px] h-[52px] rounded-lg bg-muted" aria-hidden="true" />
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium" data-label="Name">{item.name}</td>
                  <td className="py-3 px-3 text-muted-foreground" data-label="Category">{item.category}</td>
                  <td className="py-3 px-3" data-label="Status">
                    <span
                      className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border uppercase tracking-wider ${
                        item.active
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                      role="status"
                      aria-label={`Menu item status: ${item.active ? "active" : "archived"}`}
                    >
                      {item.active ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate" data-label="Description">
                    {item.description || "No description yet."}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums" data-label="Price">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-3 px-3" data-label="Action">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                          item.active
                            ? "border border-border bg-background text-muted-foreground hover:bg-muted"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                        onClick={() => onToggleAvailability(item, !item.active)}
                      >
                        {item.active ? "Archive" : "Restore"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10">
          <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 mx-auto mb-3 text-muted-foreground/30">
            <ellipse cx="24" cy="28" rx="14" ry="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 18c0-2 2-6 8-6s8 4 8 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="20" y1="12" x2="20" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="28" y1="12" x2="28" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <h3 className="text-lg font-display italic text-foreground">
            {filter === "archived"
              ? "No archived items"
              : filter === "all"
                ? "No menu items"
                : "No active menu items"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {filter === "archived"
              ? "Archived dishes will appear here so you can restore them when needed."
              : "Use Add items to build the menu in batches, then fine-tune any dish from this catalog."}
          </p>
        </div>
      )}
    </section>
  );
}
