import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function TablesPage() {
  const {
    restaurant,
    workspaceSummary,
    refreshWorkspace,
    setFlash,
    clearFlash,
  } = useRestaurantWorkspace();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedTableId, setExpandedTableId] = useState(null);

  usePageTitle(`Tables - ${restaurant.name}`);

  const loadTables = useCallback(async () => {
    setLoading(true);

    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/tables`);
      setTables(data.tables);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

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

  function downloadQr(table) {
    const link = document.createElement("a");
    link.href = table.qrCodeUrl;
    link.download = `table-${table.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function printQr(table) {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=720");

    if (!printWindow) {
      throw new Error("Print window blocked");
    }

    const safeTableNumber = String(table.tableNumber).replace(/[<>&"]/g, "");
    const safeImageUrl = String(table.qrCodeUrl).replace(/"/g, "&quot;");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Table ${safeTableNumber} QR</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: "DM Sans", system-ui, sans-serif;
              background: #f5efe3;
              color: #2e2416;
            }
            main {
              width: min(92vw, 480px);
              padding: 32px;
              text-align: center;
              border: 1px solid rgba(79, 61, 28, 0.14);
              border-radius: 24px;
              background: #fffaf3;
            }
            h1 {
              margin: 0 0 8px;
              font: italic 400 42px/1 "Cormorant Garamond", Georgia, serif;
            }
            p {
              margin: 0 0 20px;
              color: #5e5443;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              font-size: 12px;
            }
            img {
              width: min(100%, 320px);
              height: auto;
            }
          </style>
        </head>
        <body>
          <main>
            <p>ODA Table QR</p>
            <h1>Table ${safeTableNumber}</h1>
            <img src="${safeImageUrl}" alt="QR code for table ${safeTableNumber}" />
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    const runPrint = () => {
      printWindow.print();
      printWindow.close();
    };

    if (printWindow.document.readyState === "complete") {
      runPrint();
      return;
    }

    printWindow.onload = runPrint;
  }

  async function handleShare(table) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Table ${table.tableNumber} QR`,
          text: `Share the ordering access for table ${table.tableNumber}.`,
          url: table.qrTargetUrl,
        });
        setFlash({ type: "success", message: `Shared table ${table.tableNumber}.` });
        return;
      }

      await copyToClipboard(table.qrTargetUrl);
      setFlash({ type: "success", message: `Copied share link for table ${table.tableNumber}.` });
    } catch {
      setFlash({ type: "error", message: "Unable to share this table from this device." });
    }
  }

  function handleDownload(table) {
    try {
      downloadQr(table);
      setFlash({ type: "success", message: `Download started for table ${table.tableNumber}.` });
    } catch {
      setFlash({ type: "error", message: "Unable to download that QR code right now." });
    }
  }

  function handlePrint(table) {
    try {
      printQr(table);
      setFlash({ type: "success", message: `Opening print view for table ${table.tableNumber}.` });
    } catch {
      setFlash({ type: "error", message: "Unable to open the print view right now." });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const tableId = deleteTarget.id;
    setDeleteTarget(null);
    clearFlash();

    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables/${tableId}`, {
        method: "DELETE",
      });
      setExpandedTableId((current) => (current === tableId ? null : current));
      setFlash({ type: "success", message: "Table deleted." });
      await Promise.all([loadTables(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  return (
    <>
      <section className="page-header page-header--split">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Tables</h1>
          <p className="page-subtitle">
            Keep the floorplan clean on screen. Open a table card only when you need to download, print, or share its QR access.
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/restaurants/${restaurant.id}/tables/new`} className="button button-confirm">
            Add tables
          </Link>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Tables</p>
          <p className="metric-value">{tables.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Open orders</p>
          <p className="metric-value">{workspaceSummary.openOrderCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Menu items</p>
          <p className="metric-value">{workspaceSummary.menuItemCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Workspace</p>
          <p className="metric-value">{restaurant.name}</p>
        </div>
      </section>

      <section className="page-section">
        {loading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : tables.length ? (
          <div className="table-card-grid">
            {tables.map((table) => {
              const isExpanded = expandedTableId === table.id;

              return (
                <article key={table.id} className={`table-card${isExpanded ? " is-expanded" : ""}`}>
                  <button
                    type="button"
                    className="table-card__summary"
                    aria-expanded={isExpanded ? "true" : "false"}
                    onClick={() => setExpandedTableId((current) => (current === table.id ? null : table.id))}
                  >
                    <div className="table-card__header">
                      <span className="table-card__eyebrow">Dining table</span>
                      <span className="table-card__toggle">{isExpanded ? "Hide actions" : "Show actions"}</span>
                    </div>
                    <h2 className="table-card__title">Table {table.tableNumber}</h2>
                    <p className="table-card__meta">
                      QR access ready{table.createdAt ? ` since ${dateFormatter.format(new Date(table.createdAt))}` : "."}
                    </p>
                  </button>

                  {isExpanded ? (
                    <div className="table-card__details">
                      <p className="table-card__details-copy">
                        QR code and customer link stay off the screen until staff need an action.
                      </p>
                      <div className="table-card__actions">
                        <button
                          type="button"
                          className="button"
                          onClick={() => handleDownload(table)}
                        >
                          Download QR
                        </button>
                        <button
                          type="button"
                          className="button"
                          onClick={() => handlePrint(table)}
                        >
                          Print QR
                        </button>
                        <button
                          type="button"
                          className="button"
                          onClick={() => handleShare(table)}
                        >
                          Share
                        </button>
                        <button
                          type="button"
                          className="button button-danger"
                          onClick={() => setDeleteTarget(table)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface empty-state">
            <h2 className="panel-title">No tables yet</h2>
            <p className="empty-text">
              Use Add tables to create one or many table QR entries without crowding this page.
            </p>
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
    </>
  );
}
