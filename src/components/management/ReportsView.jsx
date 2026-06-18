import { useState, useMemo } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, CreditCard, Percent, Download, CheckCircle, AlertCircle, XCircle, ThumbsUp, Activity } from 'lucide-react';
import { formatCurrency } from '../../lib/format.js';

export default function ReportsView({ reports, logs, onExportCsv, timeframe, onTimeframeChange }) {
  if (!reports) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm">No report data available yet.</p>
      </div>
    );
  }

  const CHART_COLORS = ['#2a14b4', '#5b598c', '#c4c1fb', '#10B981', '#F59E0B', '#ba1a1a'];

  const pieData = useMemo(() => {
    const items = reports.topItems || [];
    const catTotals = {};
    items.forEach((item) => {
      const cat = item.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + (item.revenue || 0);
    });
    const entries = Object.entries(catTotals);
    if (entries.length === 0) return [];
    const total = entries.reduce((s, [, v]) => s + v, 0);
    return entries.map(([name, value], idx) => ({
      name,
      value: Math.round((value / total) * 100),
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [reports.topItems]);

  const popularProducts = (reports.topItems || []).map((item, idx) => ({
    name: item.name,
    category: item.category || '',
    sold: item.sold || 0,
    revenue: item.revenue || 0,
    image: null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div />
        <div className="flex items-center gap-3">
          <div className="bg-[#edeeef] dark:bg-neutral-800 rounded-xl p-1 flex h-10 border border-[#E5E7EB] dark:border-neutral-700">
            {['Today', 'Week', 'Month', 'AllTime'].map((period) => (
              <button key={period} onClick={() => onTimeframeChange(period)} className={`px-3 py-1 text-xs font-bold font-sans rounded-lg transition-all ${timeframe === period ? 'bg-white dark:bg-neutral-700 text-[#2a14b4] dark:text-white shadow-xs' : 'text-neutral-500 hover:text-[#2a14b4]'}`}>
                {period === 'AllTime' ? 'All' : period === 'Week' ? 'Week' : period === 'Month' ? 'Month' : 'Today'}
              </button>
            ))}
          </div>
          {onExportCsv && (
            <button onClick={onExportCsv} className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all font-sans text-xs font-bold active:scale-95 cursor-pointer">
              <Download className="w-4 h-4" /><span>Export</span>
            </button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Revenue</span>
            <span className="text-[#10B981]"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div>
            <span className="font-mono text-base xl:text-lg font-bold text-neutral-850 dark:text-white block mt-2">{formatCurrency(reports.revenue || 0)}</span>
            <span className="font-sans text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-semibold">↑ vs last</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#2a14b4]" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-neutral-850 dark:text-white block mt-2">{reports.orders || 0}</span>
            <span className="font-sans text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-semibold">↑ vs last period</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Avg Ticket</span>
            <CreditCard className="w-4 h-4 text-[#5b598c]" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-neutral-850 dark:text-white block mt-2">{formatCurrency(reports.avgTicket || 0)}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Completion</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-neutral-850 dark:text-white block mt-2">{reports.completion || 0}%</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white">Revenue</h3>
            <span className="text-xs text-neutral-400 font-sans uppercase font-bold tracking-wider">{timeframe === 'Today' ? 'Today' : timeframe === 'AllTime' ? 'All' : timeframe}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl">
              <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Revenue</span>
              <p className="font-mono text-2xl font-bold text-[#2a14b4] dark:text-[#c3c0ff] mt-1">{formatCurrency(reports.revenue || 0)}</p>
            </div>
            <div className="p-4 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl">
              <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Orders</span>
              <p className="font-mono text-2xl font-bold text-neutral-850 dark:text-white mt-1">{reports.orders || 0}</p>
            </div>
            <div className="p-4 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl">
              <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg. Ticket</span>
              <p className="font-mono text-2xl font-bold text-[#5b598c] dark:text-neutral-300 mt-1">{formatCurrency(reports.avgTicket || 0)}</p>
            </div>
            <div className="p-4 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl">
              <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Completion Rate</span>
              <p className="font-mono text-2xl font-bold text-[#10B981] mt-1">{reports.completion || 0}%</p>
            </div>
          </div>
          <p className="font-sans text-[11px] text-neutral-400 mt-4 text-center border-t border-[#E5E7EB] dark:border-neutral-800 pt-3">Daily chart coming soon</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col h-96 shadow-xs">
          <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white mb-4">Categories</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute flex flex-col items-center">
              <span className="font-sans font-bold text-neutral-850 dark:text-white text-base">By Category</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#191c1d', borderRadius: '8px', color: '#ffffff', border: 'none', fontSize: '11px' }} formatter={(val) => [`${val}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3 flex flex-col font-sans text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white">Popular</h3>
          </div>
          <div className="space-y-4">
            {popularProducts.length > 0 ? popularProducts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 border"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-bold text-xs truncate text-neutral-800 dark:text-white">{p.name}</h4>
                  <span className="text-[10px] text-neutral-400 font-sans uppercase font-bold tracking-wider">{p.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">{p.sold} sold</div>
                  <div className="text-[11px] text-[#10B981] font-bold font-mono">{formatCurrency(p.revenue)}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-sm text-neutral-400">No completed orders in this period</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white mb-6">Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Pending', count: reports.pendingCount || 0, icon: AlertCircle, color: 'amber', bg: 'amber-100/80' },
                { label: 'Confirmed', count: reports.confirmedCount || 0, icon: ThumbsUp, color: '[#2a14b4]', bg: '[#EEF2FF]' },
                { label: 'Completed', count: reports.completedCount || 0, icon: CheckCircle, color: 'emerald', bg: 'emerald-100/80' },
                { label: 'Cancelled', count: reports.cancelledCount || 0, icon: XCircle, color: '[#ba1a1a]', bg: 'red-100/80' },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 text-${item.color}`} />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-lg text-neutral-800 dark:text-white leading-none block">{item.count}</span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {logs && logs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <h4 className="font-sans text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-3 flex items-center gap-1.5 leading-none">
                <Activity className="w-3.5 h-3.5 animate-pulse text-[#2a14b4]" />
                <span>Activity</span>
              </h4>
              <div className="space-y-3">
                {logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${log.type === 'success' ? 'bg-[#10B981] animate-pulse' : log.type === 'pending' ? 'bg-[#F59E0B] animate-pulse' : log.type === 'error' ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[#2a14b4] animate-pulse'}`} />
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 font-sans font-medium">{log.text}</span>
                    <span className="text-[10px] text-neutral-400 ml-auto font-sans">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
