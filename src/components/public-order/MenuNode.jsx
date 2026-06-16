import { cn } from "../../lib/utils.js";
import { formatCurrency } from "../../lib/format.js";
import { useMenuInteraction } from "../../context/MenuInteractionContext.jsx";

export default function MenuNode({
  node,
  nodeId,
  level,
  collapsible = true,
  hideHeader = false,
  showGhost = false,
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

  function quickAdd(event, itemId) {
    event.stopPropagation();
    updateQuantity(itemId, 1);
  }

  const ghostNum = showGhost ? nodeId.split("-").pop()?.padStart(2, "0") : null;

  return (
    <div className={cn(
      "border-b border-stone-100 last:border-b-0",
      level === 2 && "bg-stone-50",
      hideHeader && "border-b-0 bg-transparent",
      !isOpen && !hideHeader && "",
    )}>
      {hideHeader ? null : collapsible ? (
        <button
          type="button"
          onClick={toggleNode}
          aria-expanded={isOpen}
          className={cn(
            "relative flex items-center w-full text-left cursor-pointer border-none bg-transparent overflow-hidden transition-all duration-150 active:scale-[0.99]",
            level === 1 ? "px-5 py-6 gap-3" : "px-7 py-4 gap-2",
          )}
        >
          {ghostNum ? (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[88px] font-serif font-semibold text-stone-100 select-none pointer-events-none leading-none">
              {ghostNum}
            </span>
          ) : null}
          <span className={cn(
            "font-serif uppercase relative flex-1 transition-colors",
            level === 1 ? "text-xl tracking-wider text-stone-800" : "text-sm tracking-widest text-stone-500",
          )}>
            {node.name}
          </span>
          <svg
            className={cn(
              "w-4 h-4 flex-shrink-0 text-stone-400 transition-transform duration-300",
              isOpen && "rotate-180 text-amber-600",
            )}
            viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <div className={cn(
          "flex items-center w-full",
          level === 1 ? "px-5 py-6 gap-3" : "px-7 py-4 gap-2",
        )}>
          {ghostNum ? (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[88px] font-serif font-semibold text-stone-100 select-none pointer-events-none leading-none">
              {ghostNum}
            </span>
          ) : null}
          <span className={cn(
            "font-serif uppercase relative flex-1",
            level === 1 ? "text-xl tracking-wider text-stone-800" : "text-sm tracking-widest text-stone-500",
          )}>
            {node.name}
          </span>
        </div>
      )}

      <div className={cn(
        "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-380 ease-out",
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
            <ul className="flex flex-col gap-2.5 list-none px-4 py-3 pb-5" role="list">
              {node.items.map((item, index) => {
                const itemId = String(item.id);
                const qty = Number(quantities[itemId] || 0);
                const isSelected = qty > 0;
                const isItemOpen = openItems.has(itemId);
                const hue = (item.id * 73 + 12) % 360;

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-xl overflow-hidden border transition-colors duration-200",
                      "opacity-0 translate-y-2 animate-[cardIn_340ms_ease-out_both]",
                      isSelected ? "border-amber-200" : "border-stone-200",
                      isItemOpen && "",
                    )}
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(itemId)}
                      aria-expanded={isItemOpen}
                      className="block w-full text-left cursor-pointer border-none bg-transparent p-0"
                    >
                      <div className={cn(
                        "relative overflow-hidden transition-all duration-420",
                        isItemOpen ? "h-[200px]" : "h-[120px]",
                      )}>
                        <div
                          className={cn(
                            "absolute inset-[-8%] bg-cover bg-center transition-transform duration-500",
                            isItemOpen && "scale-105",
                          )}
                          style={{
                            backgroundImage: item.imageUrl ? `url("${item.imageUrl}")` : "none",
                            backgroundColor: `hsl(${hue}, 18%, 26%)`,
                            backgroundPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%`,
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/80" />

                        <div className="absolute top-2.5 left-3 right-3 z-10 flex items-center justify-between">
                          <span className="text-[11px] tracking-widest uppercase text-white/70">
                            {(item.categoryPath || item.category || "").split(" > ").slice(-1)[0]}
                          </span>
                          <span className="text-xs font-medium tracking-wider text-amber-400 font-mono">
                            {formatCurrency(item.price)}
                          </span>
                        </div>

                        <h3 className="absolute bottom-3 left-3 right-3 z-10 font-serif italic text-xl font-normal leading-tight text-white text-left">
                          {item.name}
                        </h3>

                        {isSelected && !isItemOpen ? (
                          <span className="absolute top-2 right-2 z-10 grid place-items-center min-w-[24px] h-6 px-1.5 rounded-full bg-amber-600 text-white text-xs font-medium font-mono leading-none pointer-events-none animate-[badgePop_220ms_ease-out_both]">
                            {qty}
                          </span>
                        ) : null}

                        {!isItemOpen ? (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={`Quick add ${item.name}`}
                            onClick={(e) => quickAdd(e, itemId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                quickAdd(e, itemId);
                              }
                            }}
                              className={cn(
                                "absolute bottom-2 right-2 z-10 grid place-items-center",
                                "w-11 h-11 rounded-full bg-amber-600 text-white cursor-pointer",
                              "transition-all duration-150 active:scale-[0.92]",
                                "md:opacity-0 md:scale-90 md:transition-[opacity,transform] md:duration-180",
                              "md:[.item-card:hover_&]:opacity-100 md:[.item-card:hover_&]:scale-100",
                            )}
                          >
                            <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4 pointer-events-none">
                              <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </span>
                        ) : null}
                      </div>
                    </button>

                    <div className={cn(
                      "grid grid-rows-[0fr] transition-[grid-template-rows] duration-380 ease-out",
                      isItemOpen && "grid-rows-[1fr]",
                    )}>
                      <div className="overflow-hidden bg-stone-50 border-t border-stone-100">
                        {item.description ? (
                          <p className="font-serif italic text-sm text-stone-500 leading-relaxed px-3.5 pt-3.5">
                            {item.description}
                          </p>
                        ) : null}

                        <div className="flex items-center justify-between px-3.5 py-3.5 pb-4">
                          <div className="flex items-center gap-4" role="group" aria-label={`Quantity for ${item.name}`}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, -1)}
                              aria-label={`Remove ${item.name}`}
                              className="flex items-center justify-center w-11 h-11 rounded-full border border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150 active:scale-[0.92] cursor-pointer"
                            >
                              <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                                <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                              </svg>
                            </button>
                            <output className="text-lg font-medium text-stone-800 min-w-8 text-center font-mono" aria-live="polite">
                              {qty}
                            </output>
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, 1)}
                              disabled={qty >= 20}
                              aria-label={`Add ${item.name}`}
                              className="flex items-center justify-center w-11 h-11 rounded-full border border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150 active:scale-[0.92] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                                <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                                <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                          {qty >= 10 ? (
                            <span className="text-xs text-stone-400 tracking-wider">Max 20 per item</span>
                          ) : null}
                          {isSelected ? (
                            <span className={cn(
                              "flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-600",
                              "opacity-0 transition-opacity duration-260",
                              isSelected && "opacity-100",
                            )}>
                              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                                <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              In order
                            </span>
                          ) : null}
                        </div>
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
