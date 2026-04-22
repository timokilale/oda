import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "./RestaurantLayout.jsx";

function parseTableNumbers(value) {
  const tokens = String(value || "")
    .split(/[\n,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const seen = new Set();
  return tokens.filter((token) => {
    const normalized = token.toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

export default function TablesCreatePage() {
  const { restaurant } = useRestaurantWorkspace();
  const navigate = useNavigate();
  const [bulkInput, setBulkInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(null);

  usePageTitle(`Add tables - ${restaurant.name}`);

  const tableNumbers = useMemo(() => parseTableNumbers(bulkInput), [bulkInput]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!tableNumbers.length) {
      setFlash({ type: "error", message: "Enter at least one table number." });
      return;
    }

    setSubmitting(true);
    setFlash(null);

    try {
      for (const [index, tableNumber] of tableNumbers.entries()) {
        try {
          await apiRequest(`/restaurants/${restaurant.id}/tables`, {
            method: "POST",
            body: { tableNumber },
          });
        } catch (error) {
          throw new Error(`Table ${index + 1}: ${error.message}`);
        }
      }

      navigate(`/restaurants/${restaurant.id}/tables`, {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: `Created ${tableNumbers.length} table${tableNumbers.length === 1 ? "" : "s"}.`,
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
      currentSection="tables"
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <section className="page-header page-header--split">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Add tables</h1>
          <p className="page-subtitle">
            Create one or many table QR entries from a single page, then return to a clean table grid.
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/restaurants/${restaurant.id}/tables`} className="button button-secondary">
            Back to tables
          </Link>
        </div>
      </section>

      <section className="workflow-grid page-section">
        <div className="workflow-step">
          <span className="workflow-step__index">1</span>
          <div>
            <h2 className="panel-title">List the tables</h2>
            <p className="field-help">Use commas or new lines: `1`, `2`, `A1`, `VIP-3`.</p>
          </div>
        </div>
        <div className="workflow-step">
          <span className="workflow-step__index">2</span>
          <div>
            <h2 className="panel-title">Review the batch</h2>
            <p className="field-help">Duplicate entries are cleaned up automatically before creation.</p>
          </div>
        </div>
        <div className="workflow-step">
          <span className="workflow-step__index">3</span>
          <div>
            <h2 className="panel-title">Generate together</h2>
            <p className="field-help">Create the full group and return to the grid view when it is done.</p>
          </div>
        </div>
      </section>

      <form className="page-section draft-stack" onSubmit={handleSubmit}>
        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Table batch</h2>
              <p className="field-help">
                {tableNumbers.length
                  ? `${tableNumbers.length} table${tableNumbers.length === 1 ? "" : "s"} ready to generate.`
                  : "Enter table references below to preview them before creation."}
              </p>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="bulk_table_numbers">
              Table numbers
            </label>
            <textarea
              className="field-control field-control--tall"
              id="bulk_table_numbers"
              placeholder={"1\n2\nA1\nVIP-3"}
              value={bulkInput}
              onChange={(event) => setBulkInput(event.target.value)}
              required
            />
          </div>
        </section>

        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Preview</h2>
              <p className="field-help">This is the order your new table cards will follow.</p>
            </div>
          </div>

          {tableNumbers.length ? (
            <div className="tag-grid">
              {tableNumbers.map((tableNumber) => (
                <span key={tableNumber} className="status-pill">
                  Table {tableNumber}
                </span>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-text">Your table preview will appear here as soon as you start typing.</p>
            </div>
          )}
        </section>

        <section className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Generate QR access</h2>
              <p className="field-help">Each table will get its own QR code and customer ordering link.</p>
            </div>
            <div className="page-actions">
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting
                  ? "Creating tables"
                  : `Create ${tableNumbers.length || 0} table${tableNumbers.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </section>
      </form>
    </WorkspaceShell>
  );
}
