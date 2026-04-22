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

function statusPillClass(status) {
  return `status-pill status-pill--${status}`;
}

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
      <section className="page-header">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{restaurant.name}</p>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Total orders</p>
          <p className="metric-value">{summary?.totalOrderCount ?? 0}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending</p>
          <p className="metric-value">{summary?.pendingOrderCount ?? 0}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Confirmed</p>
          <p className="metric-value">{summary?.confirmedOrderCount ?? 0}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Completed</p>
          <p className="metric-value">{summary?.completedOrderCount ?? 0}</p>
        </div>
      </section>

      <section className="surface panel page-section">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Queue</h2>
            <p className="field-help">
              Filter the queue, review what was ordered, and confirm status changes before they go through.
              {lastUpdated ? (
                <span className="inline-note">Last updated: {lastUpdated.toLocaleTimeString()}</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="field-group filter-bar__field filter-bar__field--grow">
            <label className="field-label" htmlFor="order_table_filter">
              Filter by table name
            </label>
            <input
              className="field-control"
              id="order_table_filter"
              type="text"
              placeholder="e.g. A4"
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
            />
          </div>

          <div className="field-group filter-bar__field">
            <label className="field-label" htmlFor="order_status_filter">
              Status
            </label>
            <select
              className="field-control"
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

          <div className="field-group filter-bar__field">
            <label className="field-label" htmlFor="order_sort">
              Order by
            </label>
            <select
              className="field-control"
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
          <table className="data-table responsive-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Table</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">#{order.id}</td>
                  <td data-label="Placed">{formatDateTime(order.createdAt)}</td>
                  <td data-label="Table">{order.tableNumber}</td>
                  <td data-label="Items">{order.itemsSummary || "-"}</td>
                  <td data-label="Total" className="mono-total">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td data-label="Status">
                    <span
                      className={statusPillClass(order.status)}
                      role="status"
                      aria-label={`Order status: ${order.status}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td data-label="Action">
                    <div className="inline-actions">
                      {order.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            className="button button-confirm"
                            onClick={() => requestStatusUpdate(order.id, "confirmed")}
                            disabled={updatingOrderId === order.id}
                          >
                            {updatingOrderId === order.id ? "Updating" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
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
                            className="button button-confirm"
                            onClick={() => requestStatusUpdate(order.id, "completed")}
                            disabled={updatingOrderId === order.id}
                          >
                            {updatingOrderId === order.id ? "Updating" : "Complete"}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => requestStatusUpdate(order.id, "cancelled")}
                            disabled={updatingOrderId === order.id}
                          >
                            Cancel
                          </button>
                        </>
                      ) : null}

                      {!["pending", "confirmed"].includes(order.status) ? (
                        <span className="muted-text">No action</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No orders match the current filter.</p>
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
