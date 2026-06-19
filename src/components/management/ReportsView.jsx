import { formatCurrency } from '../../lib/format.js';
import StatCard from '../ui/StatCard.jsx';

export default function ReportsView({ reports, onExportCsv, timeframe, onTimeframeChange }) {
  if (!reports) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-neutral-400 text-sm">No report data available yet.</p>
      </div>
    );
  }

  const topItems = (reports.topItems || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="bg-[#edeeef] dark:bg-neutral-800 rounded-lg p-0.5 flex h-8 border border-[#E5E7EB] dark:border-neutral-700">
          {['Today', 'Week', 'Month', 'AllTime'].map((period) => (
            <button key={period} onClick={() => onTimeframeChange(period)} className={`px-3 text-xs font-sans font-medium rounded-md transition-all ${timeframe === period ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
              {period === 'AllTime' ? 'All' : period}
            </button>
          ))}
        </div>
        {onExportCsv && (
          <button onClick={onExportCsv} className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-sans font-medium cursor-pointer">
            Export
          </button>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={formatCurrency(reports.revenue || 0)} />
        <StatCard label="Orders" value={reports.totalOrders || 0} sublabel={`${reports.orders || 0} today`} />
        <StatCard label="Avg Ticket" value={formatCurrency(reports.avgTicket || 0)} />
        <StatCard label="Completed" value={`${reports.completion || 0}%`} sublabel={`${reports.completedCount || 0} orders`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-xl">
          <h3 className="font-sans font-semibold text-sm text-neutral-800 dark:text-neutral-100 mb-4">Top Items</h3>
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-[#E5E7EB]/50 dark:border-neutral-800/50 last:border-0">
                  <span className="font-mono text-xs text-neutral-300 w-4">{idx + 1}</span>
                  <p className="flex-1 font-sans text-sm text-neutral-700 dark:text-neutral-300 truncate">{item.name}</p>
                  <div className="text-right">
                    <span className="font-mono text-xs text-neutral-500 block">{item.sold} sold</span>
                    <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-neutral-400">No completed orders in this period</div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-xl">
          <h3 className="font-sans font-semibold text-sm text-neutral-800 dark:text-neutral-100 mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Pending', count: reports.pendingCount || 0 },
              { label: 'Confirmed', count: reports.confirmedCount || 0 },
              { label: 'Completed', count: reports.completedCount || 0 },
              { label: 'Cancelled', count: reports.cancelledCount || 0 },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl">
                <span className="font-mono font-semibold text-xl text-neutral-800 dark:text-neutral-100 leading-none block">{item.count}</span>
                <span className="text-[10px] font-sans font-medium text-neutral-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
