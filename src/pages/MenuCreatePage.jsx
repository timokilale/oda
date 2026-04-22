import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImagePositionField from "../components/ImagePositionField.jsx";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { createCroppedUpload, MENU_IMAGE_TARGET } from "../lib/cropImage.js";
import { useRestaurantWorkspace } from "./RestaurantLayout.jsx";

function buildDraft(defaultCategory = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    price: "",
    category: defaultCategory,
    description: "",
    image: null,
    imagePositionX: 50,
    imagePositionY: 50,
    active: true,
  };
}

export default function MenuCreatePage() {
  const { restaurant } = useRestaurantWorkspace();
  const navigate = useNavigate();
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [drafts, setDrafts] = useState([buildDraft()]);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(null);

  usePageTitle(`Add menu items - ${restaurant.name}`);

  useEffect(() => {
    let active = true;

    async function loadCategorySuggestions() {
      try {
        const data = await apiRequest(`/restaurants/${restaurant.id}/menu-items`);
        if (!active) {
          return;
        }

        setCategorySuggestions(data.categorySuggestions || []);
        setDrafts((current) =>
          current.map((draft, index) =>
            index === 0 && !draft.category && data.categorySuggestions?.length
              ? { ...draft, category: data.categorySuggestions[0] }
              : draft,
          ),
        );
      } catch (error) {
        if (active) {
          setFlash({ type: "error", message: error.message });
        }
      }
    }

    loadCategorySuggestions();

    return () => {
      active = false;
    };
  }, [restaurant.id]);

  const itemCountLabel = useMemo(
    () => `${drafts.length} item${drafts.length === 1 ? "" : "s"}`,
    [drafts.length],
  );

  function updateDraft(draftId, updater) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, ...updater(draft) } : draft)),
    );
  }

  function addDraft() {
    setDrafts((current) => [
      ...current,
      buildDraft(current[current.length - 1]?.category || categorySuggestions[0] || ""),
    ]);
  }

  function removeDraft(draftId) {
    setDrafts((current) => (current.length > 1 ? current.filter((draft) => draft.id !== draftId) : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFlash(null);

    try {
      for (const [index, draft] of drafts.entries()) {
        const formData = new FormData();
        formData.set("name", draft.name);
        formData.set("price", draft.price);
        formData.set("category", draft.category);
        formData.set("description", draft.description);
        formData.set("active", String(draft.active));
        formData.set("removeImage", "false");
        formData.set("imagePositionX", String(draft.imagePositionX));
        formData.set("imagePositionY", String(draft.imagePositionY));

        if (draft.image) {
          const croppedImage = await createCroppedUpload(draft.image, {
            ...MENU_IMAGE_TARGET,
            positionX: draft.imagePositionX,
            positionY: draft.imagePositionY,
          });
          formData.set("image", croppedImage);
        }

        try {
          await apiRequest(`/restaurants/${restaurant.id}/menu-items`, {
            method: "POST",
            formData,
          });
        } catch (error) {
          throw new Error(`Item ${index + 1}: ${error.message}`);
        }
      }

      navigate(`/restaurants/${restaurant.id}/menu`, {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: `Added ${drafts.length} menu item${drafts.length === 1 ? "" : "s"}.`,
          },
        },
      });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
      setSubmitting(false);
    }
  }

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
          <h1 className="page-title">Add menu items</h1>
          <p className="page-subtitle">
            Build multiple dishes in one pass, keep categories consistent, and return to a clean catalog view when you are done.
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/restaurants/${restaurant.id}/menu`} className="button button-secondary">
            Back to menu
          </Link>
        </div>
      </section>

      <section className="workflow-grid page-section">
        <div className="workflow-step">
          <span className="workflow-step__index">1</span>
          <div>
            <h2 className="panel-title">Build the batch</h2>
            <p className="field-help">Add as many dishes as you want before publishing.</p>
          </div>
        </div>
        <div className="workflow-step">
          <span className="workflow-step__index">2</span>
          <div>
            <h2 className="panel-title">Tune presentation</h2>
            <p className="field-help">Set categories, descriptions, and optional imagery for each dish.</p>
          </div>
        </div>
        <div className="workflow-step">
          <span className="workflow-step__index">3</span>
          <div>
            <h2 className="panel-title">Publish together</h2>
            <p className="field-help">Create the whole batch at once instead of one item at a time.</p>
          </div>
        </div>
      </section>

      <form className="page-section draft-stack" onSubmit={handleSubmit}>
        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Batch details</h2>
              <p className="field-help">{itemCountLabel} ready for this publish pass.</p>
            </div>
            <div className="page-actions">
              <button type="button" className="button" onClick={addDraft} disabled={submitting}>
                Add another item
              </button>
            </div>
          </div>
        </section>

        {drafts.map((draft, index) => (
          <section key={draft.id} className="surface panel draft-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Item {index + 1}</p>
                <h2 className="panel-title">Menu item setup</h2>
              </div>
              <div className="page-actions">
                {drafts.length > 1 ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => removeDraft(draft.id)}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <div className="form-grid form-grid--two-up">
              <div className="field-group">
                <label className="field-label" htmlFor={`menu_item_name_${draft.id}`}>
                  Name
                </label>
                <input
                  className="field-control"
                  id={`menu_item_name_${draft.id}`}
                  type="text"
                  value={draft.name}
                  onChange={(event) => updateDraft(draft.id, () => ({ name: event.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor={`menu_item_price_${draft.id}`}>
                  Price
                </label>
                <input
                  className="field-control"
                  id={`menu_item_price_${draft.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={(event) => updateDraft(draft.id, () => ({ price: event.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor={`menu_item_category_${draft.id}`}>
                  Category
                </label>
                <input
                  className="field-control"
                  id={`menu_item_category_${draft.id}`}
                  list="menu-category-suggestions-batch"
                  placeholder="e.g. Drinks or Drinks > Hot Drinks"
                  value={draft.category}
                  onChange={(event) => updateDraft(draft.id, () => ({ category: event.target.value }))}
                  required
                />
                <p className="field-help">Use " &gt; " to create sub-categories visible to customers.</p>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor={`menu_item_status_${draft.id}`}>
                  Availability
                </label>
                <select
                  className="field-control"
                  id={`menu_item_status_${draft.id}`}
                  value={String(draft.active)}
                  onChange={(event) =>
                    updateDraft(draft.id, () => ({ active: event.target.value === "true" }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Archived</option>
                </select>
              </div>
            </div>

            <ImagePositionField
              inputId={`menu_item_image_${draft.id}`}
              label="Image"
              file={draft.image}
              previewUrl=""
              positionX={draft.imagePositionX}
              positionY={draft.imagePositionY}
              aspectRatio={MENU_IMAGE_TARGET.aspectRatio}
              disabled={submitting}
              onFileChange={(file) =>
                updateDraft(draft.id, (current) => ({
                  image: file,
                  imagePositionX: file ? 50 : current.imagePositionX,
                  imagePositionY: file ? 50 : current.imagePositionY,
                }))
              }
              onPositionChange={({ x, y }) =>
                updateDraft(draft.id, () => ({
                  imagePositionX: x,
                  imagePositionY: y,
                }))
              }
            />

            <div className="field-group">
              <label className="field-label" htmlFor={`menu_item_description_${draft.id}`}>
                Description
              </label>
              <textarea
                className="field-control"
                id={`menu_item_description_${draft.id}`}
                value={draft.description}
                onChange={(event) =>
                  updateDraft(draft.id, () => ({ description: event.target.value }))
                }
              />
            </div>
          </section>
        ))}

        <datalist id="menu-category-suggestions-batch">
          {categorySuggestions.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Ready to publish</h2>
              <p className="field-help">
                This will create {itemCountLabel} and return you to the catalog.
              </p>
            </div>
            <div className="page-actions">
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting ? "Saving items" : `Create ${itemCountLabel}`}
              </button>
            </div>
          </div>
        </section>
      </form>
    </WorkspaceShell>
  );
}
