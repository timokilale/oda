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

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [lastOrderIds, setLastOrderIds] = useState(new Set());
  const [acceptingOrders, setAcceptingOrders] = useState(restaurant.active);
  const [savingToggle, setSavingToggle] = useState(false);
  const [undoTarget, setUndoTarget] = useState(null);
  const [kitchenFullscreen, setKitchenFullscreen] = useState(false);
  const undoTimeoutRef = useRef(null);
  const fallbackRef = useRef(null);
  const fullscreenRef = useRef(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/orders`);
      const newOrders = data.orders || [];

      setOrders(newOrders);
      setSummary(data.orderSummary);

      const currentIds = new Set(newOrders.map((o) => o.id));
      setLastOrderIds((prev) => {
        if (prev.size > 0 && currentIds.size > prev.size) {
          playNotificationSound();
        }
        return currentIds;
      });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    setLoading(true);
    loadOrders();

    const url = `/api/restaurants/${restaurant.id}/orders/sse`;
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener("orders", (event) => {
      try {
        const data = JSON.parse(event.data);
        setOrders(data.orders);
        setSummary(data.orderSummary);

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

      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    });

    es.addEventListener("error", () => {
      if (!fallbackRef.current) {
        fallbackRef.current = setInterval(loadOrders, 7000);
      }
    });

    return () => {
      es.close();
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

  function toggleKitchenFullscreen() {
    if (!kitchenFullscreen) {
      setKitchenFullscreen(true);
      try {
        const el = fullscreenRef.current;
        if (el && el.requestFullscreen) {
          el.requestFullscreen();
        }
      } catch {
        // fullscreen not supported
      }
    } else {
      setKitchenFullscreen(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      } catch {
        // fullscreen not supported
      }
    }
  }

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        setKitchenFullscreen(false);
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const groupedOrders = useMemo(() => {
    const active = orders.filter((o) => ["pending", "confirmed"].includes(o.status));
    const done = orders.filter((o) => ["completed", "cancelled"].includes(o.status));
    return { active, done };
  }, [orders]);

  return (
    <>
      <div className="sticky top-12 z-20 -mx-4 px-4 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{restaurant.name}</h1>
            <p className="text-xs text-muted-foreground">
              {acceptingOrders ? `${summary?.openOrderCount || 0} open orders` : "Orders paused"}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleKitchenFullscreen}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label={kitchenFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              {kitchenFullscreen ? (
                <>
                  <path d="M4 12h4v4M16 8h-4V4M4 8h4V4M16 12h-4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <>
                  <path d="M4 8V4h4M16 12v4h-4M4 12v4h4M16 8V4h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleAcceptingOrders}
            disabled={savingToggle}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:opacity-50 ${
              acceptingOrders
                ? "border-success/40 bg-success text-white"
                : "border-border bg-muted"
            }`}
            role="switch"
            aria-checked={acceptingOrders}
            aria-label="Accepting orders"
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                acceptingOrders ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

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

      <section className="py-4 grid gap-3">
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : groupedOrders.active.length === 0 && groupedOrders.done.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-muted-foreground/50">
                <path d="M3 9h18M9 3v6m6-6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="4" y="9" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">No orders yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {acceptingOrders
                ? "Waiting for customers to scan a QR code and place an order. It'll show up here instantly."
                : "Turn on accepting orders above to start receiving orders."}
            </p>
          </div>
        ) : (
          <>
            {groupedOrders.active.map((order) => {
              const meta = statusMeta(order.status);
              const elapsed = timeAgo(order.createdAt);
              const isUrgent =
                order.status === "pending" &&
                Date.now() - new Date(order.createdAt).getTime() > 120000;

              return (
                <div
                  key={order.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    order.status === "pending"
                      ? isUrgent
                        ? "border-destructive/60 bg-destructive/[0.04]"
                        : "border-l-4 border-l-destructive border-border bg-card"
                      : "border-l-4 border-l-warning border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground leading-none">
                        Table {order.tableNumber}
                      </span>
                      {order.status === "pending" && isUrgent ? (
                        <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-bold bg-destructive/10 text-destructive uppercase tracking-wider animate-pulse">
                          Urgent
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {elapsed}
                    </span>
                  </div>

                  <div className="mb-3">
                    {order.itemsSummary ? (
                      <p className="text-sm text-foreground font-medium">
                        {order.itemsSummary}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">#{order.id}</span>
                      <span className="text-base font-bold text-foreground tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {meta.next ? (
                      <button
                        type="button"
                        onClick={() => handleAction(order.id, order.status)}
                        disabled={updatingOrderId === order.id}
                        className={`flex-1 inline-flex items-center justify-center h-12 rounded-xl text-base font-bold transition-colors disabled:opacity-50 ${
                          order.status === "pending"
                            ? "bg-success text-white hover:bg-success/90 active:bg-success/80"
                            : "bg-warning text-white hover:bg-warning/90 active:bg-warning/80"
                        }`}
                      >
                        {updatingOrderId === order.id
                          ? "Updating..."
                          : meta.nextLabel}
                      </button>
                    ) : null}
                    {order.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        disabled={updatingOrderId === order.id}
                        className="inline-flex items-center justify-center h-12 w-12 rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        aria-label="Cancel order"
                      >
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                          <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {groupedOrders.done.length > 0 ? (
              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer py-2 hover:text-foreground transition-colors">
                  Completed ({groupedOrders.done.length})
                </summary>
                <div className="grid gap-2 mt-2">
                  {groupedOrders.done.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-border bg-muted/30 p-3 opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          Table {order.tableNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.status === "completed" ? "Served" : "Cancelled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {order.itemsSummary || `#${order.id}`}
                        </span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </>
        )}
      </section>

      {kitchenFullscreen ? (
        <div
          ref={fullscreenRef}
          className="fixed inset-0 z-50 bg-background overflow-y-auto p-4"
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
            <h2 className="text-lg font-bold text-foreground">Orders</h2>
            <button
              type="button"
              onClick={toggleKitchenFullscreen}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              Exit fullscreen
            </button>
          </div>
          <div className="grid gap-3 max-w-3xl mx-auto">
            {groupedOrders.active.length === 0 && groupedOrders.done.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No orders yet</p>
            ) : (
              <>
                {groupedOrders.active.map((order) => {
                  const meta = statusMeta(order.status);
                  const elapsed = timeAgo(order.createdAt);
                  const isUrgent =
                    order.status === "pending" &&
                    Date.now() - new Date(order.createdAt).getTime() > 120000;

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        order.status === "pending"
                          ? isUrgent
                            ? "border-destructive/60 bg-destructive/[0.04]"
                            : "border-l-4 border-l-destructive border-border bg-card"
                          : "border-l-4 border-l-warning border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground leading-none">
                          Table {order.tableNumber}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground tabular-nums">
                          {elapsed}
                        </span>
                      </div>
                      <div className="mb-3">
                        {order.itemsSummary ? (
                          <p className="text-sm text-foreground font-medium">{order.itemsSummary}</p>
                        ) : null}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {meta.next ? (
                          <button
                            type="button"
                            onClick={() => handleAction(order.id, order.status)}
                            disabled={updatingOrderId === order.id}
                            className={`flex-1 inline-flex items-center justify-center h-12 rounded-xl text-base font-bold transition-colors disabled:opacity-50 ${
                              order.status === "pending"
                                ? "bg-success text-white hover:bg-success/90 active:bg-success/80"
                                : "bg-warning text-white hover:bg-warning/90 active:bg-warning/80"
                            }`}
                          >
                            {updatingOrderId === order.id ? "Updating..." : meta.nextLabel}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
