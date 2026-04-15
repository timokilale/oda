export default function MenuCategoryNav({ roots, activeSectionId, onJumpToSection, containerRef }) {
  if (!roots.length) {
    return null;
  }

  return (
    <nav className="cat-strip" aria-label="Menu sections" ref={containerRef}>
      <div className="cat-strip__inner">
        {roots.map(({ node, index }) => {
          const sectionId = `cat-${index + 1}`;

          return (
            <button
              key={node.name}
              type="button"
              className={`cat-btn${activeSectionId === sectionId ? " is-active" : ""}`}
              onClick={() => onJumpToSection(index)}
            >
              {node.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
