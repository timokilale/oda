import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceDialog from "../components/WorkspaceDialog.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

function buildTableDraft() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tableNumber: "",
  };
}

function normalizeTableNumber(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export default function TablesCreatePage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([buildTableDraft()]);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  usePageTitle(`Add tables - ${restaurant.name}`);

  const editingDraft = useMemo(
    () => drafts.find((draft) => draft.id === editingDraftId) || null,
    [drafts, editingDraftId],
  );

  const completedCount = drafts.filter((draft) => normalizeTableNumber(draft.tableNumber)).length;

  function updateDraft(draftId, nextValues) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, ...nextValues } : draft)),
    );
  }

  function createDraft() {
    const nextDraft = buildTableDraft();
    setDrafts((current) => [...current, nextDraft]);
  }

  function resetComposer() {
    setDrafts([buildTableDraft()]);
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

    const normalizedTableNumbers = drafts.map((draft) => normalizeTableNumber(draft.tableNumber));
    const incompleteIndex = normalizedTableNumbers.findIndex((tableNumber) => !tableNumber);
    if (incompleteIndex >= 0) {
      setFlash({
        type: "error",
        message: `Open table card ${incompleteIndex + 1} from the board and complete it before creating tables.`,
      });
      return;
    }

    const seen = new Set();
    const duplicateIndex = normalizedTableNumbers.findIndex((tableNumber) => {
      const normalizedKey = tableNumber.toLowerCase();
      if (seen.has(normalizedKey)) {
        return true;
      }

      seen.add(normalizedKey);
      return false;
    });

    if (duplicateIndex >= 0) {
      setFlash({ type: "error", message: "Each table number must be unique in this batch." });
      return;
    }

    setSubmitting(true);

    try {
      for (const [index, tableNumber] of normalizedTableNumbers.entries()) {
        try {
          await apiRequest(`/restaurants/${restaurant.id}/tables`, {
            method: "POST",
            body: { tableNumber },
          });
        } catch (error) {
          throw new Error(`Table ${index + 1}: ${error.message}`);
        }
      }

      const createdCount = drafts.length;
      resetComposer();
      refreshWorkspace().catch(() => undefined);
      navigate(`/restaurants/${restaurant.id}/tables`, {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: `Created ${createdCount} table${createdCount === 1 ? "" : "s"}.`,
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
            Add tables
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create table cards in a compact board, then open any card to set or change its table number.
          </p>
        </div>
        <Link
          to={`/restaurants/${restaurant.id}/tables`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors no-underline shrink-0 mt-6"
        >
          Back to tables
        </Link>
      </section>

      <form className="grid gap-4 mb-8" onSubmit={handleSubmit}>
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Table board</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {completedCount} of {drafts.length} table card{drafts.length === 1 ? "" : "s"} ready to generate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                onClick={createDraft}
                disabled={submitting}
              >
                Add table card
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting
                  ? "Creating tables"
                  : `Create ${drafts.length} table${drafts.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </section>

        <section
          className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3"
          aria-label="Table drafts"
        >
          {drafts.map((draft, index) => {
            const tableNumber = normalizeTableNumber(draft.tableNumber);

            return (
              <button
                key={draft.id}
                type="button"
                className={`text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  tableNumber
                    ? "border-border bg-card hover:border-muted-foreground/30"
                    : "border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40"
                }`}
                onClick={() => setEditingDraftId(draft.id)}
              >
                <span className="text-xs font-mono text-muted-foreground block mb-3">
                  Table card {index + 1}
                </span>
                {tableNumber ? (
                  <>
                    <strong className="block text-sm font-medium text-foreground">Table {tableNumber}</strong>
                    <span className="block text-xs text-muted-foreground mt-1">QR access will be generated when you publish this board.</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-lg mb-2" aria-hidden="true">+</span>
                    <strong className="block text-sm font-medium text-foreground">Configure table</strong>
                    <span className="block text-xs text-muted-foreground mt-1">Tap to set the table number for this card.</span>
                  </>
                )}
              </button>
            );
          })}
        </section>
      </form>

      <WorkspaceDialog
        open={Boolean(editingDraft)}
        title={editingDraft?.tableNumber ? `Table ${editingDraft.tableNumber}` : "Table details"}
        description="Set the table number here, then close the popup to return to the board."
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
          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="create_table_number">
              Table number
            </label>
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="create_table_number"
              type="text"
              placeholder="1, 2, A1, VIP-3"
              value={editingDraft.tableNumber}
              onChange={(event) => updateDraft(editingDraft.id, { tableNumber: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">Keep each number unique so staff can match the right QR card to the right table.</p>
          </div>
        ) : null}
      </WorkspaceDialog>
    </>
  );
}
