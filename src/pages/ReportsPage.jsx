import { useCallback, useEffect, useState } from "react";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import SegmentedControl from "../components/SegmentedControl.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export default function ReportsPage() {
  const { restaurant, setFlash } = useRestaurantWorkspace();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  usePageTitle(`Reports - ${restaurant.name}`);

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const params = period !== "all" ? `?period=${period}` : "";
      const data = await apiRequest(`/restaurants/${restaurant.id}/reports${params}`);
      setReports(data.reports);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [period, restaurant.id, setFlash]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalOrders = reports?.pendingOrders + reports?.confirmedOrders + reports?.completedOrders || 0;

  if (!loading && totalOrders < 10) {
    return (
      <>
        <section className="flex items-start justify-between gap-4 py-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
              Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Insights appear after 10 orders</p>
          </div>
          <SegmentedControl
            label="Report period"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-muted-foreground/50">
              <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="17" y="4" width="4" height="17" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Not enough data yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Reports unlock after 10 completed orders.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
            Reports
          </h1>
        </div>
        <SegmentedControl
          label="Report period"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
        />
      </section>

      {loading ? (
        <section>
          <LoadingSkeleton variant="metric" count={4} />
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Revenue</p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                {reports ? formatCurrency(reports.revenueTotal) : formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Orders</p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{reports?.ordersToday ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Avg. ticket</p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                {reports ? formatCurrency(reports.averageTicket) : formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Completion</p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                {reports ? `${Math.round(reports.completionRate)}%` : "0%"}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">Status breakdown</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{reports?.pendingOrders ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{reports?.confirmedOrders ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{reports?.completedOrders ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{reports?.cancelledOrders ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">Top items</h2>
              </div>

              {reports?.topItems?.length ? (
                <div className="grid gap-2">
                  {reports.topItems.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">x{item.quantitySold}</span>
                        <span className="font-semibold tabular-nums text-foreground">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No completed orders in this period
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
