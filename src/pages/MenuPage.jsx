import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ImagePositionField from "../components/ImagePositionField.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import SegmentedControl from "../components/SegmentedControl.jsx";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { createCroppedUpload, MENU_IMAGE_TARGET } from "../lib/cropImage.js";
import { formatCurrency } from "../lib/format.js";
import { useRestaurantWorkspace } from "./RestaurantLayout.jsx";

function buildEmptyForm(defaultCategory = "") {
  return {
    name: "",
    price: "",
    category: defaultCategory,
    description: "",
    image: null,
    previewUrl: "",
    removeImage: false,
    imagePositionX: 50,
    imagePositionY: 50,
    active: true,
  };
}

function buildFormFromItem(item) {
  return {
    name: item.name || "",
    price: String(item.price ?? ""),
    category: item.category || "",
    description: item.description || "",
    image: null,
    previewUrl: item.imageUrl || "",
    removeImage: false,
    imagePositionX: item.imagePositionX ?? 50,
    imagePositionY: item.imagePositionY ?? 50,
    active: Boolean(item.active),
  };
}

export default function MenuPage() {
  const { restaurant, workspaceSummary, refreshWorkspace } = useRestaurantWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [form, setForm] = useState(buildEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [filter, setFilter] = useState("active");

  usePageTitle(`Menu - ${restaurant.name}`);

  const MENU_FILTER_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
    { value: "all", label: "All" },
  ];

  const editingItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );

  const visibleItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    if (filter === "archived") {
      return items.filter((item) => !item.active);
    }

    return items.filter((item) => item.active);
  }, [filter, items]);

  async function loadMenu() {
    setLoading(true);

    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/menu-items`);
      setItems(data.items);
      setCategorySuggestions(data.categorySuggestions);
      setForm((current) =>
        current.category || !data.categorySuggestions.length
          ? current
          : { ...current, category: data.categorySuggestions[0] },
      );
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, [restaurant.id]);

  useEffect(() => {
    if (!location.state?.flash) {
      return;
    }

    setFlash(location.state.flash);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  function resetForm(nextSuggestions = categorySuggestions) {
    setSelectedItemId(null);
    setForm(buildEmptyForm(nextSuggestions[0] || ""));
  }

  function startEditing(item) {
    setSelectedItemId(item.id);
    setForm(buildFormFromItem(item));
    setFlash(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!editingItem) {
      setFlash({ type: "error", message: "Choose an item from the catalog to edit." });
      return;
    }

    setSubmitting(true);
    setFlash(null);

    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("price", form.price);
    formData.set("category", form.category);
    formData.set("description", form.description);
    formData.set("active", String(form.active));
    formData.set("removeImage", String(form.removeImage));
    formData.set("imagePositionX", String(form.imagePositionX));
    formData.set("imagePositionY", String(form.imagePositionY));

    if (form.image) {
      const croppedImage = await createCroppedUpload(form.image, {
        ...MENU_IMAGE_TARGET,
        positionX: form.imagePositionX,
        positionY: form.imagePositionY,
      });
      formData.set("image", croppedImage);
    }

    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items/${editingItem.id}`, {
        method: "PATCH",
        formData,
      });
      setFlash({ type: "success", message: "Menu item updated." });
      resetForm();
      await Promise.all([loadMenu(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleItemAvailability(item, nextActive) {
    setFlash(null);

    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items/${item.id}`, {
        method: "PATCH",
        body: {
          name: item.name,
          price: String(item.price),
          category: item.category,
          description: item.description || "",
          active: nextActive,
          imagePositionX: item.imagePositionX,
          imagePositionY: item.imagePositionY,
        },
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

  const activeCount = items.filter((item) => item.active).length;
  const archivedCount = items.filter((item) => !item.active).length;

  return (
    <WorkspaceShell
      currentSection="menu"
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <section className="page-header page-header--split">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Menu</h1>
          <p className="page-subtitle">
            Keep the catalog clean by default, batch-create dishes in a dedicated flow, and edit only when you need to.
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/restaurants/${restaurant.id}/menu/new`} className="button button-confirm">
            Add items
          </Link>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Active items</p>
          <p className="metric-value">{activeCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Archived items</p>
          <p className="metric-value">{archivedCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Open orders</p>
          <p className="metric-value">{workspaceSummary.openOrderCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Tables</p>
          <p className="metric-value">{workspaceSummary.tableCount}</p>
        </div>
      </section>

      {editingItem ? (
        <section className="surface panel page-section">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Edit menu item</h2>
              <p className="field-help">
                Update details here. New items belong in the dedicated add-items flow.
              </p>
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => resetForm()}
              disabled={submitting}
            >
              Close editor
            </button>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-grid form-grid--two-up">
              <div className="field-group">
                <label className="field-label" htmlFor="menu_item_name">
                  Name
                </label>
                <input
                  className="field-control"
                  id="menu_item_name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="menu_item_price">
                  Price
                </label>
                <input
                  className="field-control"
                  id="menu_item_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="menu_item_category">
                  Category
                </label>
                <input
                  className="field-control"
                  id="menu_item_category"
                  list="menu-category-suggestions"
                  placeholder="e.g. Drinks or Drinks > Hot Drinks"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  required
                />
                <p className="field-help">Use " &gt; " to create sub-categories visible to customers.</p>
                <datalist id="menu-category-suggestions">
                  {categorySuggestions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="menu_item_status">
                  Availability
                </label>
                <select
                  className="field-control"
                  id="menu_item_status"
                  value={String(form.active)}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, active: event.target.value === "true" }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Archived</option>
                </select>
              </div>
            </div>

            <ImagePositionField
              inputId="menu_item_image"
              label="Image"
              file={form.image}
              previewUrl={form.image ? "" : form.removeImage ? "" : form.previewUrl}
              positionX={form.imagePositionX}
              positionY={form.imagePositionY}
              aspectRatio={MENU_IMAGE_TARGET.aspectRatio}
              disabled={submitting}
              onFileChange={(file) =>
                setForm((current) => ({
                  ...current,
                  image: file,
                  removeImage: false,
                  imagePositionX: file ? 50 : current.imagePositionX,
                  imagePositionY: file ? 50 : current.imagePositionY,
                }))
              }
              onPositionChange={({ x, y }) =>
                setForm((current) => ({
                  ...current,
                  imagePositionX: x,
                  imagePositionY: y,
                }))
              }
            />

            {(form.previewUrl || form.image) ? (
              <div className="action-row">
                <button
                  type="button"
                  className={`button${form.removeImage ? " button-danger" : ""}`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      removeImage: !current.removeImage,
                      image: null,
                    }))
                  }
                  disabled={submitting}
                >
                  {form.removeImage ? "Keep image" : "Remove image"}
                </button>
                {form.removeImage ? (
                  <span className="muted-text">The current image will be removed when you save.</span>
                ) : null}
              </div>
            ) : null}

            <div className="field-group">
              <label className="field-label" htmlFor="menu_item_description">
                Description
              </label>
              <textarea
                className="field-control"
                id="menu_item_description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="action-row">
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting ? "Saving" : "Save item"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => resetForm()}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface panel page-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Catalog</h2>
            <p className="field-help">
              Active dishes are visible to customers. Archived dishes stay searchable here.
            </p>
          </div>
          <div className="page-actions">
            <SegmentedControl
              label="Menu item filter"
              options={MENU_FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton variant="table-row" count={4} />
        ) : visibleItems.length ? (
          <table className="data-table responsive-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Description</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id} className={item.active ? "" : "row-muted"}>
                  <td data-label="Image">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="table-thumb"
                        style={{
                          objectPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%`,
                        }}
                      />
                    ) : (
                      <span className="table-thumb table-thumb--empty" aria-hidden="true"></span>
                    )}
                  </td>
                  <td data-label="Name">{item.name}</td>
                  <td data-label="Category">{item.category}</td>
                  <td data-label="Status">
                    <span className={`status-pill${item.active ? "" : " status-pill--muted"}`}>
                      {item.active ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td data-label="Description">{item.description || "No description yet."}</td>
                  <td data-label="Price" className="mono-total">
                    {formatCurrency(item.price)}
                  </td>
                  <td data-label="Action">
                    <div className="inline-actions">
                      <button type="button" className="button" onClick={() => startEditing(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`button${item.active ? "" : " button-confirm"}`}
                        onClick={() => toggleItemAvailability(item, !item.active)}
                      >
                        {item.active ? "Archive" : "Restore"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state panel">
            <h3 className="panel-title">
              {filter === "archived"
                ? "No archived items"
                : filter === "all"
                  ? "No menu items"
                  : "No active menu items"}
            </h3>
            <p className="empty-text">
              {filter === "archived"
                ? "Archived dishes will appear here so you can restore them when needed."
                : "Use Add items to build the menu in batches, then fine-tune any dish from this catalog."}
            </p>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
