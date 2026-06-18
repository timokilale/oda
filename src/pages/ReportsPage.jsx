import useReports from "../hooks/useReports.js";
import ReportsView from "../components/management/ReportsView.jsx";

export default function ReportsPage() {
  const { reports, logs, loading, period, setPeriod, totalOrders } = useReports();

  if (!loading && totalOrders < 10) {
    return (
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
    );
  }

  return (
    <>
      {loading ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-24" />
          ))}
        </section>
      ) : (
        <ReportsView reports={reports} logs={logs} timeframe={period} onTimeframeChange={setPeriod} />
      )}
    </>
  );
}
