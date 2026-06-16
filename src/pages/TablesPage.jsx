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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function printQr(table) {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=720");

    if (!printWindow) {
      throw new Error("Print window blocked");
    }

    const tableNumber = escapeHtml(table.tableNumber);
    const imageUrl = escapeHtml(table.qrCodeUrl);

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Table ${tableNumber} QR</title>
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
            <h1>Table ${tableNumber}</h1>
            <img src="${imageUrl}" alt="QR code for table ${tableNumber}" />
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
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Restaurant</p>
          <h1 className="text-[clamp(2.15rem,4vw,3.5rem)] font-display italic font-normal leading-none text-foreground mt-1">
            Tables
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Keep the floorplan clean on screen. Open a table card only when you need to download, print, or share its QR access.
          </p>
        </div>
        <Link
          to={`/restaurants/${restaurant.id}/tables/new`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline shrink-0 mt-6"
        >
          Add tables
        </Link>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Tables</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{tables.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Open orders</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{workspaceSummary.openOrderCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Menu items</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{workspaceSummary.menuItemCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Workspace</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{restaurant.name}</p>
        </div>
      </section>

      <section className="mb-8">
        {loading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : tables.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {tables.map((table) => {
              const isExpanded = expandedTableId === table.id;

              return (
                <article
                  key={table.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? "border-primary shadow-md bg-card"
                      : "border-border bg-card hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left p-4 cursor-pointer border-none bg-transparent"
                    aria-expanded={isExpanded ? "true" : "false"}
                    onClick={() => setExpandedTableId((current) => (current === table.id ? null : table.id))}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                        Dining table
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {isExpanded ? "Hide actions" : "Show actions"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display italic text-foreground">Table {table.tableNumber}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      QR access ready{table.createdAt ? ` since ${dateFormatter.format(new Date(table.createdAt))}` : "."}
                    </p>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-border px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                          onClick={() => handleDownload(table)}
                        >
                          Download QR
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                          onClick={() => handlePrint(table)}
                        >
                          Print QR
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                          onClick={() => handleShare(table)}
                        >
                          Share
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
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
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30">
              <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="1.2" />
              <line x1="4" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.2" />
              <rect x="10" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
              <rect x="32" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
              <rect x="10" y="30" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
              <rect x="32" y="30" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
            </svg>
            <h2 className="text-lg font-display italic text-foreground">No tables yet</h2>
            <p className="text-sm text-muted-foreground mt-2">
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
