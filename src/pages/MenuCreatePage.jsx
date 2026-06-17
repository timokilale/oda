import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceDialog from "../components/WorkspaceDialog.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
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
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Restaurant</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
            Add menu items
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Build a batch with compact cards, then open a card only when you want to edit its details.
          </p>
        </div>
        <Link
          to={`/restaurants/${restaurant.id}/menu`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors no-underline shrink-0 mt-6"
        >
          Back to menu
        </Link>
      </section>

      <form className="grid gap-4 mb-8" onSubmit={handleSubmit}>
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Draft board</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {completedCount} of {itemCountLabel} ready to publish.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                onClick={createDraft}
                disabled={submitting}
              >
                Add item card
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Saving items" : `Create ${itemCountLabel}`}
              </button>
            </div>
          </div>
        </section>

        <section
          className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3"
          aria-label="Menu item drafts"
        >
          {drafts.map((draft, index) => {
            const isComplete = isDraftComplete(draft);

            return (
              <button
                key={draft.id}
                type="button"
                className={`text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  isComplete
                    ? "border-border bg-card hover:border-muted-foreground/30"
                    : "border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40"
                }`}
                onClick={() => setEditingDraftId(draft.id)}
              >
                <span className="text-xs font-mono text-muted-foreground block mb-3">
                  Item {index + 1}
                </span>
                {isComplete ? (
                  <>
                    <strong className="block text-sm font-medium text-foreground mb-1">{draft.name}</strong>
                    <span className="block text-xs text-muted-foreground">{draft.category}</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      {draft.price ? formatCurrency(draft.price) : "Price pending"}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/60 mt-2 truncate">
                      {draft.image ? draft.image.name : "No image"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-lg mb-2" aria-hidden="true">+</span>
                    <strong className="block text-sm font-medium text-foreground">Configure item</strong>
                    <span className="block text-xs text-muted-foreground mt-1">Tap to add name, price, category, and optional image.</span>
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
            <div className="flex items-center justify-between">
              {drafts.length > 1 ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => removeDraft(editingDraft.id)}
                  disabled={submitting}
                >
                  Remove card
                </button>
              ) : <span />}
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={() => setEditingDraftId(null)}
              >
                Done
              </button>
            </div>
          ) : null
        }
      >
        {editingDraft ? (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_menu_name">
                  Name
                </label>
                <input
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
                  id="create_menu_name"
                  type="text"
                  placeholder="e.g. Grilled Tilapia"
                  value={editingDraft.name}
                  onChange={(event) => updateDraft(editingDraft.id, { name: event.target.value })}
                />
              </div>

                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_menu_price">
                    Price
                  </label>
                  <input
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
                    id="create_menu_price"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 2500"
                    value={editingDraft.price}
                    onChange={(event) => updateDraft(editingDraft.id, { price: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground/70">Number only — currency formatting is applied automatically.</p>
                </div>

              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_menu_category">
                  Category
                </label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
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

              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_menu_status">
                  Availability
                </label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
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

            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_menu_image">
                Image
              </label>
                <input
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:mr-2"
                  id="create_menu_image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateDraft(editingDraft.id, { image: event.target.files?.[0] || null })}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={editingDraft.image ? "text-foreground" : "text-muted-foreground/60"}>
                    {editingDraft.image ? editingDraft.image.name : "No file chosen"}
                  </span>
                  {editingDraft.image ? (
                    <button
                      type="button"
                      className="text-xs underline underline-offset-2 hover:no-underline text-muted-foreground"
                      onClick={() => updateDraft(editingDraft.id, { image: null })}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground/70">Optional — items without images show a warm color placeholder.</p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_menu_description">
                Description
              </label>
                <textarea
                  className="h-8 min-h-[80px] w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground transition-colors resize-y"
                  id="create_menu_description"
                  placeholder="Briefly describe the dish…"
                  value={editingDraft.description}
                  onChange={(event) => updateDraft(editingDraft.id, { description: event.target.value })}
                />
                <p className="text-xs text-muted-foreground/70">Optional — brief descriptions help customers choose.</p>
            </div>
          </div>
        ) : null}
      </WorkspaceDialog>
    </>
  );
}
