import { useCallback, useEffect, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiMenuItemToView, transformViewItemToApiPayload } from "../types/managementTypes.js";
import * as menuService from "../services/menuService.js";

export default function useMenu() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [items, setItems] = useState([]);

  const loadMenu = useCallback(async () => {
    try {
      const data = await menuService.getMenuItems(restaurant.id);
      setItems((data.items || []).map(transformApiMenuItemToView));
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleDeleteItem = useCallback(
    async (itemId) => {
      clearFlash();
      try {
        await menuService.deleteMenuItem(restaurant.id, itemId);
        setFlash({ type: "success", message: "Item deleted." });
        await Promise.all([loadMenu(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadMenu, refreshWorkspace, setFlash, clearFlash]
  );

  const handleAddItem = useCallback(
    async (itemData) => {
      clearFlash();
      try {
        await menuService.createMenuItem(restaurant.id, transformViewItemToApiPayload(itemData));
        setFlash({ type: "success", message: "Item added." });
        await Promise.all([loadMenu(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadMenu, refreshWorkspace, setFlash, clearFlash]
  );

  const setMenuItems = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(items) : updater;
      setItems(next);
      clearFlash();
      const changed = next.find((n) => {
        const old = items.find((o) => o.id === n.id);
        return (
          old &&
          (old.status !== n.status || old.name !== n.name || old.price !== n.price)
        );
      });
      if (changed) {
        menuService
          .updateMenuItem(restaurant.id, changed.id, transformViewItemToApiPayload(changed))
          .then(() => Promise.all([loadMenu(), refreshWorkspace()]))
          .catch((error) => {
            setFlash({ type: "error", message: error.message });
            loadMenu();
          });
      }
    },
    [items, restaurant.id, loadMenu, refreshWorkspace, setFlash, clearFlash]
  );

  return {
    items,
    setMenuItems,
    addItem: handleAddItem,
    deleteItem: handleDeleteItem,
  };
}
