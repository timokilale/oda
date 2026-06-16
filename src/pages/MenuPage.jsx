import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import MenuItemEditor from "../components/menu/MenuItemEditor.jsx";
import MenuCatalogTable from "../components/menu/MenuCatalogTable.jsx";

export default function MenuPage() {
  const {
    restaurant,
    workspaceSummary,
    refreshWorkspace,
    setFlash,
    clearFlash,
    scrollActiveViewToTop,
  } = useRestaurantWorkspace();
  const [items, setItems] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [filter, setFilter] = useState("active");

  usePageTitle(`Menu - ${restaurant.name}`);

  const editingItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "archived") return items.filter((item) => !item.active);
    return items.filter((item) => item.active);
  }, [filter, items]);

  const activeCount = items.filter((item) => item.active).length;
  const archivedCount = items.filter((item) => !item.active).length;

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/menu-items`);
      setItems(data.items);
      setCategorySuggestions(data.categorySuggestions);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  function startEditing(item) {
    setSelectedItemId(item.id);
    clearFlash();
    scrollActiveViewToTop();
  }

  function cancelEditing() {
    setSelectedItemId(null);
  }

  async function handleSave(itemId, formData) {
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items/${itemId}`, {
        method: "PATCH",
        formData,
      });
      setFlash({ type: "success", message: "Menu item updated." });
      cancelEditing();
      await Promise.all([loadMenu(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
      throw error;
    }
  }

  async function toggleItemAvailability(item, nextActive) {
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items/${item.id}`, {
        method: "PATCH",
        body: { active: nextActive },
      });
      setFlash({
        type: "success",
        message: nextActive ? "Menu item restored to the active menu." : "Menu item archived.",
      });
      await Promise.all([loadMenu(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Restaurant</p>
          <h1 className="text-[clamp(2.15rem,4vw,3.5rem)] font-display italic font-normal leading-none text-foreground mt-1">
            Menu
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Keep the catalog clean by default, batch-create dishes in a dedicated flow, and edit only when you need to.
          </p>
        </div>
        <Link
          to={`/restaurants/${restaurant.id}/menu/new`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline shrink-0 mt-6"
        >
          Add items
        </Link>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Active items</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Archived items</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{archivedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Open orders</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{workspaceSummary.openOrderCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Tables</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{workspaceSummary.tableCount}</p>
        </div>
      </section>

      {editingItem ? (
        <MenuItemEditor
          editingItem={editingItem}
          categorySuggestions={categorySuggestions}
          onSave={handleSave}
          onCancel={cancelEditing}
        />
      ) : null}

      <MenuCatalogTable
        items={items}
        visibleItems={visibleItems}
        filter={filter}
        onFilterChange={setFilter}
        loading={loading}
        onEdit={startEditing}
        onToggleAvailability={toggleItemAvailability}
      />
    </>
  );
}
