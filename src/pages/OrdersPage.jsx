import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

const ORDER_STATUSES = [
  { value: "pending", label: "New", next: "confirmed", nextLabel: "Accept", color: "red" },
  { value: "confirmed", label: "Cooking", next: "completed", nextLabel: "Serve", color: "amber" },
  { value: "completed", label: "Served", next: null, nextLabel: null, color: "green" },
  { value: "cancelled", label: "Cancelled", next: null, nextLabel: null, color: "neutral" },
];

function statusMeta(status) {
  return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[3];
}

function parseDate(value) {
  if (!value) return NaN;
  const s = String(value);
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
  if (match) {
    const [, y, m, d, hh, mm, ss, tz] = match;
    const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}${tz || 'Z'}`;
    return Date.parse(iso);
  }
  return Date.parse(s);
}

function timeAgo(date) {
  const ts = parseDate(date);
  if (isNaN(ts)) { console.warn("timeAgo: invalid date", date); return ""; }
  const diff = Date.now() - ts;
  if (diff < 0) return "placed just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "placed just now";
  if (minutes < 60) return `placed ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours < 24) return `placed ${hours}h ${remaining}m ago`;
  return `placed ${Math.floor(hours / 24)}d ago`;
}

function OrderRow({ order, updatingOrderId, onAction, onCancel }) {
  const elapsed = timeAgo(order.createdAt);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
        order.status === "cancelled"
          ? "border-border bg-muted/30 opacity-60"
          : "border-border"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            Table {order.tableNumber}
          </span>
          <span className="text-xs text-muted-foreground">{elapsed}</span>
        </div>
        <div className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
          {order.itemsSummary || `#${order.id}`}
          <span className="font-semibold ml-2">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {order.status === "pending" ? (
          <>
            <button
              type="button"
              onClick={() => onCancel(order.id, "cancelled")}
              disabled={updatingOrderId === order.id}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onAction(order.id, order.status)}
              disabled={updatingOrderId === order.id}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium bg-success text-white hover:bg-success/90 transition-colors disabled:opacity-50"
            >
              {updatingOrderId === order.id ? "..." : "Accept"}
            </button>
          </>
        ) : order.status === "confirmed" ? (
          <button
            type="button"
            onClick={() => onAction(order.id, order.status)}
            disabled={updatingOrderId === order.id}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updatingOrderId === order.id ? "..." : "Serve"}
          </button>
        ) : order.status === "completed" ? (
          <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium bg-success/10 text-success">
            Served
          </span>
        ) : (
          <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium bg-muted text-muted-foreground">
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

export default function OrdersPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [lastOrderIds, setLastOrderIds] = useState(new Set());
  const [acceptingOrders, setAcceptingOrders] = useState(restaurant.active);
  const [savingToggle, setSavingToggle] = useState(false);
  const [undoTarget, setUndoTarget] = useState(null);
  const [filter, setFilter] = useState("active");
  const [groupByTable, setGroupByTable] = useState(false);
  const undoTimeoutRef = useRef(null);
  const fallbackRef = useRef(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/orders`);
      const newOrders = data.orders || [];

      setOrders(newOrders);
      const currentIds = new Set(newOrders.map((o) => o.id));
      setLastOrderIds((prev) => {
        if (prev.size > 0 && currentIds.size > prev.size) {
          playNotificationSound();
        }
        return currentIds;
      });
    } catch (error) {
      if (!error.message.includes("timed out")) {
        setFlash({ type: "error", message: error.message });
      }
    } finally {
      setLoading(false);
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    setLoading(true);
    loadOrders();

    const url = `/api/restaurants/${restaurant.id}/orders/sse`;
    const es = new EventSource(url, { withCredentials: true });

    const sseTimeout = setTimeout(() => {
      if (!fallbackRef.current) {
        fallbackRef.current = setInterval(loadOrders, 7000);
      }
    }, 12000);

    es.addEventListener("orders", (event) => {
      try {
        const data = JSON.parse(event.data);
        setOrders(data.orders);

        setLastOrderIds((prev) => {
          const currentIds = new Set(data.orders.map((o) => o.id));
          if (prev.size > 0 && currentIds.size > prev.size) {
            playNotificationSound();
          }
          return currentIds;
        });
      } catch {
        // ignore parse errors
      }
      setLoading(false);
      clearTimeout(sseTimeout);

      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    });

    es.addEventListener("error", () => {
      clearTimeout(sseTimeout);
      if (!fallbackRef.current) {
        fallbackRef.current = setInterval(loadOrders, 7000);
      }
    });

    return () => {
      es.close();
      clearTimeout(sseTimeout);
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
      }
    };
  }, [restaurant.id, loadOrders]);

  useEffect(() => {
    setAcceptingOrders(restaurant.active);
  }, [restaurant.active]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  async function toggleAcceptingOrders() {
    setSavingToggle(true);
    const newValue = !acceptingOrders;

    try {
      const formData = new FormData();
      formData.set("active", String(newValue));
      await apiRequest(`/restaurants/${restaurant.id}`, {
        method: "PATCH",
        formData,
      });
      setAcceptingOrders(newValue);
      await refreshWorkspace();
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSavingToggle(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    clearFlash();
    setUpdatingOrderId(orderId);

    const previousOrders = [...orders];

    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );

    try {
      await apiRequest(`/restaurants/${restaurant.id}/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setOrders(previousOrders);
      setFlash({ type: "error", message: error.message });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleAction(orderId, currentStatus) {
    const meta = statusMeta(currentStatus);
    if (!meta.next) return;

    await updateOrderStatus(orderId, meta.next);

    if (currentStatus === "pending") {
      setUndoTarget({ orderId, previousStatus: "pending" });
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setUndoTarget(null);
      }, 4000);
    }
  }

  async function handleUndo() {
    if (!undoTarget) return;
    const { orderId, previousStatus } = undoTarget;
    setUndoTarget(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    await updateOrderStatus(orderId, previousStatus);
  }

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "served") return orders.filter((o) => ["completed", "cancelled"].includes(o.status));
    return orders.filter((o) => ["pending", "confirmed"].includes(o.status));
  }, [filter, orders]);

  const groupedOrders = useMemo(() => {
    if (!groupByTable) return null;
    const groups = {};
    for (const o of visibleOrders) {
      const key = o.tableNumber || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [groupByTable, visibleOrders]);

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
            Orders
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <button
            type="button"
            onClick={toggleAcceptingOrders}
            disabled={savingToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:opacity-50 ${
              acceptingOrders
                ? "border-success/40 bg-success text-white"
                : "border-border bg-muted"
            }`}
            role="switch"
            aria-checked={acceptingOrders}
            aria-label="Accepting orders"
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                acceptingOrders ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            {[
              { value: "active", label: "Active" },
              { value: "served", label: "Served" },
              { value: "all", label: "All" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`inline-flex items-center justify-center h-7 px-2.5 rounded text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGroupByTable((v) => !v)}
              className={`inline-flex items-center justify-center h-7 px-2.5 rounded text-xs font-medium border transition-colors ${
                groupByTable
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 mr-1.5">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Group by table
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3 animate-pulse">
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))
          ) : visibleOrders.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-muted-foreground/50">
                  <path d="M3 9h18M9 3v6m6-6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="4" y="9" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {filter === "active"
                  ? "No active orders"
                  : filter === "served"
                    ? "No served orders"
                    : "No orders yet"}
              </h3>
            </div>
          ) : groupedOrders ? (
            groupedOrders.map(([tableName, tableOrders]) => (
              <div key={tableName} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-muted-foreground">
                    <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <line x1="5" y1="3" x2="5" y2="13" stroke="currentColor" strokeWidth="1.3" />
                    <line x1="11" y1="3" x2="11" y2="13" stroke="currentColor" strokeWidth="1.3" />
                    <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <h3 className="text-sm font-semibold text-foreground">Table {tableName}</h3>
                  <span className="text-xs text-muted-foreground">({tableOrders.length})</span>
                </div>
                <div className="grid gap-2">
                  {tableOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      updatingOrderId={updatingOrderId}
                      onAction={handleAction}
                      onCancel={updateOrderStatus}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            visibleOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                updatingOrderId={updatingOrderId}
                onAction={handleAction}
                onCancel={updateOrderStatus}
              />
            ))
          )}
        </div>
      </section>

      {undoTarget ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm text-foreground">Order accepted</span>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={handleUndo}
          >
            Undo
          </button>
        </div>
      ) : null}
    </>
  );
}
