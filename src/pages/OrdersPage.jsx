import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

const STATUS_FILTER_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const ORDER_BY_OPTIONS = [
  { value: "placed_desc", label: "Placed: newest first" },
  { value: "placed_asc", label: "Placed: oldest first" },
  { value: "order_desc", label: "Order #: highest first" },
  { value: "order_asc", label: "Order #: lowest first" },
  { value: "table_asc", label: "Table: A-Z" },
  { value: "table_desc", label: "Table: Z-A" },
  { value: "total_desc", label: "Total: high to low" },
  { value: "total_asc", label: "Total: low to high" },
  { value: "status_asc", label: "Status: A-Z" },
];

const STATUS_STYLES = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  confirmed: "border-green-200 bg-green-50 text-green-700",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

function compareText(leftValue, rightValue, direction = "asc") {
  const nextValue = String(leftValue || "").localeCompare(String(rightValue || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return direction === "asc" ? nextValue : nextValue * -1;
}

function compareNumber(leftValue, rightValue, direction = "asc") {
  const nextValue = Number(leftValue || 0) - Number(rightValue || 0);
  return direction === "asc" ? nextValue : nextValue * -1;
}

function compareDate(leftValue, rightValue, direction = "desc") {
  const nextValue = new Date(leftValue).getTime() - new Date(rightValue).getTime();
  return direction === "asc" ? nextValue : nextValue * -1;
}

export default function OrdersPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [tableFilter, setTableFilter] = useState("");
  const [orderBy, setOrderBy] = useState("placed_desc");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  usePageTitle(`Orders - ${restaurant.name}`);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/orders`);
      setOrders(data.orders);
      setSummary(data.orderSummary);
      setLastUpdated(new Date());
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadOrders();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadOrders]);

  function requestStatusUpdate(orderId, status) {
    const actionLabel =
      status === "confirmed"
        ? "confirm this order"
        : status === "completed"
          ? "mark this order as completed"
          : "cancel this order";

    setConfirmAction({ orderId, status, actionLabel });
    setConfirmOpen(true);
  }

  async function executeStatusUpdate() {
    if (!confirmAction) {
      return;
    }

    const { orderId, status } = confirmAction;
    setConfirmOpen(false);
    setConfirmAction(null);
    clearFlash();
    setUpdatingOrderId(orderId);

    try {
      await apiRequest(`/restaurants/${restaurant.id}/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status },
      });
      setFlash({ type: "success", message: "Order updated." });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const visibleOrders = useMemo(() => {
    const filteredOrders = orders.filter((order) => {
      if (statusFilter === "open" && !["pending", "confirmed"].includes(order.status)) {
        return false;
      }

      if (statusFilter !== "all" && statusFilter !== "open" && order.status !== statusFilter) {
        return false;
      }

      if (tableFilter.trim()) {
        const search = tableFilter.trim().toLowerCase();
        if (!String(order.tableNumber).toLowerCase().includes(search)) {
          return false;
        }
      }

      return true;
    });

    return [...filteredOrders].sort((left, right) => {
      switch (orderBy) {
        case "placed_asc":
          return compareDate(left.createdAt, right.createdAt, "asc");
        case "order_desc":
          return compareNumber(left.id, right.id, "desc");
        case "order_asc":
          return compareNumber(left.id, right.id, "asc");
        case "table_asc":
          return compareText(left.tableNumber, right.tableNumber, "asc");
        case "table_desc":
          return compareText(left.tableNumber, right.tableNumber, "desc");
        case "total_desc":
          return compareNumber(left.totalAmount, right.totalAmount, "desc");
        case "total_asc":
          return compareNumber(left.totalAmount, right.totalAmount, "asc");
        case "status_asc":
          return compareText(left.status, right.status, "asc");
        case "placed_desc":
        default:
          return compareDate(left.createdAt, right.createdAt, "desc");
      }
    });
  }, [orderBy, orders, statusFilter, tableFilter]);

  return (
    <>
      <section className="py-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Restaurant</p>
          <h1 className="text-[clamp(2.15rem,4vw,3.5rem)] font-display italic font-normal leading-none text-foreground mt-1">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{restaurant.name}</p>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Total orders</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{summary?.totalOrderCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Pending</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{summary?.pendingOrderCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Confirmed</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{summary?.confirmedOrderCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Completed</p>
          <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{summary?.completedOrderCount ?? 0}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[1.42rem] font-display italic text-foreground">Queue</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Filter the queue, review what was ordered, and confirm status changes before they go through.
              {lastUpdated ? (
                <span className="ml-2 text-muted-foreground/60">Last updated: {lastUpdated.toLocaleTimeString()}</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-3 mb-4">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="order_table_filter">
              Filter by table name
            </label>
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="order_table_filter"
              type="text"
              placeholder="e.g. A4"
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="order_status_filter">
              Status
            </label>
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="order_status_filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="order_sort">
              Order by
            </label>
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="order_sort"
              value={orderBy}
              onChange={(event) => setOrderBy(event.target.value)}
            >
              {ORDER_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton variant="table-row" count={5} />
        ) : visibleOrders.length ? (
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm responsive-table">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Order</th>
                  <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Placed</th>
                  <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Table</th>
                  <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Items</th>
                  <th scope="col" className="text-right py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Total</th>
                  <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Status</th>
                  <th scope="col" className="text-right py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3" data-label="Order">#{order.id}</td>
                    <td className="py-3 px-3 text-muted-foreground" data-label="Placed">{formatDateTime(order.createdAt)}</td>
                    <td className="py-3 px-3" data-label="Table">{order.tableNumber}</td>
                    <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate" data-label="Items">{order.itemsSummary || "-"}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums" data-label="Total">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-3" data-label="Status">
                      <span
                        className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border uppercase tracking-wider ${
                          STATUS_STYLES[order.status] || "border-border bg-muted text-muted-foreground"
                        }`}
                        role="status"
                        aria-label={`Order status: ${order.status}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3" data-label="Action">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                              onClick={() => requestStatusUpdate(order.id, "confirmed")}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? "Updating" : "Confirm"}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                              onClick={() => requestStatusUpdate(order.id, "cancelled")}
                              disabled={updatingOrderId === order.id}
                            >
                              Cancel
                            </button>
                          </>
                        ) : null}

                        {order.status === "confirmed" ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                              onClick={() => requestStatusUpdate(order.id, "completed")}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? "Updating" : "Complete"}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                              onClick={() => requestStatusUpdate(order.id, "cancelled")}
                              disabled={updatingOrderId === order.id}
                            >
                              Cancel
                            </button>
                          </>
                        ) : null}

                        {!["pending", "confirmed"].includes(order.status) ? (
                          <span className="text-xs text-muted-foreground">No action</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 mx-auto mb-3 text-muted-foreground/30">
              <rect x="8" y="6" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="14" y1="16" x2="34" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="14" y1="23" x2="28" y2="23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M32 30l-5 5-3-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-muted-foreground">No orders match the current filter.</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={`${confirmAction?.status === "cancelled" ? "Cancel" : confirmAction?.status === "completed" ? "Complete" : "Confirm"} order?`}
        message={`Are you sure you want to ${confirmAction?.actionLabel || "update this order"}?`}
        confirmLabel={confirmAction?.status === "cancelled" ? "Cancel order" : confirmAction?.status === "completed" ? "Mark complete" : "Confirm order"}
        cancelLabel="Go back"
        variant={confirmAction?.status === "cancelled" ? "danger" : "confirm"}
        onConfirm={executeStatusUpdate}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
      />
    </>
  );
}
