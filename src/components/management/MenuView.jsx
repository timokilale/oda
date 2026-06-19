import { useState, useMemo } from 'react';
import {
  Plus, Search, MoreVertical, Trash2, Flame, Clock, Sparkles,
  Leaf, CheckCircle, X, FileEdit, FolderMinus, Utensils,
} from 'lucide-react';
import { IMAGE_PRESETS, BADGE_OPTIONS } from '../../types/managementTypes.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatCard from '../ui/StatCard.jsx';
import { formatCurrency } from '../../lib/format.js';

export default function MenuView({ menuItems, setMenuItems, onAddItem, onDeleteItem }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState('list');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('24.00');
  const [formCategory, setFormCategory] = useState('Mains');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formBadges, setFormBadges] = useState(['Popular']);
  const [formIngredients, setFormIngredients] = useState('');
  const [formCalories, setFormCalories] = useState('400');
  const [formPrepTime, setFormPrepTime] = useState('15');
  const [formSpiciness, setFormSpiciness] = useState(0);
  const [formAvailable, setFormAvailable] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const activeCount = useMemo(() => menuItems.filter(m => m.status === 'Available').length, [menuItems]);

  const avgPrepTime = useMemo(() => {
    const available = menuItems.filter(m => m.status === 'Available');
    if (available.length === 0) return 0;
    return parseFloat((available.reduce((acc, c) => acc + c.prepTime, 0) / available.length).toFixed(1));
  }, [menuItems]);

  const topCategory = useMemo(() => {
    const counts = {};
    menuItems.forEach((m) => { counts[m.category] = (counts[m.category] || 0) + 1; });
    let maxCat = 'Mains', maxVal = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > maxVal) { maxVal = val; maxCat = cat; }
    });
    return maxCat;
  }, [menuItems]);

  const handleOpenAdd = () => {
    setEditingItemId(null);
    setFormName(''); setFormPrice('15.00'); setFormCategory('Mains');
    setFormDescription(''); setFormImage(IMAGE_PRESETS[1].url);
    setFormBadges(['Popular']); setFormIngredients(''); setFormCalories('400');
    setFormPrepTime('15'); setFormSpiciness(0); setFormAvailable(true);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItemId(item.id);
    setFormName(item.name); setFormPrice(item.price.toFixed(2));
    setFormCategory(item.category); setFormDescription(item.description);
    setFormImage(item.image); setFormBadges(item.badges);
    setFormIngredients(item.ingredients); setFormCalories(String(item.calories));
    setFormPrepTime(String(item.prepTime)); setFormSpiciness(item.spiciness);
    setFormAvailable(item.status === 'Available');
    setOpenDropdownId(null);
    setIsEditorOpen(true);
  };

  const handleDeleteItem = (itemId) => {
    if (onDeleteItem) {
      onDeleteItem(itemId);
    } else {
      setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
    }
    setOpenDropdownId(null);
    toast({ type: 'success', title: 'Deleted', message: 'Menu item has been removed.' });
  };

  const handleToggleBadge = (badge) => {
    setFormBadges((prev) => prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]);
  };

  const handleSaveItemSubmit = async () => {
    if (!formName.trim()) { toast({ type: 'warning', title: 'Validation', message: 'Item name cannot be empty.' }); return; }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) { toast({ type: 'warning', title: 'Validation', message: 'Please enter a valid price.' }); return; }

    const itemData = {
      id: editingItemId || ('menu-' + Math.floor(Math.random() * 10000)),
      name: formName,
      price: priceNum,
      category: formCategory,
      description: formDescription,
      image: formImage,
      badges: formBadges,
      ingredients: formIngredients,
      calories: parseInt(formCalories) || 400,
      prepTime: parseInt(formPrepTime) || 15,
      spiciness: formSpiciness,
      status: formAvailable ? 'Available' : 'Archived',
      metrics: { label: 'High Margin', value: 85, color: 'success' },
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
      if (activeTab === 'Available' && item.status !== 'Available') return false;
      if (activeTab === 'Archived' && item.status !== 'Archived') return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) ||
          item.badges.some((b) => b.toLowerCase().includes(q));
      }
      return true;
    });
  }, [menuItems, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div />
        <div className="flex items-center gap-2">
          <div className="bg-[#edeeef] dark:bg-neutral-800 rounded-lg p-1 flex gap-1">
            <button onClick={() => setViewStyle('list')} className={`px-3 py-1.5 rounded-md font-sans text-xs font-bold transition-all ${viewStyle === 'list' ? 'bg-white shadow-xs text-neutral-800' : 'text-neutral-500'}`}>List</button>
            <button onClick={() => setViewStyle('grid')} className={`px-3 py-1.5 rounded-md font-sans text-xs font-bold transition-all ${viewStyle === 'grid' ? 'bg-white shadow-xs text-neutral-800' : 'text-neutral-500'}`}>Grid</button>
          </div>
          <button onClick={handleOpenAdd} className="bg-[#2a14b4] text-white px-5 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-md">
            <Plus className="w-4 h-4" /><span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[#E5E7EB] dark:border-neutral-800 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-1 bg-[#f3f4f5] dark:bg-neutral-850 p-1 rounded-xl w-full md:w-auto">
          {['All', 'Available', 'Archived'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 md:flex-none px-6 py-2 rounded-lg transition-all font-sans text-xs font-bold uppercase tracking-wider ${activeTab === tab ? 'bg-white dark:bg-neutral-800 text-[#2a14b4] dark:text-white shadow-xs' : 'text-neutral-500 hover:bg-white/50'}`}>{tab}</button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] dark:bg-neutral-850 border-transparent rounded-lg focus:ring-2 focus:ring-[#4338ca] outline-none text-xs dark:text-white" />
        </div>
      </div>

      {viewStyle === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} onClick={() => handleOpenEdit(item)} className={`bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between ${item.status === 'Archived' ? 'opacity-70 grayscale-[0.2]' : ''}`}>
              <div>
                <div className="h-48 w-full bg-neutral-100 dark:bg-neutral-850 bg-cover bg-center transition-transform group-hover:scale-101 relative" style={{ backgroundImage: `url('${item.image}')` }}>
                  {item.status === 'Archived' && <div className="absolute top-2 right-2 bg-neutral-800/80 text-white font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Archived</div>}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-sans font-bold text-base text-neutral-850 dark:text-white group-hover:text-[#2a14b4]">{item.name}</h3>
                    <span className="font-mono text-base font-bold text-[#2a14b4] dark:text-[#c1beff]">{formatCurrency(item.price)}</span>
                  </div>
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4">{item.description}</p>
                </div>
              </div>
              <div className="px-4 pb-4 pt-1 border-t border-neutral-50 dark:border-neutral-800 flex justify-between items-center">
                <span className="font-sans text-[10px] uppercase font-bold text-[#5b598c] dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full">{item.category}</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {item.badges.slice(0, 2).map((badge, idx) => (
                    <span key={idx} className="bg-[#EEF2FF] text-[#2a14b4] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">{badge}</span>
                  ))}
                  {item.spiciness > 0 && <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 fill-red-500 text-red-500" /></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[#E5E7EB] dark:border-neutral-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f4f5]/65 dark:bg-neutral-950/20 border-b border-[#E5E7EB] dark:border-neutral-850">
                  <th className="px-6 py-4 font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Prep</th>
                  <th className="px-6 py-4 font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Perf</th>
                  <th className="px-6 py-4 font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-neutral-850">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/10 transition-colors group cursor-pointer" onClick={(e) => {
                    if ((e.target).closest('.action-dropdown-btn') || (e.target).closest('.action-menu-dropdown')) return;
                    handleOpenEdit(item);
                  }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-100 dark:border-neutral-800">
                          <img className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" src={item.image} />
                        </div>
                        <div>
                          <p className="font-sans font-bold text-sm text-neutral-800 dark:text-neutral-100">{item.name}</p>
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {item.badges.map((badge, idx) => (
                              <span key={idx} className="bg-[#EEF2FF] dark:bg-[#4338ca]/20 text-[#2a14b4] dark:text-[#c1beff] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center">
                                {badge === 'Vegan' && <Leaf className="w-3 h-3 text-[#10B981] mr-0.5 inline" />}
                                {badge === 'New' && <Sparkles className="w-3 h-3 text-[#2a14b4] mr-0.5 inline" />}
                                <span>{badge}</span>
                              </span>
                            ))}
                            {item.spiciness > 0 && (
                              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <Flame className="w-3 h-3 text-red-500 fill-red-500" /><span>Spicy</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wide">{item.category}</td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[#2a14b4] dark:text-[#c3c0ff]">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 font-sans text-xs text-neutral-500 dark:text-neutral-400">{item.prepTime} min</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-24">
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.metrics.color === 'success' ? 'bg-[#10B981]' : item.metrics.color === 'pending' ? 'bg-[#F59E0B]' : 'bg-neutral-400'}`} style={{ width: `${item.metrics.value}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 tracking-tight leading-none">{item.metrics.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'Available' ? (
                        <span className="bg-emerald-50 text-[#10B981] dark:bg-emerald-900/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Available</span>
                      ) : (
                        <span className="bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Archived</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)} className="action-dropdown-btn p-1.5 hover:bg-neutral-150 rounded-lg transition-colors cursor-pointer">
                          <MoreVertical className="w-5 h-5 text-neutral-400" />
                        </button>
                        {openDropdownId === item.id && (
                          <div className="action-menu-dropdown absolute right-0 mt-1 w-36 bg-white dark:bg-neutral-850 rounded-lg shadow-lg border border-[#E5E7EB] dark:border-neutral-800 py-1 z-20 font-sans text-xs">
                            <button onClick={() => handleOpenEdit(item)} className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-700 dark:text-white flex items-center gap-2 font-medium">
                              <FileEdit className="w-4 h-4 text-neutral-400" /><span>Edit</span>
                            </button>
                            <button onClick={() => {
                              setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, status: m.status === 'Available' ? 'Archived' : 'Available' } : m));
                              setOpenDropdownId(null);
                            }} className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-700 dark:text-white flex items-center gap-2 font-medium">
                              <FolderMinus className="w-4 h-4 text-neutral-400" /><span>{item.status === 'Available' ? 'Archive' : 'Activate'}</span>
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-[#ba1a1a] flex items-center gap-2 font-bold">
                              <Trash2 className="w-4 h-4 text-[#ba1a1a]" /><span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <StatCard icon={Utensils} label="Active Items" value={activeCount} accent="primary" />
        <StatCard icon={Clock} label="Avg Prep Time" value={`${avgPrepTime} min`} accent="secondary" />
        <StatCard icon={Sparkles} label="Top Category" value={topCategory} accent="primary" />
      </section>

      {isEditorOpen && (
        <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex justify-end">
          <div className="absolute inset-0" onClick={() => setIsEditorOpen(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col justify-between z-10">
            <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-neutral-850 flex items-center justify-between">
              <div>
                <h2 className="font-sans text-lg font-bold text-neutral-800 dark:text-white">{editingItemId ? 'Edit' : 'New Item'}</h2>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <section className="space-y-2">
                <label className="block font-sans text-xs font-bold text-neutral-500 uppercase tracking-widest">Photo</label>
                <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden transition-all bg-cover bg-center" style={{ backgroundImage: `url('${formImage || IMAGE_PRESETS[0].url}')` }}>
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-center text-white text-[10px] font-sans">Preset Loaded</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-sans text-xs">
                  <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Select Preset:</span>
                  {IMAGE_PRESETS.map((preset, pidx) => (
                    <button key={pidx} onClick={() => setFormImage(preset.url)} className={`px-2.5 py-1 rounded bg-[#f3f4f5] dark:bg-neutral-800 border text-[11px] cursor-pointer hover:border-[#2a14b4] ${formImage === preset.url ? 'border-[#2a14b4] font-bold text-[#2a14b4]' : 'border-transparent'}`}>{preset.label}</button>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                    <label className="block font-sans text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Truffle Tagliatelle" className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white" />
                </div>
                <div className="col-span-4">
                  <label className="block font-sans text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Price ($)</label>
                  <input type="text" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="24.00" className="w-full font-mono bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm font-semibold dark:text-white text-right" />
                </div>
              </div>

              <section>
                <label className="block font-sans text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Category</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:text-white">
                  {['Starters', 'Mains', 'Desserts', 'Beverages', 'Asian Fusion'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </section>

              <section>
                <label className="block font-sans text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Gourmet handmade pasta with white truffle infusion..." className="w-full text-xs bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all dark:text-white" />
              </section>

              <div className="bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl p-4 space-y-4 border border-[#E5E7EB] dark:border-neutral-800">
                <h3 className="font-sans text-sm font-bold text-neutral-800 dark:text-white">Details</h3>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Badges</label>
                  <div className="flex flex-wrap gap-2">
                    {BADGE_OPTIONS.map((badge) => (
                      <button key={badge} onClick={() => handleToggleBadge(badge)} className={`px-3 py-1.5 rounded-full font-sans text-[11px] font-bold transition-all cursor-pointer ${formBadges.includes(badge) ? 'bg-[#EEF2FF] border border-[#2a14b4] text-[#2a14b4]' : 'bg-white dark:bg-neutral-800 border border-neutral-200 text-neutral-500'}`}>{badge}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Ingredients</label>
                  <input type="text" value={formIngredients} onChange={(e) => setFormIngredients(e.target.value)} placeholder="Semolina, water, truffle paste, pecorino romano" className="w-full text-xs bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 outline-none dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Calories</label>
                    <input type="number" value={formCalories} onChange={(e) => setFormCalories(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-lg text-xs outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Prep (min)</label>
                    <input type="number" value={formPrepTime} onChange={(e) => setFormPrepTime(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 px-3 py-2 rounded-lg text-xs outline-none dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Spiciness Rating</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max="5" value={formSpiciness} onChange={(e) => setFormSpiciness(parseInt(e.target.value))} className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#2a14b4]" />
                    <div className="flex gap-0.5 text-[#2a14b4]">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Flame key={level} className={`w-4 h-4 ${level <= formSpiciness ? 'text-red-500 fill-red-500' : 'text-neutral-300 dark:text-neutral-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-[#191c1d] border border-[#E5E7EB] dark:border-neutral-800 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  <div>
                    <p className="font-semibold text-xs text-neutral-800 dark:text-white">Available on Menu</p>
                    <p className="text-neutral-400 text-[10px]">Visible on menus.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formAvailable} onChange={(e) => setFormAvailable(e.target.checked)} className="sr-only peer" />
                  <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a14b4]" />
                </label>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-[#E5E7EB] dark:border-neutral-850 flex items-center gap-3 bg-white dark:bg-neutral-900">
              <button onClick={() => setIsEditorOpen(false)} className="flex-1 py-3 border border-[#E5E7EB] dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 font-sans text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-50 transition-all cursor-pointer text-center">Cancel</button>
              <button onClick={handleSaveItemSubmit} className="flex-1 py-3 bg-[#2a14b4] hover:opacity-90 transition-all text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer text-center shadow-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
