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
      <section className="page-header page-header--split">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Add tables</h1>
          <p className="page-subtitle">
            Create table cards in a compact board, then open any card to set or change its table number.
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/restaurants/${restaurant.id}/tables`} className="button button-secondary">
            Back to tables
          </Link>
        </div>
      </section>

      <form className="page-section draft-stack" onSubmit={handleSubmit}>
        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Table board</h2>
              <p className="field-help">
                {completedCount} of {drafts.length} table card{drafts.length === 1 ? "" : "s"} ready to generate.
              </p>
            </div>
            <div className="page-actions">
              <button type="button" className="button" onClick={createDraft} disabled={submitting}>
                Add table card
              </button>
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting
                  ? "Creating tables"
                  : `Create ${drafts.length} table${drafts.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </section>

        <section className="draft-board" aria-label="Table drafts">
          {drafts.map((draft, index) => {
            const tableNumber = normalizeTableNumber(draft.tableNumber);

            return (
              <button
                key={draft.id}
                type="button"
                className={`draft-tile${tableNumber ? "" : " draft-tile--empty"}`}
                onClick={() => setEditingDraftId(draft.id)}
              >
                <span className="draft-tile__index">Table card {index + 1}</span>
                {tableNumber ? (
                  <>
                    <strong className="draft-tile__title">Table {tableNumber}</strong>
                    <span className="draft-tile__meta">QR access will be generated when you publish this board.</span>
                  </>
                ) : (
                  <>
                    <span className="draft-tile__plus" aria-hidden="true">+</span>
                    <strong className="draft-tile__title">Configure table</strong>
                    <span className="draft-tile__meta">Tap to set the table number for this card.</span>
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
          ) : null
        }
      >
        {editingDraft ? (
          <div className="field-group">
            <label className="field-label" htmlFor="create_table_number">
              Table number
            </label>
            <input
              className="field-control"
              id="create_table_number"
              type="text"
              placeholder="1, 2, A1, VIP-3"
              value={editingDraft.tableNumber}
              onChange={(event) => updateDraft(editingDraft.id, { tableNumber: event.target.value })}
            />
            <p className="field-help">Keep each number unique so staff can match the right QR card to the right table.</p>
          </div>
        ) : null}
      </WorkspaceDialog>
    </>
  );
}
