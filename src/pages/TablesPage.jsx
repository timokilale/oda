import { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "./RestaurantLayout.jsx";

export default function TablesPage() {
  const { restaurant, refreshWorkspace } = useRestaurantWorkspace();
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  usePageTitle(`Tables — ${restaurant.name}`);

  async function loadTables() {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/tables`);
      setTables(data.tables);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadTables();
  }, [restaurant.id]);

  async function copyToClipboard(value) {
    if (!value) {
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFlash(null);

    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables`, {
        method: "POST",
        body: { tableNumber },
      });
      setTableNumber("");
      setFlash({ type: "success", message: "Table QR created" });
      await Promise.all([loadTables(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const tableId = deleteTarget.id;
    setDeleteTarget(null);
    setFlash(null);

    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables/${tableId}`, {
        method: "DELETE",
      });
      setFlash({ type: "success", message: "Table deleted" });
      await Promise.all([loadTables(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleCopyLink(table) {
    try {
      await copyToClipboard(table.qrTargetUrl);
      setFlash({ type: "success", message: `Copied table ${table.tableNumber} link.` });
    } catch {
      setFlash({ type: "error", message: "Unable to copy the customer link on this device." });
    }
  }

  return (
    <WorkspaceShell
      currentSection="tables"
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <section className="page-header">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Tables</h1>
          <p className="page-subtitle">{restaurant.name}</p>
        </div>
      </section>

      <section className="surface panel page-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Add table</h2>
            <p className="field-help">
              Create a table once, then download or copy the customer ordering link whenever staff need it.
            </p>
          </div>
        </div>

        <form className="toolbar-row" onSubmit={handleSubmit}>
          <div className="field-group" style={{ minWidth: 220, flex: "1 1 260px" }}>
            <label className="field-label" htmlFor="table_number">
              Table number
            </label>
            <input
              className="field-control"
              id="table_number"
              type="text"
              placeholder="1, 2, A1, VIP-3"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              required
            />
          </div>
          <div>
            <button type="submit" className="button button-confirm" disabled={submitting}>
              {submitting ? "Creating" : "Create QR"}
            </button>
          </div>
        </form>
      </section>

      <section className="page-section">
        {loading ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : tables.length ? (
          <div className="qr-grid">
            {tables.map((table) => (
              <article key={table.id} className="qr-card">
                <img
                  src={table.qrCodeUrl}
                  alt={`QR code for table ${table.tableNumber}`}
                  className="qr-preview"
                />
                <div className="stack-sm">
                  <div>
                    <h2 className="panel-title">Table {table.tableNumber}</h2>
                    <p className="table-meta">{table.qrTargetUrl}</p>
                  </div>
                  <div className="action-row">
                    <button type="button" className="button" onClick={() => handleCopyLink(table)}>
                      Copy link
                    </button>
                    <a
                      href={table.qrTargetUrl}
                      className="button"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open menu
                    </a>
                    <a
                      href={table.qrCodeUrl}
                      download={`table-${table.tableNumber}-qr.png`}
                      className="button"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => setDeleteTarget(table)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface empty-state">
            <h2 className="panel-title">No tables yet</h2>
            <p className="empty-text">Create your first table to generate a QR code and customer ordering link.</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete Table ${deleteTarget?.tableNumber || ""}?`}
        message="This will permanently delete the QR code for this table. Any printed copies of this QR code will stop working. Existing orders from this table are not affected."
        confirmLabel="Delete table"
        cancelLabel="Keep table"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </WorkspaceShell>
  );
}
