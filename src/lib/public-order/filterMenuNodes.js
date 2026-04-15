export function filterMenuNodes(nodes, term) {
  if (!term) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const children = filterMenuNodes(node.children || [], term);
      const items = (node.items || []).filter((item) => {
        const haystack = [item.name, item.description, item.categoryPath]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(term);
      });

      if (!items.length && !children.length) {
        return null;
      }

      return {
        ...node,
        children,
        items,
      };
    })
    .filter(Boolean);
}
