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

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Restaurant</p>
          <h1 className="text-[clamp(2.15rem,4vw,3.5rem)] font-display italic font-normal leading-none text-foreground mt-1">
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{restaurant.name}</p>
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
          <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Revenue</p>
              <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">
                {reports ? formatCurrency(reports.revenueTotal) : formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Orders today</p>
              <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{reports?.ordersToday ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Average ticket</p>
              <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">
                {reports ? formatCurrency(reports.averageTicket) : formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Completion</p>
              <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">
                {reports ? `${Math.round(reports.completionRate)}%` : "0%"}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-[320px_1fr] gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="text-[1.42rem] font-display italic text-foreground">Status breakdown</h2>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Pending</p>
                  <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{reports?.pendingOrders ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Confirmed</p>
                  <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{reports?.confirmedOrders ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Completed</p>
                  <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{reports?.completedOrders ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Cancelled</p>
                  <p className="text-[2.1rem] font-display font-normal text-foreground mt-1">{reports?.cancelledOrders ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="text-[1.42rem] font-display italic text-foreground">Top items</h2>
              </div>

              {reports?.topItems?.length ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm responsive-table">
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Item</th>
                        <th scope="col" className="text-right py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Qty</th>
                        <th scope="col" className="text-right py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.topItems.map((item, idx) => (
                        <tr key={`${item.name}-${idx}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3" data-label="Item">{item.name}</td>
                          <td className="py-3 px-3 text-right" data-label="Qty">{item.quantitySold}</td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums" data-label="Revenue">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 mx-auto mb-3 text-muted-foreground/30">
                    <rect x="6" y="28" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="20" y="18" width="8" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="34" y="8" width="8" height="34" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <line x1="6" y1="42" x2="42" y2="42" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-muted-foreground">No completed orders in this period</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
