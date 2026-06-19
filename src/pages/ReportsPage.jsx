import useReports from "../hooks/useReports.js";
import ReportsView from "../components/management/ReportsView.jsx";

export default function ReportsPage() {
  const { reports, loading, period, setPeriod } = useReports();

  return (
    <>
      {loading ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-24" />
          ))}
        </section>
      ) : (
        <ReportsView reports={reports} timeframe={period} onTimeframeChange={setPeriod} />
      )}
    </>
  );
}
