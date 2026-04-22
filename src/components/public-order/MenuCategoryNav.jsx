export default function MenuCategoryNav({ roots, activeSectionId, onJumpToSection, containerRef }) {
  if (!roots.length) {
    return null;
  }

  function handleKeyDown(event, currentPosition) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextPosition = (currentPosition + direction + roots.length) % roots.length;
    onJumpToSection(roots[nextPosition].index);
  }

  return (
    <nav className="cat-strip" aria-label="Menu sections" ref={containerRef}>
      <div className="cat-strip__inner" role="tablist" aria-label="Menu categories">
        {roots.map(({ node, index }, position) => {
          const sectionId = `cat-${index + 1}`;
          const tabId = `tab-${sectionId}`;

          return (
            <button
              key={node.name}
              type="button"
              className={`cat-btn${activeSectionId === sectionId ? " is-active" : ""}`}
              id={tabId}
              role="tab"
              aria-selected={activeSectionId === sectionId ? "true" : "false"}
              aria-controls={sectionId}
              tabIndex={activeSectionId === sectionId ? 0 : -1}
              onClick={() => onJumpToSection(index)}
              onKeyDown={(event) => handleKeyDown(event, position)}
            >
              {node.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
