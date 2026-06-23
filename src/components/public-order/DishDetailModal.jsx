import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Flame, Tag, ChefHat, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

export default function DishDetailModal({
  isOpen,
  onClose,
  item,
  onAddToOrder,
}) {
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSpecialNotes('');
      setSuccessState(false);
    }
  }, [isOpen, item]);

  if (!item) return null;

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

              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex items-center justify-center p-1 relative z-10">
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
                <div className="flex flex-wrap gap-2">
                  <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant font-sans font-semibold text-[10px] tracking-wider px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-serif italic font-semibold text-2xl sm:text-3xl text-on-surface leading-tight">
                  {item.name}
                </h3>
                <p className="font-mono text-price-lg text-secondary font-semibold tracking-tight">
                  {formatCurrency(item.price)}
                </p>
              </div>

              <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                {item.description}
              </p>

              <div className="space-y-2">
                <label
                  htmlFor="special-notes-input"
                  className="block font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest"
                >
                  Special Instructions
                </label>
                <textarea
                  id="special-notes-input"
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Allergy to garlic, extra sauce, dressing on the side..."
                  className="w-full text-sm rounded-lg border border-border p-3 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40 bg-surface resize-none font-sans"
                />
              </div>
            </div>

            <div className="border-t border-border bg-surface-container-lowest p-4 flex items-center justify-between gap-4">
              <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-105 active:scale-95 transition-all"
                  aria-label="Decrease quantity"
                >
                  <span className="text-xl font-bold font-mono">-</span>
                </button>
                <span className="w-12 text-center font-mono text-price-lg text-on-surface font-semibold select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-md text-primary hover:bg-primary-container hover:text-on-primary-container hover:scale-105 active:scale-95 transition-all"
                  aria-label="Increase quantity"
                >
                  <span className="text-xl font-bold font-mono">+</span>
                </button>
              </div>

              <button
                disabled={successState}
                onClick={() => {
                  setSuccessState(true);
                  setTimeout(() => {
                    onAddToOrder(item, quantity, specialNotes);
                    onClose();
                  }, 850);
                }}
                className={`flex-1 h-12 rounded-lg font-sans font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm ${
                  successState
                    ? 'bg-success text-white'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {successState ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" /> Added!
                  </>
                ) : (
                  <>
                    Add to Order
                    <span className="mx-1 font-light opacity-60">|</span>
                    <span className="font-mono">{formatCurrency(item.price * quantity)}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
