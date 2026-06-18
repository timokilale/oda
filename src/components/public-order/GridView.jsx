import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Info, X } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

export default function GridView({
  items,
  onOpenDetails,
  onAddItem,
  cartQuantities,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = [...new Set((items || []).map((i) => i.category).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface border-b border-border p-4 space-y-3 relative z-10 shadow-sm shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-surface-container-low text-sm rounded-lg border border-border pl-10 pr-9 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/30 font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-on-surface-variant/40 hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-hidden shrink-0">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5 w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap tracking-wide select-none transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary font-medium'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant/50 space-y-2">
            <Search className="w-10 h-10 stroke-[1.5]" />
            <h4 className="font-semibold text-sm font-sans text-on-surface">No items match</h4>
            <p className="text-xs max-w-xs font-sans">
              Try adjusting your search or browsing other categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const inCartCount = cartQuantities[item.id] || 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(30,27,75,0.04)] hover:border-outline-variant/60 group transition-all"
                >
                  <div
                    className="relative aspect-square w-full bg-surface-container-low overflow-hidden cursor-pointer"
                    onClick={() => onOpenDetails(item)}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-4xl">
                        🍽
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-65 pointer-events-none" />

                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      <span className="bg-surface/95 text-on-surface-variant font-sans text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm border border-border uppercase shadow-xs">
                        {item.category}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 p-1.5 bg-surface/85 backdrop-blur-md rounded-full shadow-md text-primary opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
                      <Info className="w-3.5 h-3.5" />
                    </div>

                    {inCartCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 bg-primary text-on-primary font-mono text-[10px] font-bold h-5.5 px-2 rounded-full flex items-center justify-center shadow-md border border-white/20">
                        {inCartCount} Ordered
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-serif italic font-semibold text-[15px] leading-snug text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed min-h-[2rem]">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-surface-container">
                      <span className="font-mono text-price-sm font-bold text-on-background">
                        {formatCurrency(item.price)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddItem(item, 1);
                        }}
                        className="p-1.5 rounded-lg bg-surface-container hover:bg-primary hover:text-on-primary text-primary transition-all active:scale-90 flex items-center justify-center shadow-xs cursor-pointer border border-border/80"
                        title="Add 1 to Order"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
