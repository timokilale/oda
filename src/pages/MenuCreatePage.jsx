import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceDialog from "../components/WorkspaceDialog.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

function buildDraft(defaultCategory = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    price: "",
    category: defaultCategory,
    description: "",
    image: null,
    active: true,
  };
}

function isDraftComplete(draft) {
  return Boolean(String(draft.name || "").trim() && String(draft.price || "").trim() && String(draft.category || "").trim());
}

export default function MenuCreatePage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const navigate = useNavigate();
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [drafts, setDrafts] = useState([buildDraft()]);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
          current.map((draft) =>
            !draft.category && data.categorySuggestions?.length
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
  }, [restaurant.id, setFlash]);

  const editingDraft = useMemo(
    () => drafts.find((draft) => draft.id === editingDraftId) || null,
    [drafts, editingDraftId],
  );

  const itemCountLabel = `${drafts.length} item${drafts.length === 1 ? "" : "s"}`;
  const completedCount = drafts.filter(isDraftComplete).length;

  function updateDraft(draftId, nextValues) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, ...nextValues } : draft)),
    );
  }

  function createDraft() {
    const nextDraft = buildDraft(categorySuggestions[0] || drafts[drafts.length - 1]?.category || "");
    setDrafts((current) => [...current, nextDraft]);
  }

  function resetComposer(nextSuggestions = categorySuggestions) {
    setDrafts([buildDraft(nextSuggestions[0] || "")]);
    setEditingDraftId(null);
    setSubmitting(false);
  }

  function removeDraft(draftId) {
    setDrafts((current) => (current.length > 1 ? current.filter((draft) => draft.id !== draftId) : current));
    setEditingDraftId((current) => (current === draftId ? null : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearFlash();

    const invalidIndex = drafts.findIndex((draft) => !isDraftComplete(draft));
    if (invalidIndex >= 0) {
      setFlash({
        type: "error",
        message: `Open item ${invalidIndex + 1} from the board and complete it before publishing.`,
      });
      return;
    }

    setSubmitting(true);

    try {
      for (const [index, draft] of drafts.entries()) {
        const formData = new FormData();
        formData.set("name", draft.name);
        formData.set("price", draft.price);
        formData.set("category", draft.category);
        formData.set("description", draft.description);
        formData.set("active", String(draft.active));
        formData.set("removeImage", "false");
        formData.set("imagePositionX", "50");
        formData.set("imagePositionY", "50");

        if (draft.image) {
          formData.set("image", draft.image);
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

      const createdCount = drafts.length;
      resetComposer();
      refreshWorkspace().catch(() => undefined);
      navigate(`/restaurants/${restaurant.id}/menu`, {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: `Added ${createdCount} menu item${createdCount === 1 ? "" : "s"}.`,
          },
        },
      });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="page-header page-header--split">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Add menu items</h1>
          <p className="page-subtitle">
            Build a batch with compact cards, then open a card only when you want to edit its details.
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/restaurants/${restaurant.id}/menu`} className="button button-secondary">
            Back to menu
          </Link>
        </div>
      </section>

      <form className="page-section draft-stack" onSubmit={handleSubmit}>
        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Draft board</h2>
              <p className="field-help">
                {completedCount} of {itemCountLabel} ready to publish.
              </p>
            </div>
            <div className="page-actions">
              <button type="button" className="button" onClick={createDraft} disabled={submitting}>
                Add item card
              </button>
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting ? "Saving items" : `Create ${itemCountLabel}`}
              </button>
            </div>
          </div>
        </section>

        <section className="draft-board" aria-label="Menu item drafts">
          {drafts.map((draft, index) => {
            const isComplete = isDraftComplete(draft);

            return (
              <button
                key={draft.id}
                type="button"
                className={`draft-tile${isComplete ? "" : " draft-tile--empty"}`}
                onClick={() => setEditingDraftId(draft.id)}
              >
                <span className="draft-tile__index">Item {index + 1}</span>
                {isComplete ? (
                  <>
                    <strong className="draft-tile__title">{draft.name}</strong>
                    <span className="draft-tile__meta">{draft.category}</span>
                    <span className="draft-tile__meta">
                      {draft.price ? `Ksh ${Number(draft.price || 0).toLocaleString()}` : "Price pending"}
                    </span>
                    <span className="draft-tile__footer">
                      {draft.image ? draft.image.name : "No image"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="draft-tile__plus" aria-hidden="true">+</span>
                    <strong className="draft-tile__title">Configure item</strong>
                    <span className="draft-tile__meta">Tap to add name, price, category, and optional image.</span>
                  </>
                )}
              </button>
            );
          })}

        </section>
      </form>

      <WorkspaceDialog
        open={Boolean(editingDraft)}
        title={editingDraft?.name?.trim() ? editingDraft.name : "Menu item details"}
        description="Set the item details here, then close the popup to return to the draft board."
        onClose={() => setEditingDraftId(null)}
        footer={
          editingDraft ? (
            <>
              <div className="page-actions page-actions--spread">
                {drafts.length > 1 ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => removeDraft(editingDraft.id)}
                    disabled={submitting}
                  >
                    Remove card
                  </button>
                ) : <span />}
                <button type="button" className="button button-confirm" onClick={() => setEditingDraftId(null)}>
                  Done
                </button>
              </div>
            </>
          ) : null
        }
      >
        {editingDraft ? (
          <div className="form-grid">
            <div className="form-grid form-grid--two-up">
              <div className="field-group">
                <label className="field-label" htmlFor="create_menu_name">
                  Name
                </label>
                <input
                  className="field-control"
                  id="create_menu_name"
                  type="text"
                  value={editingDraft.name}
                  onChange={(event) => updateDraft(editingDraft.id, { name: event.target.value })}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="create_menu_price">
                  Price
                </label>
                <input
                  className="field-control"
                  id="create_menu_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingDraft.price}
                  onChange={(event) => updateDraft(editingDraft.id, { price: event.target.value })}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="create_menu_category">
                  Category
                </label>
                <select
                  className="field-control"
                  id="create_menu_category"
                  value={editingDraft.category}
                  onChange={(event) => updateDraft(editingDraft.id, { category: event.target.value })}
                >
                  {(categorySuggestions.length ? categorySuggestions : ["Uncategorized"]).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="create_menu_status">
                  Availability
                </label>
                <select
                  className="field-control"
                  id="create_menu_status"
                  value={String(editingDraft.active)}
                  onChange={(event) =>
                    updateDraft(editingDraft.id, { active: event.target.value === "true" })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Archived</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="create_menu_image">
                Image
              </label>
              <input
                className="field-control"
                id="create_menu_image"
                type="file"
                accept="image/*"
                onChange={(event) => updateDraft(editingDraft.id, { image: event.target.files?.[0] || null })}
              />
              <div className="file-inline">
                <span className="field-help">{editingDraft.image ? editingDraft.image.name : "No file chosen"}</span>
                {editingDraft.image ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => updateDraft(editingDraft.id, { image: null })}
                  >
                    Clear file
                  </button>
                ) : null}
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="create_menu_description">
                Description
              </label>
              <textarea
                className="field-control"
                id="create_menu_description"
                value={editingDraft.description}
                onChange={(event) => updateDraft(editingDraft.id, { description: event.target.value })}
              />
            </div>
          </div>
        ) : null}
      </WorkspaceDialog>
    </>
  );
}
