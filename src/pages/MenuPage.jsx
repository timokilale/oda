import { useCallback, useEffect, useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import MenuView from "../components/management/MenuView.jsx";
import { transformApiMenuItemToView, transformViewItemToApiPayload } from "../types/managementTypes.js";

export default function MenuPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [items, setItems] = useState([]);

  usePageTitle(`Menu - ${restaurant.name}`);

  const loadMenu = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/menu-items`);
      setItems((data.items || []).map(transformApiMenuItemToView));
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  async function handleDeleteItem(itemId) {
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items/${itemId}`, { method: "DELETE" });
      setFlash({ type: "success", message: "Item deleted." });
      await Promise.all([loadMenu(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleAddItem(itemData) {
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items`, {
        method: "POST",
        body: transformViewItemToApiPayload(itemData),
      });
      setFlash({ type: "success", message: "Item added." });
      await Promise.all([loadMenu(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function setMenuItems(updater) {
    const next = typeof updater === 'function' ? updater(items) : updater;
    setItems(next);
    clearFlash();
    try {
      const changed = next.find((n) => {
        const old = items.find((o) => o.id === n.id);
        return old && (old.status !== n.status || old.name !== n.name || old.price !== n.price);
      });
      if (changed) {
        await apiRequest(`/restaurants/${restaurant.id}/menu-items/${changed.id}`, {
          method: "PATCH",
          body: transformViewItemToApiPayload(changed),
        });
        await Promise.all([loadMenu(), refreshWorkspace()]);
      }
    } catch (error) {
      setFlash({ type: "error", message: error.message });
      loadMenu();
    }
  }

  return (
    <>
      <MenuView
        menuItems={items}
        setMenuItems={setMenuItems}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        restaurantId={restaurant.id}
      />
    </>
  );
}
