import { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../lib/format.js';
import { RotateCcw } from 'lucide-react';

function elapsedMinutes(timestamp) {
  if (!timestamp) return null;
  return Math.floor((Date.now() - timestamp) / 60000);
}

function elapsedLabel(minutes) {
  if (minutes === null) return '';
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h ago`;
  return `${h}h ${m}m ago`;
}

function urgencyColor(minutes) {
  if (minutes === null) return 'text-neutral-300';
  if (minutes >= 15) return 'text-neutral-500';
  if (minutes >= 10) return 'text-neutral-400';
  return 'text-neutral-300';
}

function orderTypeLabel(order) {
  const t = (order.table || '').toLowerCase();
  if (t.includes('takeaway')) return 'Takeaway';
  return 'Dine-in';
}

export default function OrdersView({ orders, onRefresh, onAcceptOrder, onCancelOrder, onMarkServed }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'Pending').length,
    confirmed: orders.filter((o) => o.status === 'Confirmed').length,
    served: orders.filter((o) => o.status === 'Served').length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter !== 'All' && order.status !== filter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return order.id.toLowerCase().includes(q) || order.table.toLowerCase().includes(q) ||
          order.items.some(it => it.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [orders, filter, searchQuery]);

  return (
    <div className="space-y-6">
      <section className="sticky top-[57px] z-20 bg-[#FCFAF7] dark:bg-[#191c1d] -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-b border-[#E6DFD4] dark:border-neutral-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-0.5 rounded-lg">
          {[
            { key: 'Pending', label: `Pending (${counts.pending})` },
            { key: 'Confirmed', label: `Active (${counts.confirmed})` },
            { key: 'Served', label: `Done (${counts.served})` },
          ].map((opt) => (
            <button key={opt.key} onClick={() => setFilter(opt.key)} className={`px-3 py-1.5 rounded-md font-sans text-xs font-medium transition-all ${filter === opt.key ? 'bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 sm:w-64 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-lg font-sans text-xs focus:ring-1 focus:ring-neutral-400 outline-none transition-all dark:text-neutral-100" />
          <button onClick={onRefresh} className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer" title="Refresh orders">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending';
            const isConfirmed = order.status === 'Confirmed';
            const isServed = order.status === 'Served';
            const isCancelled = order.status === 'Cancelled';
            const mins = elapsedMinutes(order.timestamp);
            const items = order.items || [];
            const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);
            const hasItems = items.length > 0;
            const hasNotes = items.some(it => it.customization && it.customization !== 'Staff input');

            return (
              <div key={order.id} className={`border rounded-lg p-4 flex flex-col gap-2 ${isServed ? 'bg-neutral-50 dark:bg-neutral-950 opacity-60 border-neutral-200 dark:border-neutral-800' : isCancelled ? 'bg-neutral-50 dark:bg-neutral-950 opacity-60 border-neutral-200 dark:border-neutral-800' : 'bg-white dark:bg-neutral-900 border-[#E5E7EB] dark:border-neutral-800'}`}>
                <div className="flex items-center justify-between text-[11px] font-sans text-neutral-400">
                  <span>{order.id}</span>
                  <div className="flex items-center gap-2">
                    <span>{orderTypeLabel(order)}</span>
                    <span className={`font-medium ${urgencyColor(mins)}`}>
                      {elapsedLabel(mins)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {order.table}
                  </h3>
                  <p className="font-sans text-xs text-neutral-500 mt-0.5">
                    {hasItems ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'} \u00B7 ` : ''}{formatCurrency(order.price)}
                  </p>
                </div>

                <div className="border-t border-[#E5E7EB] dark:border-neutral-800 py-2.5 space-y-1.5 min-h-[2rem]">
                  {isServed ? (
                    <p className="font-sans text-xs text-neutral-400 italic">All items served.</p>
                  ) : hasItems ? (
                    items.map((it, idx) => (
                      <p key={idx} className="font-sans text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{it.quantity}x</span>
                        {' '}{it.name}
                      </p>
                    ))
                  ) : (
                    <p className="font-sans text-xs text-neutral-400 italic">Items not loaded.</p>
                  )}
                  {hasNotes && !isServed && (
                    <div className="pt-1 space-y-1">
                      {items.filter(it => it.customization && it.customization !== 'Staff input').map((it, idx) => (
                        <p key={idx} className="font-sans text-[11px] text-neutral-500 leading-relaxed">
                          {it.customization}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-[#E5E7EB] dark:border-neutral-800 pt-3">
                  {isPending && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => onCancelOrder(order.id)} className="py-2 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-sans text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer text-center">Cancel</button>
                      <button onClick={() => onAcceptOrder(order.id)} className="py-2 rounded-lg bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-sans text-xs font-medium hover:opacity-80 transition-all cursor-pointer text-center">Accept</button>
                    </div>
                  )}
                  {isConfirmed && (
                    <button onClick={() => onMarkServed(order.id)} className="w-full py-2 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-sans text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer">
                      Mark Served
                    </button>
                  )}
                  {isCancelled && <p className="font-sans text-xs text-neutral-500 text-center py-1">Order cancelled.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
