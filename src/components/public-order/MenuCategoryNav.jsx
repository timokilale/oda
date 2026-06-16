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
      className="sticky z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200"
      aria-label="Menu sections"
    >
      <div
        className="flex gap-0 overflow-x-auto scrollbar-none px-4"
        role="tablist"
        aria-label="Menu categories"
      >
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
                "flex-shrink-0 px-4 py-3 min-h-11 text-xs font-medium tracking-wider uppercase whitespace-nowrap",
                "border-b-2 border-transparent transition-all duration-200",
                "hover:text-stone-700 active:scale-[0.97] cursor-pointer",
                isActive
                  ? "border-amber-700 text-amber-700"
                  : "text-stone-400",
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
