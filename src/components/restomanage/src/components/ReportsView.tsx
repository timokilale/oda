import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  CreditCard, 
  Percent, 
  Clock, 
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  ThumbsUp,
  Activity
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ReportsViewProps {
  logs: ActivityLog[];
}

export default function ReportsView({ logs }: ReportsViewProps) {
  const [timeframe, setTimeframe] = useState<'Today' | 'Week' | 'Month' | 'AllTime'>('Today');

  // Interactive statistics dependent on selected timeframe
  const stats = useMemo(() => {
    const factor = timeframe === 'Week' ? 7 : timeframe === 'Month' ? 30 : timeframe === 'AllTime' ? 120 : 1;
    return {
      revenue: 4250000 * factor,
      orders: Math.round(184 * factor),
      avgTicket: 23100,
      completion: 94.8,
      completedCount: Math.round(124 * factor),
      pendingCount: 12,
      confirmedCount: 45,
      cancelledCount: 3
    };
  }, [timeframe]);

  // Formatted money string
  const formatCur = (num: number) => {
    return 'TZS ' + num.toLocaleString();
  };

  // Recharts Bar Data: Revenue Over Time Mon-Sun
  const barData = useMemo(() => {
    const scale = timeframe === 'Week' ? 6 : timeframe === 'Month' ? 25 : timeframe === 'AllTime' ? 85 : 1;
    return [
      { name: 'MON', value: 1.2 * scale },
      { name: 'TUE', value: 2.1 * scale },
      { name: 'WED', value: 1.8 * scale },
      { name: 'THU', value: 3.2 * scale },
      { name: 'FRI', value: 1.5 * scale },
      { name: 'SAT', value: 2.8 * scale },
      { name: 'SUN', value: 4.2 * scale },
    ];
  }, [timeframe]);

  // Recharts Pie Data: Category Breakdown
  const pieData = [
    { name: 'Beverages', value: 45, color: '#2a14b4' },
    { name: 'Mains', value: 30, color: '#5b598c' },
    { name: 'Starters', value: 25, color: '#c4c1fb' },
  ];

  const popularProducts = [
    {
      name: 'Truffle Wagyu Burger',
      category: 'Mains',
      sold: 124,
      revenue: 1800000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiu__j1Ve9suXJmSB64pBXfJWPggANsiYebEW-80OCmSiyGQo1k2b8yDYVZc8TUjzWPPesuDQ2rhMZbkhQXouZDSoPGqC9Qh5wpsZ40TVc-AxyyyTuly7cjZIXQaMczbUvw58J8gR97bczYH3RuN1RLk7K4XdC1xPXrW7yL6SaXBner1Zpe0KfGtl8nJAZesF0JT6maAISzBPrbTES0nrdM3qEyKS275AZckiTri-VmKBfHaXuLBoK0gVNrC0seAlJVwTB9HYGcqI'
    },
    {
      name: 'Greek Artisan Salad',
      category: 'Starters',
      sold: 98,
      revenue: 900000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYEW7lpuX8ovh0QAifeOxbir1opRfUtKEPYZKkTeJj3-DEdjtw19c5-5tUziFajUg_7Ngw0kAWkvSQgoAlCeQ6IYuucaL8lZFN9qclXkQ1NVbuNDngLLeuOpwEa07Yuay_mg5mNOC6uZk-B6vthUmD6sOREDaSA-xRkqh8tcP5PsOsZzgoQOnAAUk2LOkR7h-slXgkHoduzj6bt3x5zL2kjfolo9e5-XHt0p01f-3ajYnm2busuMMr5LUz5Rws3YCDWvg7BZgp3_E'
    },
    {
      name: 'Hibiscus Lime Sparkler',
      category: 'Beverages',
      sold: 82,
      revenue: 600000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX_fN4zaz9c89WnUWZI7U-eDVOJxLAm9Ep-MrLC338ykUAgvMarNPMtwUVHN2bay3iG5JDTct7gvqP25OksmZvh7GgTRQgFzFM1WpD9vWnFUy6OdSrGW2Ee9uAkza2uRXdfDMdAcaqxMaDjMyubBPYk8Z6X17MWzHG7uvCUmx7X9qwn5ByKVQ3M48CPCzzufe_5J5XKB3XlVWCPR3VLuhnOI3rysCKvMDKM1pQERp1iJyqi3_eSZAkwq9Mcuf43jZGrAi3A3aV1j8'
    },
    {
      name: 'Margherita Classica',
      category: 'Mains',
      sold: 76,
      revenue: 1200000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4kwJhJ0mlCvLP4ktsdmr4PevsDj9DZCix8kSLtQ97wCdjdAV46LmCmavo85dMavZ0zEMGx5BPVSAwpYlDxIG0s8ntS59zay_u-xSwMJLlozjHx5PK1olRHKV0CFxQHGIzLTt0L51AAWZ72JuOEcKiOZNx6OtigtYFig7OUSnCCeLOtW5kLJfajNkWtlQSQJ549jzCWBLwGhGF5NI3hg26y3YJUc6ZoEPOzR0ugB2OqNfBe9rSkcnYBkVVD-rLVtmzc3Ky4ojuGXM'
    }
  ];

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Revenue,${stats.revenue}\n`
      + `Total Orders,${stats.orders}\n`
      + `Avg Ticket,${stats.avgTicket}\n`
      + `Completion Rate,${stats.completion}%\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resto-manage-report-${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-analytics-view" className="space-y-6">
      
      {/* Header controls layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-neutral-800 dark:text-neutral-100">
            Reports & Insights Analytics
          </h2>
          <p className="font-sans text-xs text-neutral-500">
            Monitor Bistro Modern operational performance across multiple dimensional indices.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="bg-[#edeeef] dark:bg-neutral-800 rounded-xl p-1 flex h-10 border border-[#E5E7EB] dark:border-neutral-700">
            <button
              onClick={() => setTimeframe('Today')}
              className={`px-3 py-1 text-xs font-bold font-sans rounded-lg transition-all ${
                timeframe === 'Today'
                  ? 'bg-white dark:bg-neutral-700 text-[#2a14b4] dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-[#2a14b4]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('Week')}
              className={`px-3 py-1 text-xs font-bold font-sans rounded-lg transition-all ${
                timeframe === 'Week'
                  ? 'bg-white dark:bg-neutral-700 text-[#2a14b4] dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-[#2a14b4]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('Month')}
              className={`px-3 py-1 text-xs font-bold font-sans rounded-lg transition-all ${
                timeframe === 'Month'
                  ? 'bg-white dark:bg-neutral-700 text-[#2a14b4] dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-[#2a14b4]'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('AllTime')}
              className={`px-3 py-1 text-xs font-bold font-sans rounded-lg transition-all ${
                timeframe === 'AllTime'
                  ? 'bg-white dark:bg-neutral-700 text-[#2a14b4] dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-[#2a14b4]'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all font-sans text-xs font-bold active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Grid Cards of Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Revenue</span>
            <span className="text-[#10B981] flex items-center"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div>
            <span className="font-mono text-base xl:text-lg font-bold text-neutral-850 dark:text-white block mt-2">
              {formatCur(stats.revenue)}
            </span>
            <span className="font-sans text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-semibold">
              ↑ 12.5% vs yesterday
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#2a14b4] dark:text-[#c1beff]" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-neutral-850 dark:text-white block mt-2">
              {stats.orders}
            </span>
            <span className="font-sans text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-semibold">
              ↑ 8.2% vs yesterday
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">avg. Ticket</span>
            <CreditCard className="w-4 h-4 text-[#5b598c]" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-neutral-850 dark:text-white block mt-2">
              {formatCur(stats.avgTicket)}
            </span>
            <span className="font-sans text-[11px] text-[#ba1a1a] flex items-center gap-1 mt-1 font-semibold">
              ↓ 2.1% vs yesterday
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Completion rate</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-neutral-850 dark:text-white block mt-2">
              {stats.completion}%
            </span>
            <span className="font-sans text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-semibold">
              ↑ 0.5% vs yesterday
            </span>
          </div>
        </div>

      </section>

      {/* Analytics Charts section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue over time daily bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col h-96 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white">Revenue Over Time</h3>
            <span className="text-xs text-neutral-400 font-sans uppercase font-bold tracking-wider">
              {timeframe === 'Today' ? 'Hourly Breakdown' : 'Daily breakdown'}
            </span>
          </div>
          
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2a14b4" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#4338ca" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#777586" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#777586" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => timeframe === 'Today' ? `${val}M` : `${val}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#edeeef', opacity: 0.2 }}
                  contentStyle={{ 
                    backgroundColor: '#191c1d', 
                    borderRadius: '8px', 
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11px',
                    fontFamily: 'Geist'
                  }} 
                  formatter={(value) => [`${value}M TZS`, 'Revenue / Peak']}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#primaryGrad)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown pie/donut chart */}
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl flex flex-col h-96 shadow-xs">
          <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white mb-4">Category Breakdown</h3>
          
          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute flex flex-col items-center">
              <span className="font-sans font-bold text-xs uppercase text-neutral-500 tracking-wider">Volume Sales</span>
              <span className="font-sans font-bold text-neutral-850 dark:text-white text-base">By Category</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#191c1d', 
                    borderRadius: '8px', 
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11px',
                    fontFamily: 'Geist'
                  }}
                  formatter={(val) => [`${val}%`, 'Share']}
                />
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

      {/* Popular Items & Order Status Summaries */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Popular Items list */}
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white">Popular Items</h3>
            <button className="text-[#2a14b4] dark:text-[#c3c0ff] text-xs font-bold hover:underline cursor-pointer">
              View All Catalog Analytics
            </button>
          </div>

          <div className="space-y-4">
            {popularProducts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 border">
                  <img 
                    className="w-full h-full object-cover" 
                    alt={p.name} 
                    referrerPolicy="no-referrer"
                    src={p.image} 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-bold text-xs truncate text-neutral-800 dark:text-white">{p.name}</h4>
                  <span className="text-[10px] text-neutral-400 font-sans uppercase font-bold tracking-wider">{p.category}</span>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">{p.sold} sold</div>
                  <div className="text-[11px] text-[#10B981] font-bold font-mono">
                    {formatCur(p.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Summary counts with Activity Feed logs */}
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-sm text-neutral-850 dark:text-white mb-6">Order Status Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100/80 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <span className="font-mono font-bold text-lg text-neutral-800 dark:text-white leading-none block">{stats.pendingCount}</span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">Pending</span>
                </div>
              </div>

              <div className="p-3 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-[#2a14b4]" />
                </div>
                <div>
                  <span className="font-mono font-bold text-lg text-neutral-800 dark:text-white leading-none block">{stats.confirmedCount}</span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">Confirmed</span>
                </div>
              </div>

              <div className="p-3 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100/80 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <span className="font-mono font-bold text-lg text-neutral-800 dark:text-white leading-none block">{stats.completedCount}</span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">Completed</span>
                </div>
              </div>

              <div className="p-3 bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100/80 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-[#ba1a1a]" />
                </div>
                <div>
                  <span className="font-mono font-bold text-lg text-neutral-800 dark:text-white leading-none block">{stats.cancelledCount}</span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400">Cancelled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <h4 className="font-sans text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-3 flex items-center gap-1.5 leading-none">
              <Activity className="w-3.5 h-3.5 animate-pulse text-[#2a14b4]" />
              <span>Real-Time Operations logs</span>
            </h4>
            
            <div className="space-y-3">
              {logs.slice(0, 3).map((log) => (
                <div key={log.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    log.type === 'success' 
                      ? 'bg-[#10B981] animate-pulse' 
                      : log.type === 'pending' 
                      ? 'bg-[#F59E0B] animate-pulse' 
                      : 'bg-[#2a14b4] animate-pulse'
                  }`} />
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 font-sans font-medium">
                    {log.text}
                  </span>
                  <span className="text-[10px] text-neutral-400 ml-auto font-sans">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
