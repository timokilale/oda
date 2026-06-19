import { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../lib/format.js';

export default function MenuView({ menuItems, setMenuItems, onAddItem, onDeleteItem, settingsIncomplete }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Main dishes');
  const [formDescription, setFormDescription] = useState('');

  const categories = useMemo(() => {
    const set = new Set(menuItems.map(m => m.category).filter(Boolean));
    return ['All', ...set];
  }, [menuItems]);

  const handleOpenAdd = () => {
    setEditingItemId(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('Main dishes');
    setFormDescription('');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormPrice(item.price.toFixed(2));
    setFormCategory(item.category);
    setFormDescription(item.description);
    setIsEditorOpen(true);
  };

  const handleDeleteItem = (itemId) => {
    if (onDeleteItem) {
      onDeleteItem(itemId);
    } else {
      setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
    }
    toast({ type: 'success', title: 'Deleted', message: 'Menu item has been removed.' });
  };

  const handleSaveItemSubmit = async () => {
    if (!formName.trim()) { toast({ type: 'warning', title: 'Validation', message: 'Item name cannot be empty.' }); return; }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) { toast({ type: 'warning', title: 'Validation', message: 'Please enter a valid price.' }); return; }

    const itemData = {
      id: editingItemId || ('menu-' + Math.floor(Math.random() * 10000)),
      name: formName.trim(),
      price: priceNum,
      category: formCategory,
      description: formDescription.trim(),
    };

    if (editingItemId) {
      setMenuItems((prev) => prev.map((m) => m.id === editingItemId ? { ...m, ...itemData } : m));
    } else {
      onAddItem(itemData);
    }
    setIsEditorOpen(false);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeTab !== 'All' && item.category !== activeTab) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleOpenAdd} disabled={settingsIncomplete} className="bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 px-4 py-2 rounded-lg font-sans text-xs font-medium hover:opacity-80 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title={settingsIncomplete ? 'Fill in restaurant settings first' : ''}>
          Add Item
        </button>
      </div>

      <div className="sticky top-[57px] z-10 bg-[#f5f3f0] pb-3 -mx-4 px-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[#E5E7EB] dark:border-neutral-800 p-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex gap-1 bg-[#f3f4f5] dark:bg-neutral-850 p-0.5 rounded-lg w-full md:w-auto overflow-x-auto">
            {categories.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md transition-all font-sans text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>{tab}</button>
            ))}
          </div>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-72 px-3 py-1.5 bg-[#f3f4f5] dark:bg-neutral-850 border-transparent rounded-md focus:ring-1 focus:ring-neutral-400 outline-none text-xs dark:text-neutral-100" />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[#E5E7EB] dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-neutral-800">
                <th className="px-5 py-3 font-sans text-[10px] font-medium text-neutral-400">Item</th>
                <th className="px-5 py-3 font-sans text-[10px] font-medium text-neutral-400">Category</th>
                <th className="px-5 py-3 font-sans text-[10px] font-medium text-neutral-400">Price</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-neutral-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/10 transition-colors group cursor-pointer" onClick={() => handleOpenEdit(item)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                          <img className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" src={item.image} />
                        </div>
                      ) : null}
                      <div>
                        <p className="font-sans text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.name}</p>
                        {item.description && (
                          <p className="font-sans text-xs text-neutral-500 line-clamp-1 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-sans text-xs text-neutral-500">{item.category}</td>
                  <td className="px-5 py-3 font-mono text-sm font-medium text-neutral-800 dark:text-neutral-100">{formatCurrency(item.price)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="px-2 py-1 text-xs font-sans text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 bg-neutral-950/20 z-50 flex justify-end">
          <div className="absolute inset-0" onClick={() => setIsEditorOpen(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 h-full flex flex-col justify-between z-10 border-l border-[#E5E7EB] dark:border-neutral-800">
            <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-neutral-800 flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold text-neutral-800 dark:text-neutral-100">{editingItemId ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 hover:bg-neutral-100 rounded transition-colors cursor-pointer text-neutral-400 hover:text-neutral-600 text-sm font-sans">
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Grilled Chicken" className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-sm dark:text-neutral-100" />
                </div>
                <div className="col-span-4">
                  <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Price</label>
                  <input type="text" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" className="w-full font-mono bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-sm dark:text-neutral-100 text-right" />
                </div>
              </div>

              <section>
                <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Category</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-neutral-400 dark:text-neutral-100">
                  {['Main dishes', 'Starters', 'Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks', 'Sides', 'Specials', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </section>

              <section>
                <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Description</label>
                <textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of the item..." className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-sm dark:text-neutral-100" />
              </section>
            </div>

            <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-neutral-800 flex items-center gap-3 bg-white dark:bg-neutral-900">
              <button onClick={() => setIsEditorOpen(false)} className="flex-1 py-2 border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-sans text-xs font-medium rounded-lg hover:bg-neutral-50 transition-all cursor-pointer text-center">Cancel</button>
              <button onClick={handleSaveItemSubmit} className="flex-1 py-2 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-sans text-xs font-medium rounded-lg hover:opacity-80 transition-all cursor-pointer text-center">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
