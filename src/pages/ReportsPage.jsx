import { useEffect, useState } from "react";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
import { useRestaurantWorkspace } from "./RestaurantLayout.jsx";

export default function ReportsPage() {
  const { restaurant } = useRestaurantWorkspace();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);

      try {
        const data = await apiRequest(`/restaurants/${restaurant.id}/reports`);
        setReports(data.reports);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [restaurant.id]);

  return (
    <WorkspaceShell
      currentSection="reports"
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <section className="page-header">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">{restaurant.name}</p>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Revenue</p>
          <p className="metric-value">{reports ? formatCurrency(reports.revenueTotal) : formatCurrency(0)}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Orders today</p>
          <p className="metric-value">{reports?.ordersToday ?? 0}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Average ticket</p>
          <p className="metric-value">{reports ? formatCurrency(reports.averageTicket) : formatCurrency(0)}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Completion</p>
          <p className="metric-value">{reports ? `${Math.round(reports.completionRate)}%` : "0%"}</p>
        </div>
      </section>

      <section className="split-layout page-section">
        <div className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Status</h2>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <p className="metric-label">Pending</p>
              <p className="metric-value">{reports?.pendingOrders ?? 0}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Confirmed</p>
              <p className="metric-value">{reports?.confirmedOrders ?? 0}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Completed</p>
              <p className="metric-value">{reports?.completedOrders ?? 0}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Cancelled</p>
              <p className="metric-value">{reports?.cancelledOrders ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Top items</h2>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <p className="empty-text">Loading reports</p>
            </div>
          ) : reports?.topItems?.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reports.topItems.map((item) => (
                  <tr key={item.name}>
                    <td data-label="Item">{item.name}</td>
                    <td data-label="Qty">{item.quantitySold}</td>
                    <td data-label="Revenue" className="mono-total">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p className="empty-text">No sales</p>
            </div>
          )}
        </div>
      </section>
    </WorkspaceShell>
  );
}
