import { useState, useMemo } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../lib/format.js';

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
  if (minutes === null) return 'text-neutral-400';
  if (minutes >= 15) return 'text-[#ba1a1a]';
  if (minutes >= 10) return 'text-[#F59E0B]';
  return 'text-neutral-400';
}

function orderTypeLabel(order) {
  const t = (order.table || '').toLowerCase();
  if (t.includes('takeaway')) return 'Takeaway';
  return 'Dine-in';
}

export default function OrdersView({ orders, menuItems, onAcceptOrder, onCancelOrder, onMarkServed }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState('Table 01');
  const [selectedItemIds, setSelectedItemIds] = useState({});
  const [orderType, setOrderType] = useState('Table');
  const [staffNotes, setStaffNotes] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);

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

  const handleCreateManualOrderSubmit = () => {
    const selectedItemsList = Object.keys(selectedItemIds)
      .map(id => ({ id, qty: selectedItemIds[id] }))
      .filter(entry => entry.qty > 0)
      .map(entry => {
        const item = menuItems.find((m) => m.id === entry.id);
        return {
          id: item ? item.id : null,
          name: item ? item.name : 'Custom Dish',
          quantity: entry.qty,
          customization: staffNotes || 'Staff input',
        };
      });

    if (selectedItemsList.length === 0) { toast({ type: 'warning', title: 'No items', message: 'Please select at least one menu item.' }); return; }

    const itemsTotal = selectedItemsList.reduce((acc, currentItem) => {
      const match = menuItems.find((m) => m.id === currentItem.id);
      return acc + (match ? match.price : 15) * currentItem.quantity;
    }, 0);

    const tip = parseFloat(tipAmount) || 0;
    const sc = parseFloat(serviceCharge) || 0;
    const total = itemsTotal + tip + sc;

    onAddManualOrder({
      table: orderType === 'Takeaway' ? 'Takeaway' : selectedTable,
      orderType: orderType,
      items: selectedItemsList,
      price: parseFloat(total.toFixed(2)),
      itemsTotal: parseFloat(itemsTotal.toFixed(2)),
      tip: tip,
      serviceCharge: sc,
      staffNotes: staffNotes,
      timeAgo: 'Just now',
      timestamp: Date.now(),
    });
    setSelectedItemIds({});
    setStaffNotes('');
    setTipAmount(0);
    setServiceCharge(0);
    setShowManualOrderModal(false);
  };

  return (
    <div className="space-y-6">
      <section className="sticky top-[57px] z-20 bg-[#FCFAF7] dark:bg-[#191c1d] -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-b border-[#E6DFD4] dark:border-neutral-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-1 rounded-xl shrink-0">
          {[
            { key: 'Pending', label: `Pending (${counts.pending})` },
            { key: 'Confirmed', label: `Active (${counts.confirmed})` },
            { key: 'Served', label: `Done (${counts.served})` },
          ].map((opt) => (
            <button key={opt.key} onClick={() => setFilter(opt.key)} className={`px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${filter === opt.key ? 'bg-[#2a14b4] text-white shadow-sm' : 'text-neutral-500 hover:bg-[#edeeef] dark:text-neutral-400 dark:hover:bg-neutral-800'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl font-sans text-sm focus:ring-2 focus:ring-[#4338ca] focus:border-transparent outline-none transition-all dark:text-white" />
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
              <div key={order.id} className={`border rounded-xl p-4 flex flex-col gap-2 relative ${isServed ? 'bg-[#f3f4f5] dark:bg-neutral-950 opacity-65 grayscale-[0.2] border-[#E5E7EB] dark:border-neutral-800' : isCancelled ? 'bg-rose-50/50 dark:bg-red-950/20 opacity-75 border-rose-200 dark:border-red-900' : 'bg-white dark:bg-neutral-900 border-[#E5E7EB] dark:border-neutral-800 hover:border-[#2a14b4]/40 hover:shadow-lg hover:shadow-[#4338ca]/5'}`}>
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
                  <h3 className="font-sans font-bold text-xl text-neutral-800 dark:text-neutral-100">
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
                      <p key={idx} className="font-sans text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-200">{it.quantity}x</span>
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
                      <button onClick={() => onCancelOrder(order.id)} className="py-2 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 font-sans text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer text-center">Cancel</button>
                      <button onClick={() => onAcceptOrder(order.id)} className="py-2 rounded-lg bg-[#2a14b4] text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#4338ca] transition-all cursor-pointer text-center">Accept</button>
                    </div>
                  )}
                  {isConfirmed && (
                    <button onClick={() => onMarkServed(order.id)} className="w-full py-2.5 rounded-lg bg-[#10B981] text-white font-sans text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <CheckCircle className="w-4 h-4" /><span>Served</span>
                    </button>
                  )}
                  {isCancelled && <p className="font-sans text-xs text-[#ba1a1a] text-center font-medium py-1">Order cancelled.</p>}
                </div>
              </div>
            );
          })}

          {/* Add Order button hidden — dine-in/takeaway flow TBD */}
        </div>
      </section>

      {/* Manual order modal hidden — dine-in/takeaway flow TBD */}
    </div>
  );
}
