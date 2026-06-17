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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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

  async function handleBulkImport() {
    clearFlash();
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!lines.length) {
      setFlash({ type: "error", message: "Paste at least one item." });
      return;
    }

    setBulkSubmitting(true);
    let created = 0;
    let errors = [];

    for (const [index, line] of lines.entries()) {
      const parts = line.split(/[-–—]/).map((p) => p.trim());
      const name = parts[0];
      const price = parts.length > 1 ? parts[1].replace(/[^\d.]/g, "") : "";
      const category = bulkCategory || categorySuggestions[0] || "Uncategorized";

      if (!name || !price) {
        errors.push(`Line ${index + 1}: missing name or price`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("price", price);
        formData.set("category", category);
        formData.set("description", "");
        formData.set("active", "true");
        formData.set("removeImage", "false");
        formData.set("imagePositionX", "50");
        formData.set("imagePositionY", "50");

        await apiRequest(`/restaurants/${restaurant.id}/menu-items`, {
          method: "POST",
          formData,
        });
        created++;
      } catch (error) {
        errors.push(`Line ${index + 1}: ${error.message}`);
      }
    }

    setBulkSubmitting(false);

    if (created) {
      setBulkText("");
      setBulkOpen(false);
      await Promise.all([loadMenu(), refreshWorkspace()]);
    }

    const parts = [];
    if (created) parts.push(`Created ${created} item${created !== 1 ? "s" : ""}`);
    if (errors.length) parts.push(`${errors.length} error${errors.length !== 1 ? "s" : ""}: ${errors[0]}`);
    setFlash({ type: created ? "success" : "error", message: parts.join(". ") || "No items created." });
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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
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

      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs text-muted-foreground">
          {activeCount} active item{activeCount !== 1 ? "s" : ""}{archivedCount ? ` · ${archivedCount} archived` : ""}
        </p>
        <span className="text-muted-foreground/30">·</span>
        <button
          type="button"
          onClick={() => setBulkOpen((prev) => !prev)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {bulkOpen ? "Cancel bulk add" : "Paste bulk items"}
        </button>
      </div>

      {bulkOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 mb-6 grid gap-3">
          <h3 className="text-sm font-semibold text-foreground">Bulk add items</h3>
          <p className="text-xs text-muted-foreground">
            Paste one item per line as <strong>Name - Price</strong>. Items without a price are skipped.
          </p>
          <textarea
            className="h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors resize-y font-mono"
            placeholder={"Ugali - 500\nNyama Choma - 1500\nChipsi Mayai - 3000"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            disabled={bulkSubmitting}
          />
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              disabled={bulkSubmitting}
            >
              <option value="">Default category</option>
              {(categorySuggestions.length ? categorySuggestions : ["Uncategorized"]).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkSubmitting || !bulkText.trim()}
              className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {bulkSubmitting ? "Creating items..." : `Create ${bulkText.trim() ? bulkText.trim().split("\n").filter(Boolean).length : 0} items`}
            </button>
          </div>
        </div>
      ) : null}

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
