import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Flame, ChefHat } from 'lucide-react';

const SPICE_LABELS = ['Mild', 'Light', 'Medium', 'Hot', 'Very Hot', 'Extreme'];

export default function DishDetailModal({
  isOpen,
  onClose,
  item,
}) {
  if (!item) return null;

  const spiceLabel = item.spiciness != null ? SPICE_LABELS[Math.min(item.spiciness, 5)] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-on-background/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full sm:max-w-xl bg-surface sm:rounded-2xl shadow-xl border border-border overflow-hidden rounded-t-2xl z-10 max-h-[92dvh] sm:max-h-[85vh] flex flex-col"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: item?.colorLeak
                  ? `radial-gradient(ellipse at 50% 20%, ${item.colorLeak}cc 0%, ${item.colorLeak}33 60%, transparent 80%)`
                  : 'none',
              }}
            />

            <div className="relative h-48 sm:h-56 bg-surface-container-low flex items-center justify-center overflow-hidden">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-surface/80 backdrop-blur-md text-on-surface hover:bg-surface-container-high hover:scale-105 active:scale-95 rounded-full transition-transform"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex items-center justify-center relative z-10">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full spin-slow"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-4xl">🍽</div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 relative">
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1.5">
                  {item.badges?.map((badge) => (
                    <span
                      key={badge}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: item.colorLeak + '18',
                        color: item.colorLeak,
                        border: `1px solid ${item.colorLeak}33`,
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif italic font-semibold text-2xl sm:text-3xl text-on-surface leading-tight">
                  {item.name}
                </h3>
                <span className="inline-block bg-surface-container-high text-on-surface-variant border border-outline-variant font-sans font-semibold text-[10px] tracking-wider px-2 py-0.5 rounded-full">
                  {item.category}
                </span>
              </div>

              <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                {item.description}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {item.calories != null && (
                  <div className="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1.5">
                    <Flame className="w-5 h-5 text-secondary" />
                    <span className="font-mono font-bold text-sm text-on-surface">{item.calories}</span>
                    <span className="text-[10px] text-on-surface-variant/60 font-sans font-medium uppercase tracking-wider">Calories</span>
                  </div>
                )}
                {item.prepTime != null && (
                  <div className="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1.5">
                    <Clock className="w-5 h-5 text-secondary" />
                    <span className="font-mono font-bold text-sm text-on-surface">{item.prepTime}</span>
                    <span className="text-[10px] text-on-surface-variant/60 font-sans font-medium uppercase tracking-wider">Minutes</span>
                  </div>
                )}
                {spiceLabel && (
                  <div className="bg-surface-container-low rounded-xl p-3 flex flex-col items-center gap-1.5">
                    <Flame className="w-5 h-5 text-secondary" />
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i < item.spiciness ? 'bg-secondary' : 'bg-outline-variant/40'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-on-surface-variant/60 font-sans font-medium uppercase tracking-wider">{spiceLabel}</span>
                  </div>
                )}
              </div>

              {item.ingredients && (
                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4" /> Ingredients
                  </h4>
                  <p className="font-sans text-sm text-on-surface leading-relaxed">
                    {item.ingredients}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}