import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printAllQr(tables, restaurantName) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=720");
  if (!printWindow) return;

  const cards = tables.map(
    (t) => `
    <div class="card">
      <h2>Table ${escapeHtml(t.tableNumber)}</h2>
      <img src="${escapeHtml(t.qrCodeUrl)}" alt="QR for table ${escapeHtml(t.tableNumber)}" />
      <p class="label">Scan to order</p>
    </div>`
  ).join("");

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(restaurantName)} - Table QR Codes</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #fafbfc;
            color: #1a1a2e;
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .header h1 {
            font-size: 26px;
            font-weight: 800;
            margin: 0 0 4px;
            letter-spacing: -0.02em;
          }
          .header .accent {
            display: inline-block;
            width: 40px;
            height: 4px;
            background: #4f46e5;
            border-radius: 2px;
            margin: 8px 0;
          }
          .header p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
          }
          .card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px 16px;
            text-align: center;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
          .card h2 {
            margin: 0 0 12px;
            font-size: 20px;
            font-weight: 700;
            color: #1a1a2e;
          }
          .card img {
            width: 100%;
            max-width: 180px;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          .card .label {
            margin: 10px 0 0;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #4f46e5;
          }
          @media print {
            body { padding: 12px; background: #fff; }
            .card { border-color: #d1d5db; box-shadow: none; }
            .header .accent { background: #4f46e5 !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(restaurantName)}</h1>
          <div class="accent"></div>
          <p>Scan QR code to view menu &amp; order</p>
        </div>
        <div class="grid">${cards}</div>
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
    if (!value) return;

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

  async function handleShare(table) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Table ${table.tableNumber} QR`,
          text: `Order from Table ${table.tableNumber} at ${restaurant.name}`,
          url: table.qrTargetUrl,
        });
        setFlash({ type: "success", message: `Shared table ${table.tableNumber}.` });
        return;
      }

      await copyToClipboard(table.qrTargetUrl);
      setFlash({ type: "success", message: `Copied link for table ${table.tableNumber}.` });
    } catch {
      setFlash({ type: "error", message: "Unable to share from this device." });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const tableId = deleteTarget.id;
    setDeleteTarget(null);
    clearFlash();

    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables/${tableId}`, {
        method: "DELETE",
      });
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
            QR Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {tables.length
              ? `${tables.length} table${tables.length !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-6">
          {tables.length > 1 ? (
            <button
              type="button"
              onClick={() => printAllQr(tables, restaurant.name)}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              Print all
            </button>
          ) : null}
          <Link
            to={`/restaurants/${restaurant.id}/tables/new`}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline"
          >
            Add tables
          </Link>
        </div>
      </section>

      <section className="mb-8">
        {loading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : tables.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center"
              >
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
                  Table
                </span>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  {table.tableNumber}
                </h2>

                {table.qrCodeUrl ? (
                  <div className="w-32 h-32 mb-3 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={table.qrCodeUrl}
                      alt={`QR code for table ${table.tableNumber}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 mb-3 bg-muted rounded-lg flex items-center justify-center text-muted-foreground/40">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = table.qrCodeUrl;
                      link.download = `table-${table.tableNumber}-qr.png`;
                      link.click();
                    }}
                    className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(table)}
                    className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(table)}
                    className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-muted-foreground/50">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">No tables yet</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Add a table to generate its QR code.
            </p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete Table ${deleteTarget?.tableNumber || ""}?`}
        message="This will permanently delete the QR code for this table. Any printed copies will stop working."
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
