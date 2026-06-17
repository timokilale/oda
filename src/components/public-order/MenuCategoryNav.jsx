import { cn } from "../../lib/utils.js";

export default function MenuCategoryNav({ roots, selectedIndex, onSelectCategory, containerRef, topOffset = 56 }) {
  if (!roots.length) return null;

  function handleKeyDown(event, currentPosition) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextPosition = (currentPosition + direction + roots.length) % roots.length;
    onSelectCategory(roots[nextPosition].index);
  }

  return (
    <nav
      ref={containerRef}
      style={{ top: topOffset }}
      className="sticky z-40 bg-background/85 backdrop-blur-md"
      aria-label="Menu sections"
    >
      <div
        className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2.5 max-w-4xl mx-auto"
        role="tablist"
        aria-label="Menu categories"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedIndex == null}
          onClick={() => selectedIndex != null && onSelectCategory(selectedIndex)}
          className={cn(
            "flex-shrink-0 px-3.5 py-2 min-h-9 rounded-full text-[13px] font-medium whitespace-nowrap",
            "transition-colors duration-150 active:scale-[0.97] cursor-pointer",
            selectedIndex == null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          All
        </button>
        {roots.map(({ node, index }, position) => {
          const isActive = selectedIndex === index;

          return (
            <button
              key={node.name}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive || (selectedIndex == null && position === 0) ? 0 : -1}
              onClick={() => onSelectCategory(index)}
              onKeyDown={(e) => handleKeyDown(e, position)}
              className={cn(
                "flex-shrink-0 px-3.5 py-2 min-h-9 rounded-full text-[13px] font-medium whitespace-nowrap",
                "transition-colors duration-150 active:scale-[0.97] cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {node.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
