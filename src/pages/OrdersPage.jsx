import { useEffect, useState } from "react";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { apiRequest } from "../lib/api.js";
import { formatCurrency, formatDateTime } from "../lib/format.js";
import { useRestaurantWorkspace } from "./RestaurantLayout.jsx";

export default function OrdersPage() {
  const { restaurant, refreshWorkspace } = useRestaurantWorkspace();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [statusFilter, setStatusFilter] = useState("open");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  async function loadOrders() {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/orders`);
      setOrders(data.orders);
      setSummary(data.orderSummary);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [restaurant.id]);

  async function updateStatus(orderId, status) {
    const actionLabel =
      status === "confirmed"
        ? "confirm this order"
        : status === "completed"
          ? "mark this order as completed"
          : "cancel this order";

    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) {
      return;
    }

    setFlash(null);
    setUpdatingOrderId(orderId);

    try {
      await apiRequest(`/restaurants/${restaurant.id}/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status },
      });
      setFlash({ type: "success", message: "Order updated" });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const visibleOrders = orders.filter((order) => {
    if (statusFilter === "all") {
      return true;
    }

    if (statusFilter === "open") {
      return ["pending", "confirmed"].includes(order.status);
    }

    return order.status === statusFilter;
  });

  return (
    <WorkspaceShell
      currentSection="orders"
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
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
            </p>
          </div>
          <div className="inline-actions segmented-control" role="tablist" aria-label="Order filter">
            {[
              { id: "open", label: "Open" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Confirmed" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
              { id: "all", label: "All" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`button button-segment${statusFilter === option.id ? " is-active" : ""}`}
                onClick={() => setStatusFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p className="empty-text">Loading order queue...</p>
          </div>
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
                    <span className="status-pill">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </td>
                  <td data-label="Action">
                    <div className="inline-actions">
                      {order.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            className="button button-confirm"
                            onClick={() => updateStatus(order.id, "confirmed")}
                            disabled={updatingOrderId === order.id}
                          >
                            {updatingOrderId === order.id ? "Updating" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => updateStatus(order.id, "cancelled")}
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
                            onClick={() => updateStatus(order.id, "completed")}
                            disabled={updatingOrderId === order.id}
                          >
                            {updatingOrderId === order.id ? "Updating" : "Complete"}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => updateStatus(order.id, "cancelled")}
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
    </WorkspaceShell>
  );
}
