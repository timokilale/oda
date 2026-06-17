import { cn } from "../../lib/utils.js";
import { formatCurrency } from "../../lib/format.js";
import { useMenuInteraction } from "../../context/MenuInteractionContext.jsx";

export default function MenuNode({
  node,
  nodeId,
  level,
  collapsible = true,
  hideHeader = false,
  searchTerm,
}) {
  const { openNodes, setOpenNodes, openItems, setOpenItems, quantities, setQuantities } =
    useMenuInteraction();
  const isOpen = collapsible ? (searchTerm ? true : openNodes.has(nodeId)) : true;

  function toggleNode() {
    if (!collapsible) return;
    setOpenNodes((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function toggleItem(itemId) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function updateQuantity(itemId, delta) {
    setQuantities((prev) => {
      const current = Number(prev[itemId] || 0);
      const next = Math.max(0, Math.min(20, current + delta));
      return { ...prev, [itemId]: next };
    });
  }

  return (
    <div className={cn("flex flex-col", hideHeader ? "" : "border-t border-border")}>
      {hideHeader ? null : collapsible ? (
        <button
          type="button"
          onClick={toggleNode}
          aria-expanded={isOpen}
          className={cn(
            "flex items-center w-full text-left cursor-pointer bg-transparent transition-colors hover:bg-muted/50",
            level === 1 ? "px-4 py-4 gap-3" : "px-4 py-3 gap-2",
          )}
        >
          <span className={cn(
            "flex-1 font-semibold text-foreground",
            level === 1 ? "text-base" : "text-sm text-muted-foreground uppercase tracking-wide",
          )}>
            {node.name}
          </span>
          <svg
            className={cn(
              "w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-300",
              isOpen && "rotate-180 text-primary",
            )}
            viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <div className={cn(
          "flex items-center w-full",
          level === 1 ? "px-4 py-4 gap-3" : "px-4 py-3 gap-2",
        )}>
          <span className={cn(
            "flex-1 font-semibold",
            level === 1 ? "text-base text-foreground" : "text-sm text-muted-foreground uppercase tracking-wide",
          )}>
            {node.name}
          </span>
        </div>
      )}

      <div className={cn(
        "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
        isOpen && "grid-rows-[1fr]",
      )}>
        <div className="overflow-hidden">
          {(node.children || []).map((child, index) => (
            <MenuNode
              key={`${nodeId}-${index + 1}`}
              node={child}
              nodeId={`${nodeId}-${index + 1}`}
              level={level + 1}
              collapsible
              searchTerm={searchTerm}
            />
          ))}

          {node.items?.length ? (
            <ul className="flex flex-col list-none" role="list">
              {node.items.map((item, index) => {
                const itemId = String(item.id);
                const qty = Number(quantities[itemId] || 0);
                const isSelected = qty > 0;
                const isItemOpen = openItems.has(itemId);

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "border-t border-border first:border-t-0",
                      "opacity-0 translate-y-1 animate-[cardIn_300ms_ease-out_both]",
                    )}
                    style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                  >
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleItem(itemId)}
                        aria-expanded={isItemOpen}
                        className="flex-1 min-w-0 text-left cursor-pointer bg-transparent"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-[15px] leading-tight">
                            {item.name}
                          </h3>
                          {isSelected ? (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold font-mono leading-none animate-[badgePop_200ms_ease-out_both]">
                              {qty}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-mono text-sm font-medium text-primary">
                          {formatCurrency(item.price)}
                        </p>
                        {item.description ? (
                          <p className={cn(
                            "mt-1.5 text-[13px] text-muted-foreground leading-relaxed",
                            !isItemOpen && "line-clamp-2",
                          )}>
                            {item.description}
                          </p>
                        ) : null}
                      </button>

                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleItem(itemId)}
                          aria-label={`View ${item.name}`}
                          className="block w-[88px] h-[88px] rounded-xl overflow-hidden bg-muted cursor-pointer"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              crossOrigin="anonymous"
                              loading="lazy"
                              className="w-full h-full object-cover"
                              style={{ objectPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%` }}
                            />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-muted-foreground" aria-hidden="true">
                              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                                <path d="M4 7h16v12H4z" stroke="currentColor" strokeWidth="1.4" />
                                <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
                                <path d="M5 18l5-4 3 2 3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </button>

                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemId, 1)}
                            aria-label={`Add ${item.name}`}
                            className="absolute -bottom-2 -right-2 grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-transform duration-150 active:scale-90 cursor-pointer"
                          >
                            <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                              <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                              <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            </svg>
                          </button>
                        ) : (
                          <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 h-9 px-1 rounded-full bg-card shadow-md ring-1 ring-border animate-[badgePop_180ms_ease-out_both]">
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, -1)}
                              aria-label={`Remove one ${item.name}`}
                              className="grid place-items-center w-7 h-7 rounded-full text-foreground hover:bg-muted transition-colors active:scale-90 cursor-pointer"
                            >
                              <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                                <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                              </svg>
                            </button>
                            <output className="min-w-5 text-center text-sm font-semibold text-foreground font-mono" aria-live="polite">
                              {qty}
                            </output>
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, 1)}
                              disabled={qty >= 20}
                              aria-label={`Add one ${item.name}`}
                              className="grid place-items-center w-7 h-7 rounded-full text-primary hover:bg-accent transition-colors active:scale-90 disabled:opacity-30 cursor-pointer"
                            >
                              <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                                <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                                <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
