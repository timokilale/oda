import { useState, useMemo } from 'react';
import { Clock, Search, SlidersHorizontal, Plus, CheckCircle, RotateCcw } from 'lucide-react';

export default function OrdersView({ orders, setOrders, menuItems, onAddManualOrder, onAcceptOrder, onCancelOrder, onMarkServed, onRecallOrder }) {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState('Table 01');
  const [selectedItemIds, setSelectedItemIds] = useState({});
  const [orderType, setOrderType] = useState('Table');
  const [staffNotes, setStaffNotes] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);

  const counts = useMemo(() => ({
    all: orders.length,
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

    if (selectedItemsList.length === 0) { alert('Please select at least one menu item.'); return; }

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
      <section className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 p-1 rounded-xl">
          {[
            { key: 'All', label: `All Orders (${counts.all})` },
            { key: 'Pending', label: `Pending (${counts.pending})` },
            { key: 'Confirmed', label: `Confirmed (${counts.confirmed})` },
            { key: 'Served', label: `Served (${counts.served})` },
          ].map((opt) => (
            <button key={opt.key} onClick={() => setFilter(opt.key)} className={`px-4 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${filter === opt.key ? 'bg-[#2a14b4] text-white shadow-sm' : 'text-neutral-500 hover:bg-[#edeeef] dark:text-neutral-400 dark:hover:bg-neutral-800'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Search Order ID or Table..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl font-sans text-sm focus:ring-2 focus:ring-[#4338ca] focus:border-transparent outline-none transition-all dark:text-white" />
          </div>
          <button onClick={() => setSearchQuery('')} className="p-2 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 hover:bg-[#f3f4f5] dark:hover:bg-neutral-800 transition-all text-[#5b598c] dark:text-neutral-400"><SlidersHorizontal className="w-5 h-5" /></button>
        </div>
      </section>

      <section className="pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending';
            const isConfirmed = order.status === 'Confirmed';
            const isServed = order.status === 'Served';
            const isCancelled = order.status === 'Cancelled';

            return (
              <div key={order.id} className={`border border-[#E5E7EB] dark:border-neutral-800 rounded-xl p-4 flex flex-col gap-4 relative ${isServed ? 'bg-[#f3f4f5] dark:bg-neutral-950 opacity-65 grayscale-[0.2]' : isCancelled ? 'bg-rose-50/50 dark:bg-red-950/20 opacity-75 border-rose-200 dark:border-red-900' : 'bg-white dark:bg-neutral-900 hover:border-[#2a14b4]/40 hover:shadow-lg hover:shadow-[#4338ca]/5'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isPending ? 'text-[#F59E0B] bg-[#F59E0B]/10' : isConfirmed ? 'text-[#2a14b4] bg-[#2a14b4]/10' : isServed ? 'text-neutral-500 bg-neutral-200 dark:bg-neutral-800' : 'text-[#ba1a1a] bg-[#ba1a1a]/10'}`}>{order.status}</span>
                      <span className="font-mono text-xs text-neutral-400">{order.id}</span>
                    </div>
                    <h3 className="font-sans font-bold text-lg mt-1.5 text-neutral-800 dark:text-neutral-100">{order.table}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-base font-bold text-[#2a14b4] dark:text-[#c3c0ff]">${order.price.toFixed(2)}</span>
                    <span className="font-sans text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1"><Clock className="w-3.5 h-3.5 text-neutral-400" />{order.timeAgo}</span>
                  </div>
                </div>

                <div className="space-y-2 border-y border-[#E5E7EB] dark:border-neutral-800 py-3">
                  {isServed ? (
                    <div className="font-sans text-xs text-neutral-500 italic">Items completed & served.</div>
                  ) : (
                    order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-sans text-xs text-neutral-700 dark:text-neutral-300">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-200">{it.quantity}x {it.name}</span>
                        {it.customization && <span className="text-neutral-500 font-medium">{it.customization}</span>}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-auto">
                  {isPending && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => onCancelOrder(order.id)} className="py-2 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 font-sans text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer text-center">Cancel</button>
                      <button onClick={() => onAcceptOrder(order.id)} className="py-2 rounded-lg bg-[#2a14b4] text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#4338ca] transition-all cursor-pointer text-center">Accept Order</button>
                    </div>
                  )}
                  {isConfirmed && (
                    <div className="grid grid-cols-1">
                      <button onClick={() => onMarkServed(order.id)} className="py-2.5 rounded-lg bg-[#10B981] text-white font-sans text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <CheckCircle className="w-4 h-4" /><span>Mark as Served</span>
                      </button>
                    </div>
                  )}
                  {isServed && (
                    <button onClick={() => onRecallOrder ? onRecallOrder(order.id) : setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Pending', timeAgo: 'Just restarted' } : o))} className="w-full py-2 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 font-sans text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /><span>Recall Order</span>
                    </button>
                  )}
                  {isCancelled && <div className="font-sans text-xs text-[#ba1a1a] text-center font-medium italic py-1">Order was cancelled.</div>}
                </div>
              </div>
            );
          })}

          <button onClick={() => setShowManualOrderModal(true)} className="border-2 border-dashed border-[#E5E7EB] dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-2 bg-[#f8f9fa]/50 dark:bg-neutral-950/20 hover:bg-white dark:hover:bg-neutral-900 transition-colors cursor-pointer min-h-[220px]">
            <Plus className="w-10 h-10 text-neutral-500 dark:text-neutral-400" />
            <span className="font-sans text-xs font-bold uppercase tracking-wide">Create Manual Order</span>
          </button>
        </div>
      </section>

      {showManualOrderModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-neutral-800 pb-3">
              <h3 className="font-sans text-lg font-bold text-neutral-850 dark:text-white">Create Manual Staff Order</h3>
              <button onClick={() => setShowManualOrderModal(false)} className="text-neutral-400 hover:text-neutral-600 font-sans text-lg font-bold">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="font-sans text-xs text-neutral-500">Staff can place manual order on behalf of tables or takeaways.</div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Order Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOrderType('Table')} className={`py-2 rounded-lg font-sans text-xs font-bold border transition-all ${orderType === 'Table' ? 'border-[#2a14b4] bg-[#2a14b4]/10 text-[#2a14b4]' : 'border-neutral-200 text-neutral-500'}`}>Table Service</button>
                  <button onClick={() => setOrderType('Takeaway')} className={`py-2 rounded-lg font-sans text-xs font-bold border transition-all ${orderType === 'Takeaway' ? 'border-[#2a14b4] bg-[#2a14b4]/10 text-[#2a14b4]' : 'border-neutral-200 text-neutral-500'}`}>Takeaway</button>
                </div>
              </div>
              {orderType === 'Table' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Select Table</label>
                  <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-xl text-sm focus:ring-1 focus:ring-[#4338ca] outline-none dark:text-white">
                    {['Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 12', 'Table 18'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Menu Selections</label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl p-2 bg-[#f3f4f5]/50 dark:bg-neutral-900">
                  {menuItems.filter(m => m.status === 'Available').map((item) => {
                    const count = selectedItemIds[item.id] || 0;
                    return (
                      <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-neutral-100 last:border-b-0">
                        <div>
                          <span className="text-xs font-sans font-bold text-neutral-800 dark:text-neutral-100">{item.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400 block">${item.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedItemIds(prev => ({ ...prev, [item.id]: Math.max(0, count - 1) }))} className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-white flex items-center justify-center text-xs font-bold">-</button>
                          <span className="text-xs font-mono w-4 text-center font-bold dark:text-white">{count}</span>
                          <button onClick={() => setSelectedItemIds(prev => ({ ...prev, [item.id]: count + 1 }))} className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-white flex items-center justify-center text-xs font-bold">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Staff Notes (optional)</label>
                <input type="text" value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} placeholder="e.g. Extra napkins, no ice..." className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-xl text-sm focus:ring-1 focus:ring-[#4338ca] outline-none dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Tip (optional)</label>
                  <input type="number" min="0" step="0.01" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0.00" className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-xl text-sm focus:ring-1 focus:ring-[#4338ca] outline-none dark:text-white font-mono text-right" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Service Charge (optional)</label>
                  <input type="number" min="0" step="0.01" value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} placeholder="0.00" className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-xl text-sm focus:ring-1 focus:ring-[#4338ca] outline-none dark:text-white font-mono text-right" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E7EB] dark:border-neutral-800">
              <button onClick={() => setShowManualOrderModal(false)} className="py-2.5 font-sans text-xs font-bold text-neutral-500 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all">Cancel</button>
              <button onClick={handleCreateManualOrderSubmit} className="py-2.5 font-sans text-xs font-bold text-white bg-[#2a14b4] rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5"><span>Place Order</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
