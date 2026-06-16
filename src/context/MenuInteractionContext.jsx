import { createContext, useContext, useMemo, useState } from "react";

const MenuInteractionContext = createContext(null);

export function MenuInteractionProvider({ children }) {
  const [openNodes, setOpenNodes] = useState(new Set());
  const [openItems, setOpenItems] = useState(new Set());
  const [quantities, setQuantities] = useState({});

  const value = useMemo(
    () => ({ openNodes, setOpenNodes, openItems, setOpenItems, quantities, setQuantities }),
    [openNodes, openItems, quantities],
  );
  return <MenuInteractionContext.Provider value={value}>{children}</MenuInteractionContext.Provider>;
}

export function useMenuInteraction() {
  const context = useContext(MenuInteractionContext);
  if (!context) {
    throw new Error("useMenuInteraction must be used within MenuInteractionProvider");
  }
  return context;
}
