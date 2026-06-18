import { useCallback, useEffect, useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import ReportsView from "../components/management/ReportsView.jsx";
import { transformApiReportsToView } from "../types/managementTypes.js";

const PERIOD_MAP = {
  today: 'Today',
  week: 'Week',
  month: 'Month',
  all: 'AllTime',
};

const PERIOD_REVERSE = {
  Today: 'today',
  Week: 'week',
  Month: 'month',
  AllTime: 'all',
};

export default function ReportsPage() {
  const { restaurant, setFlash } = useRestaurantWorkspace();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("Today");

  usePageTitle(`Reports - ${restaurant.name}`);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const apiPeriod = PERIOD_REVERSE[period];
      const params = apiPeriod !== 'all' ? `?period=${apiPeriod}` : '';
      const data = await apiRequest(`/restaurants/${restaurant.id}/reports${params}`);
      setReports(transformApiReportsToView(data.reports));
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [period, restaurant.id, setFlash]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const totalOrders = (reports?.pendingCount || 0) + (reports?.confirmedCount || 0) + (reports?.completedCount || 0);

  if (!loading && totalOrders < 10) {
    return (
      <>
        <section className="flex items-start justify-between gap-4 py-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">Reports</h1>
            <p className="text-sm text-muted-foreground mt-2">Insights appear after 10 orders</p>
          </div>
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
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Reports unlock after 10 completed orders.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">Reports</h1>
        </div>
      </section>

      {loading ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-24" />)}
        </section>
      ) : (
        <ReportsView
          reports={reports}
          logs={[]}
          timeframe={period}
          onTimeframeChange={setPeriod}
        />
      )}
    </>
  );
}
