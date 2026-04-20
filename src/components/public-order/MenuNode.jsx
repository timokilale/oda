import { formatCurrency } from "../../lib/format.js";

export default function MenuNode({
  node,
  nodeId,
  level,
  collapsible = true,
  showGhost = false,
  searchTerm,
  openNodes,
  setOpenNodes,
  openItems,
  setOpenItems,
  quantities,
  setQuantities,
}) {
  const isOpen = collapsible ? (searchTerm ? true : openNodes.has(nodeId)) : true;

  function toggleNode() {
    if (!collapsible) {
      return;
    }

    setOpenNodes((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  function toggleItem(itemId) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function updateQuantity(itemId, delta) {
    setQuantities((current) => {
      const nextValue = Math.max(0, Math.min(20, Number(current[itemId] || 0) + delta));
      return { ...current, [itemId]: nextValue };
    });
  }

  function quickAdd(event, itemId) {
    event.stopPropagation();
    updateQuantity(itemId, 1);
  }

  return (
    <div className={`menu-node menu-node--lv${level}${isOpen ? " is-open" : ""}${collapsible ? "" : " is-static"}`} data-menu-node>
      {collapsible ? (
        <button
          type="button"
          className="node-toggle"
          aria-expanded={isOpen ? "true" : "false"}
          onClick={toggleNode}
        >
          {showGhost ? (
            <span className="node-ghost" aria-hidden="true">
              {nodeId.split("-").pop()?.padStart(2, "0")}
            </span>
          ) : null}
          <span className="node-name">{node.name}</span>
          <svg className="node-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <div className="node-toggle node-toggle--static">
          {showGhost ? (
            <span className="node-ghost" aria-hidden="true">
              {nodeId.split("-").pop()?.padStart(2, "0")}
            </span>
          ) : null}
          <span className="node-name">{node.name}</span>
        </div>
      )}

      <div className="node-body">
        {(node.children || []).map((child, index) => (
          <MenuNode
            key={`${nodeId}-${index + 1}`}
            node={child}
            nodeId={`${nodeId}-${index + 1}`}
            level={level + 1}
            collapsible
            searchTerm={searchTerm}
            openNodes={openNodes}
            setOpenNodes={setOpenNodes}
            openItems={openItems}
            setOpenItems={setOpenItems}
            quantities={quantities}
            setQuantities={setQuantities}
          />
        ))}

        {node.items?.length ? (
          <ul className="item-list" role="list">
            {node.items.map((item, index) => {
              const itemId = String(item.id);
              const qty = Number(quantities[itemId] || 0);
              const isSelected = qty > 0;
              const isItemOpen = openItems.has(itemId);

              return (
                <li
                  key={item.id}
                  className={`item-card is-visible${isItemOpen ? " is-open" : ""}${isSelected ? " is-selected" : ""}`}
                  style={{
                    "--item-idx": index,
                    "--item-hue": (item.id * 73 + 12) % 360,
                    "--item-img": item.imageUrl ? `url("${item.imageUrl}")` : "none",
                    "--item-pos-x": `${item.imagePositionX ?? 50}%`,
                    "--item-pos-y": `${item.imagePositionY ?? 50}%`,
                  }}
                >
                  <button
                    type="button"
                    className="item-card__tap"
                    aria-expanded={isItemOpen ? "true" : "false"}
                    onClick={() => toggleItem(itemId)}
                  >
                    <div className="item-card__visual">
                      <div className="item-card__bg"></div>
                      <div className="item-card__overlay"></div>
                      <div className="item-card__top-row">
                        <span className="item-card__cat">
                          {(item.categoryPath || item.category || "").split(" > ").slice(-1)[0]}
                        </span>
                        <span className="item-card__price mono">
                          <span>{formatCurrency(item.price)}</span>
                        </span>
                      </div>
                      <h3 className="item-card__title">{item.name}</h3>

                      {/* CUS-U02: Quantity badge on collapsed cards */}
                      {isSelected && !isItemOpen ? (
                        <span className="item-card__qty-badge" aria-label={`${qty} in order`}>
                          {qty}
                        </span>
                      ) : null}
                    </div>

                    {/* CUS-U01: Quick-add button on collapsed cards */}
                    {!isItemOpen ? (
                      <span
                        className="item-card__quick-add"
                        role="button"
                        tabIndex={0}
                        aria-label={`Quick add ${item.name}`}
                        onClick={(event) => quickAdd(event, itemId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            quickAdd(event, itemId);
                          }
                        }}
                      >
                        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    ) : null}
                  </button>

                  <div className="item-card__expand-wrap">
                    <div className="item-card__expand">
                      {item.description ? (
                        <p className="item-card__desc">{item.description}</p>
                      ) : null}
                      <div className="item-card__controls">
                        <div className="qty-row" role="group" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQuantity(itemId, -1)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <svg viewBox="0 0 14 14" fill="none">
                              <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                            </svg>
                          </button>
                          <output className="qty-val mono" aria-live="polite">
                            {qty}
                          </output>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQuantity(itemId, 1)}
                            disabled={qty >= 20}
                            aria-label={`Add ${item.name}`}
                          >
                            <svg viewBox="0 0 14 14" fill="none">
                              <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                              <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        {qty >= 10 ? (
                          <span className="item-card__qty-warning">Max 20 per item</span>
                        ) : null}
                        <span className="item-badge" hidden={!isSelected}>
                          <svg viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          In order
                        </span>
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
  );
}
