import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">Menu</h1>
        </div>
        <Link
          to={`/restaurants/${restaurant.id}/menu/new`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline shrink-0 mt-6"
        >
          Add items (bulk)
        </Link>
      </section>

      <MenuView
        menuItems={items}
        setMenuItems={setMenuItems}
        onAddItem={handleAddItem}
        restaurantId={restaurant.id}
      />
    </>
  );
}
